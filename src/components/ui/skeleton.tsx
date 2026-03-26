import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-sky-100',
        className
      )}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  )
}

function SkeletonProductGrid({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 lg:px-8", className)}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

function SkeletonProductDetails() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="rounded-2xl border bg-white">
      <div className="border-b p-4">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonStats() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-8 w-3/4" />
        </div>
      ))}
    </div>
  )
}

function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

function SkeletonTestimonialCard() {
  return (
    <div className="rounded-2xl border bg-sky-50/50 p-6">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-4 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-8 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-sky-100">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

function SkeletonTestimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonTestimonialCard key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonProductGrid,
  SkeletonProductDetails,
  SkeletonTable,
  SkeletonStats,
  SkeletonText,
  SkeletonTestimonialCard,
  SkeletonTestimonials,
}
