import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Proxy route for purchase-order document downloads.
 *
 * Why this exists:
 *   PDFs uploaded as `resource_type: 'raw'` to Cloudinary are gated by an
 *   account-level "Allow delivery of PDF and ZIP files" policy. On accounts
 *   where that toggle is off, every CDN delivery URL — public, signed, or
 *   otherwise — returns 401 ("X-Cld-Error: deny or ACL failure"). The admin
 *   couldn't access the Cloudinary console to flip the toggle, so we route
 *   document fetches through this server-side proxy instead.
 *
 * How it works:
 *   1. Verify the caller is an admin (uses the same Supabase + Prisma
 *      pattern as the sibling PO routes).
 *   2. Load the PO row and pull its stored `fileUrl`.
 *   3. Parse out the Cloudinary public_id and resource_type from the URL.
 *   4. Sign a short-lived (60s) request to `api.cloudinary.com/.../download` —
 *      that endpoint authenticates with our API key/secret and is NOT subject
 *      to the PDF delivery toggle.
 *   5. Stream the bytes back to the admin with `Content-Disposition: inline`
 *      so the browser opens the PDF in a tab (matching the previous direct-
 *      link behaviour).
 *
 * If/when the Cloudinary "Allow delivery of PDF and ZIP files" setting is
 * enabled, we can drop this proxy and switch `View Doc` links back to
 * `po.fileUrl` — nothing else depends on it.
 */

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

/**
 * Parse a Cloudinary delivery URL into the pieces needed to sign an
 * admin-API download request.
 *
 * Expected shape:
 *   https://res.cloudinary.com/<cloud>/<resourceType>/upload/v<n>/<public_id>
 *
 * Returns null for anything that doesn't match (e.g. a manually-edited
 * fileUrl pointing somewhere else). The caller treats that as a 400.
 */
function parseCloudinaryUrl(url: string): { resourceType: string; publicId: string } | null {
  try {
    const u = new URL(url)
    if (!u.hostname.endsWith('cloudinary.com')) return null
    // pathname: /<cloud>/<resourceType>/upload/v<n>/<rest...>
    const parts = u.pathname.split('/').filter(Boolean)
    const uploadIdx = parts.indexOf('upload')
    if (uploadIdx < 2 || uploadIdx >= parts.length - 1) return null
    const resourceType = parts[uploadIdx - 1] // e.g. 'raw', 'image'
    // Skip an optional version segment (v<digits>) right after 'upload'.
    let publicIdStart = uploadIdx + 1
    if (/^v\d+$/.test(parts[publicIdStart])) publicIdStart += 1
    const publicId = parts.slice(publicIdStart).join('/')
    if (!publicId) return null
    return { resourceType, publicId }
  } catch {
    return null
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, poNumber: true, fileUrl: true },
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (!po.fileUrl) {
      return NextResponse.json({ error: 'No document attached to this PO' }, { status: 404 })
    }

    const parsed = parseCloudinaryUrl(po.fileUrl)
    if (!parsed) {
      // Not a Cloudinary URL — fall back to a redirect so anything stored in
      // the past via a different provider still works.
      return NextResponse.redirect(po.fileUrl, 302)
    }

    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json({ error: 'Cloudinary credentials not configured' }, { status: 500 })
    }

    // Build a signed admin-API download URL. The signature must be sha1(
    //   <alphabetically-sorted params, joined as k=v&k=v> + api_secret
    // ) — same algorithm Cloudinary's SDK uses internally.
    const timestamp = Math.floor(Date.now() / 1000)
    const expiresAt = timestamp + 60
    const paramsToSign: Record<string, string> = {
      expires_at: String(expiresAt),
      public_id: parsed.publicId,
      timestamp: String(timestamp),
      type: 'upload',
    }
    const signString = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join('&')
    const signature = crypto
      .createHash('sha1')
      .update(signString + apiSecret)
      .digest('hex')

    const downloadUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/${parsed.resourceType}/download?` +
      new URLSearchParams({
        ...paramsToSign,
        signature,
        api_key: apiKey,
      }).toString()

    // Fetch the bytes server-side. The api.cloudinary.com endpoint is NOT
    // subject to the public-PDF-delivery account toggle, so this succeeds
    // even when `res.cloudinary.com/...pdf` is blocked.
    const upstream = await fetch(downloadUrl)
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '')
      console.error('Cloudinary download failed:', upstream.status, text.slice(0, 300))
      return NextResponse.json(
        { error: 'Failed to fetch document from Cloudinary' },
        { status: 502 }
      )
    }

    // Mirror the upstream content-type so the browser renders the PDF
    // inline instead of treating it as application/octet-stream.
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')

    // Suggest a filename based on the PO number (falls back to the file's
    // basename) so save-as gets something sensible. `inline` keeps the
    // existing UX of opening in a new tab rather than forcing a download.
    const filename = po.poNumber
      ? `${po.poNumber}.pdf`
      : parsed.publicId.split('/').pop() || 'purchase-order.pdf'

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename.replace(/"/g, '')}"`,
      // No-store: the signed upstream URL is short-lived and these documents
      // are admin-only — better not to have intermediaries cache them.
      'Cache-Control': 'private, no-store',
    }
    if (contentLength) headers['Content-Length'] = contentLength

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (error) {
    console.error('Error proxying purchase order document:', error)
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 })
  }
}
