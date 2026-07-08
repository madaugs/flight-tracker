'use client'

import { Suspense } from 'react'
import ShareContent from './ShareContent'
import AppShell from '@/components/layout/AppShell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SharePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex justify-center py-10"><LoadingSpinner /></div>}>
        <ShareContent />
      </Suspense>
    </AppShell>
  )
}
