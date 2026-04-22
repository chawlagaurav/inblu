'use client'

import { SignupForm } from '@/components/auth/signup-form'
import { PageTransition } from '@/components/motion'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <Image src="/inblutextlogo.png" alt="Inblu" width={240} height={96} className="h-20 w-auto mx-auto" />
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-gray-600">
              Join us and start shopping today
            </p>
          </div>
          
          <SignupForm />
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </PageTransition>
  )
}
