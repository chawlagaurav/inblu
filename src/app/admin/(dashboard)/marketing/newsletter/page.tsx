'use client'

import { useState, useEffect } from 'react'
import { Send, Users, Loader2, CheckCircle, AlertCircle, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion'
import { toast } from 'sonner'

interface Subscriber {
  id: string
  email: string
  source: string
  createdAt: string
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sendResult, setSendResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter')
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error)
      toast.error('Failed to load subscribers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !content.trim()) {
      toast.error('Please fill in both subject and content')
      return
    }

    if (subscribers.length === 0) {
      toast.error('No subscribers to send to')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this newsletter to ${subscribers.length} subscribers?`
    )
    
    if (!confirmed) return

    setIsSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      })

      const data = await response.json()

      if (response.ok) {
        setSendResult({ success: true, message: data.message })
        toast.success(data.message)
        // Clear form on success
        setSubject('')
        setContent('')
      } else {
        setSendResult({ success: false, message: data.error })
        toast.error(data.error)
      }
    } catch (error) {
      const message = 'Failed to send newsletter'
      setSendResult({ success: false, message })
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Newsletter</h1>
          <p className="text-slate-500 mt-1">Send email campaigns to your subscribers</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Section */}
        <FadeIn delay={0.05} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Compose Newsletter
              </CardTitle>
              <CardDescription>
                Write your email content. Use **text** for bold and *text* for italic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., New Products Just Arrived!"
                    className="mt-1"
                    disabled={isSending}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Email Content *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your newsletter content here...

You can use simple formatting:
**bold text** for emphasis
*italic text* for styling

The email will include your logo and a link to your store automatically."
                    rows={12}
                    className="mt-1 font-mono text-sm"
                    disabled={isSending}
                  />
                </div>

                {sendResult && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      sendResult.success
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {sendResult.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span>{sendResult.message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSending || subscribers.length === 0}
                  className="w-full sm:w-auto"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending to {subscribers.length} subscribers...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {subscribers.length} Subscribers
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Subscribers List */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Subscribers
              </CardTitle>
              <CardDescription>
                {subscribers.length} total subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No subscribers yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {subscriber.email}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {subscriber.source}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {formatDate(subscriber.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
