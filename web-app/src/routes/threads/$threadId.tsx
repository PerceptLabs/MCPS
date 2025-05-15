import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { UIEventHandler } from 'react'
import HeaderPage from '@/containers/HeaderPage'

import { useThreads } from '@/hooks/useThreads'
import ChatInput from '@/containers/ChatInput'
import DropdownModelProvider from '@/containers/DropdownModelProvider'
import { useShallow } from 'zustand/react/shallow'
import { ThreadContent } from '@/containers/ThreadContent'
import { StreamingContent } from '@/containers/StreamingContent'
import debounce from 'lodash.debounce'
import { cn } from '@/lib/utils'
import { ArrowDown } from 'lucide-react'
import { ModelLoader } from '@/containers/laoders/ModelLoader'
import { useMessages } from '@/hooks/useMessages'
import { fetchMessages } from '@/services/messages'
import { useAppState } from '@/hooks/useAppState'

// as route.threadsDetail
export const Route = createFileRoute('/threads/$threadId')({
  component: ThreadDetail,
})

function ThreadDetail() {
  const { threadId } = useParams({ from: Route.id })
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const lastScrollTopRef = useRef(0)
  const { currentThreadId, getThreadById, setCurrentThreadId } = useThreads()
  const { setMessages } = useMessages()
  const { streamingContent, loadingModel } = useAppState()

  const { messages } = useMessages(
    useShallow((state) => ({
      messages: state.messages[threadId],
    }))
  )

  const thread = useMemo(
    () => getThreadById(threadId),
    [threadId, getThreadById]
  )
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (currentThreadId !== threadId) setCurrentThreadId(threadId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, currentThreadId])

  useEffect(() => {
    fetchMessages(threadId).then((fetchedMessages) => {
      if (fetchedMessages) {
        // Update the messages in the store
        setMessages(threadId, fetchedMessages)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId])

  useEffect(() => {
    return () => {
      // Clear the current thread ID when the component unmounts
      setCurrentThreadId(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom when component mounts or thread content changes
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    // Always scroll to bottom on first render or when thread changes
    if (isFirstRender.current) {
      isFirstRender.current = false
      scrollToBottom()
      setIsAtBottom(true)
      setIsUserScrolling(false)
      return
    }
  }, [])

  // Reset scroll state when thread changes
  useEffect(() => {
    isFirstRender.current = true
    scrollToBottom()
    setIsAtBottom(true)
    setIsUserScrolling(false)
  }, [threadId])

  // Single useEffect for all auto-scrolling logic
  useEffect(() => {
    // Only auto-scroll when the user is not actively scrolling
    // AND either at the bottom OR there's streaming content
    if (!isUserScrolling && (streamingContent || isAtBottom)) {
      // Use non-smooth scrolling for auto-scroll to prevent jank
      scrollToBottom(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingContent, isUserScrolling])

  const scrollToBottom = (smooth = false) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        ...(smooth ? { behavior: 'smooth' } : {}),
      })
    }
  }

  const handleScroll: UIEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    // Use a small tolerance to better detect when we're at the bottom
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10

    // Detect if this is a user-initiated scroll
    if (Math.abs(scrollTop - lastScrollTopRef.current) > 10) {
      setIsUserScrolling(!isBottom)
    }
    setIsAtBottom(isBottom)
    lastScrollTopRef.current = scrollTop
  }

  // Separate handler for DOM events
  const handleDOMScroll = (e: Event) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    // Use a small tolerance to better detect when we're at the bottom
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10

    // Detect if this is a user-initiated scroll
    if (Math.abs(scrollTop - lastScrollTopRef.current) > 10) {
      setIsUserScrolling(!isBottom)
    }
    setIsAtBottom(isBottom)
    lastScrollTopRef.current = scrollTop
  }

  // Use a shorter debounce time for more responsive scrolling
  const debouncedScroll = debounce(handleDOMScroll)

  useEffect(() => {
    const chatHistoryElement = scrollContainerRef.current
    if (chatHistoryElement) {
      chatHistoryElement.addEventListener('scroll', debouncedScroll)
      return () =>
        chatHistoryElement.removeEventListener('scroll', debouncedScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const threadModel = useMemo(() => thread?.model, [thread])

  if (!messages || !threadModel) return null

  return (
    <div className="flex flex-col h-full">
      <HeaderPage>
        <DropdownModelProvider model={threadModel} />
        {thread?.model?.provider === 'llama.cpp' && loadingModel && (
          <ModelLoader />
        )}
      </HeaderPage>
      <div className="flex flex-col h-[calc(100%-40px)] ">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn(
            'flex flex-col h-full w-full overflow-auto px-4 pt-4 pb-3'
          )}
        >
          <div className="max-w-none w-4/6 mx-auto">
            {messages &&
              messages.map((item, index) => {
                // Only pass isLastMessage to the last message in the array
                const isLastMessage = index === messages.length - 1
                return (
                  <div
                    key={item.id}
                    data-test-id={`message-${item.id}`}
                    data-message-author-role={item.role}
                    className="mb-4"
                  >
                    <ThreadContent {...item} isLastMessage={isLastMessage} />
                  </div>
                )
              })}
            <StreamingContent />
          </div>
        </div>
        <div className="w-4/6 mx-auto pt-2 pb-3 shrink-0 relative">
          <div
            className={cn(
              'from-main-view/20 bg-gradient-to-b to-main-view absolute z-0 -top-6 h-8 py-1 flex w-full justify-center backdrop-blur pointer-events-none opacity-0 visibility-hidden',
              !isAtBottom && 'visibility-visible opacity-100'
            )}
          >
            <div
              className="bg-main-view-fg/10 px-4 border border-main-view-fg/5 flex items-center justify-center rounded-xl gap-x-2 cursor-pointer pointer-events-auto"
              onClick={() => {
                scrollToBottom(true)
                setIsUserScrolling(false)
              }}
            >
              <p className="text-xs">Scroll to bottom</p>
              <ArrowDown size={12} />
            </div>
          </div>
          <ChatInput />
        </div>
      </div>
    </div>
  )
}
