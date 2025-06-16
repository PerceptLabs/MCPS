import { Skeleton } from '@/components/ui/skeleton'
import { useAppearance } from '@/hooks/useAppearance'
import { cn } from '@/lib/utils'
import { IconCircleCheckFilled } from '@tabler/icons-react'

export function ChatWidthSwitcher() {
  const { chatWidth, setChatWidth } = useAppearance()

  return (
    <div className="flex gap-4">
      <div
        className={cn(
          'w-full overflow-hidden border border-main-view-fg/10 rounded-md my-2 pb-2 cursor-pointer',
          chatWidth === 'compact' && 'border-accent'
        )}
        onClick={() => setChatWidth('compact')}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-main-view-fg/10">
          <span className="font-medium text-xs font-sans">Compact Width</span>
          {chatWidth === 'compact' && (
            <IconCircleCheckFilled className="size-4 text-accent" />
          )}
        </div>
        <div className="overflow-auto p-2">
          <div className="flex flex-col px-10 gap-2 mt-2">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="bg-main-view-fg/10 h-8 px-4 w-full flex-shrink-0 border-none resize-none outline-0 rounded-2xl flex items-center">
              <span className="text-main-view-fg/50">Ask me anything...</span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'w-full overflow-hidden border border-main-view-fg/10 rounded-md my-2 pb-2 cursor-pointer',
          chatWidth === 'full' && 'border-accent'
        )}
        onClick={() => setChatWidth('full')}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-main-view-fg/10">
          <span className="font-medium text-xs font-sans">Full Width</span>
          {chatWidth === 'full' && (
            <IconCircleCheckFilled className="size-4 text-accent" />
          )}
        </div>
        <div className="overflow-auto p-2">
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="bg-main-view-fg/10 h-8 px-4 w-full flex-shrink-0 border-none resize-none outline-0 rounded-2xl flex items-center">
              <span className="text-main-view-fg/50">Ask me anything...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
