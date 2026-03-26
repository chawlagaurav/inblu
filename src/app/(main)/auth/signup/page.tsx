'use client'

import { SignupForm } from '@/components/auth/signup-form'
import { PageTransition } from '@/components/motion'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-sky-600">
              Inblu
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
              className="font-medium text-sky-600 hover:text-sky-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </PageTransition>
  )
}
