import { ThreadMessage } from '@janhq/core'
import { RenderMarkdown } from './RenderMarkdown'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import {
  IconCopy,
  IconCopyCheck,
  IconRefresh,
  IconTrash,
  IconPencil,
} from '@tabler/icons-react'
import { useAppState } from '@/hooks/useAppState'
import { cn } from '@/lib/utils'
import { useMessages } from '@/hooks/useMessages'
import ThinkingBlock from '@/containers/ThinkingBlock'
import ToolCallBlock from '@/containers/ToolCallBlock'
import { useChat } from '@/hooks/useChat'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDate } from '@/utils/formatDate'

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className="flex items-center gap-1 hover:text-accent transition-colors group relative cursor-pointer"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <IconCopyCheck size={16} className="text-accent" />
          <span className="opacity-100">Copied!</span>
        </>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <IconCopy size={16} />
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>
      )}
    </button>
  )
}

// Use memo to prevent unnecessary re-renders, but allow re-renders when props change
export const ThreadContent = memo(
  (
    item: ThreadMessage & {
      isLastMessage?: boolean
      index?: number
      showAssistant?: boolean
    }
  ) => {
    const [message, setMessage] = useState(item.content?.[0]?.text?.value || '')

    // Use useMemo to stabilize the components prop
    const linkComponents = useMemo(
      () => ({
        a: ({ ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
      }),
      []
    )
    const image = useMemo(() => item.content?.[0]?.image_url, [item])
    const { streamingContent } = useAppState()

    const text = useMemo(
      () => item.content.find((e) => e.type === 'text')?.text?.value ?? '',
      [item.content]
    )

    const { reasoningSegment, textSegment } = useMemo(() => {
      const isThinking = text.includes('<think>') && !text.includes('</think>')
      if (isThinking) return { reasoningSegment: text, textSegment: '' }

      const match = text.match(/<think>([\s\S]*?)<\/think>/)
      if (match?.index === undefined)
        return { reasoningSegment: undefined, textSegment: text }

      const splitIndex = match.index + match[0].length
      return {
        reasoningSegment: text.slice(0, splitIndex),
        textSegment: text.slice(splitIndex),
      }
    }, [text])

    const { getMessages, deleteMessage } = useMessages()
    const { sendMessage } = useChat()

    const regenerate = useCallback(() => {
      // Only regenerate assistant message is allowed
      deleteMessage(item.thread_id, item.id)
      const threadMessages = getMessages(item.thread_id)
      let toSendMessage = threadMessages.pop()
      while (toSendMessage && toSendMessage?.role !== 'user') {
        deleteMessage(toSendMessage.thread_id, toSendMessage.id ?? '')
        toSendMessage = threadMessages.pop()
      }
      if (toSendMessage)
        sendMessage(toSendMessage.content?.[0]?.text?.value || '')
    }, [deleteMessage, getMessages, item, sendMessage])

    const editMessage = useCallback(
      (messageId: string) => {
        const threadMessages = getMessages(item.thread_id)
        const index = threadMessages.findIndex((msg) => msg.id === messageId)
        if (index === -1) return
        // Delete all messages after the edited message
        for (let i = threadMessages.length - 1; i >= index; i--) {
          deleteMessage(threadMessages[i].thread_id, threadMessages[i].id)
        }
        sendMessage(message)
      },
      [deleteMessage, getMessages, item.thread_id, message, sendMessage]
    )

    const isToolCalls =
      item.metadata &&
      'tool_calls' in item.metadata &&
      Array.isArray(item.metadata.tool_calls) &&
      item.metadata.tool_calls.length

    const assistant = item.metadata?.assistant as
      | { avatar?: React.ReactNode; name?: React.ReactNode }
      | undefined

    return (
      <Fragment>
        {item.content?.[0]?.text && item.role === 'user' && (
          <div>
            <div className="flex justify-end w-full">
              <div className="bg-accent text-accent-fg p-2 rounded-md inline-block">
                <p className="select-text">{item.content?.[0].text.value}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 text-main-view-fg/60 text-xs mt-2">
              <Dialog>
                <DialogTrigger>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer group relative">
                        <IconPencil size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Message</DialogTitle>
                    <Textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value)
                      }}
                      className="mt-2 resize-none"
                      onKeyDown={(e) => {
                        // Prevent key from being captured by parent components
                        e.stopPropagation()
                      }}
                    />
                    <DialogFooter className="mt-2 flex items-center">
                      <DialogClose asChild>
                        <Button
                          variant="link"
                          size="sm"
                          className="hover:no-underline"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          disabled={!message}
                          onClick={() => {
                            editMessage(item.id)
                            toast.success('Edit Message', {
                              id: 'edit-message',
                              description:
                                'Message edited successfully. Please wait for the model to respond.',
                            })
                          }}
                        >
                          Save
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer group relative"
                    onClick={() => {
                      deleteMessage(item.thread_id, item.id)
                    }}
                  >
                    <IconTrash size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
        {item.content?.[0]?.text && item.role !== 'user' && (
          <>
            {item.showAssistant && (
              <div className="flex items-center gap-2 mb-3 text-main-view-fg/60">
                <div className="flex items-center gap-2 size-8 rounded-md justify-center border border-main-view-fg/10 bg-main-view-fg/5 p-2">
                  <span className="text-base">{assistant?.avatar || '👋'}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-main-view-fg font-medium">
                    {assistant?.name || 'Jan'}
                  </span>
                  {item?.created_at && (
                    <span className="text-xs mt-0.5">
                      {formatDate(item?.created_at)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {reasoningSegment && (
              <ThinkingBlock
                id={item.index ?? Number(item.id)}
                text={reasoningSegment}
              />
            )}

            <RenderMarkdown content={textSegment} components={linkComponents} />

            {isToolCalls && item.metadata?.tool_calls ? (
              <>
                {(item.metadata.tool_calls as ToolCall[]).map((toolCall) => (
                  <ToolCallBlock
                    id={toolCall.tool?.id ?? 0}
                    name={toolCall.tool?.function?.name ?? ''}
                    key={toolCall.tool?.id}
                    result={JSON.stringify(toolCall.response)}
                    loading={toolCall.state === 'pending'}
                  />
                ))}
              </>
            ) : null}

            {!isToolCalls && (
              <div className="flex items-center gap-2 mt-2 text-main-view-fg/60 text-xs">
                <div
                  className={cn(
                    'flex items-center gap-2',
                    item.isLastMessage &&
                      streamingContent &&
                      'opacity-0 visinility-hidden pointer-events-none'
                  )}
                >
                  <CopyButton text={item.content?.[0]?.text.value || ''} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer group relative"
                        onClick={() => {
                          deleteMessage(item.thread_id, item.id)
                        }}
                      >
                        <IconTrash size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete</p>
                    </TooltipContent>
                  </Tooltip>

                  {item.isLastMessage && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer group relative"
                          onClick={regenerate}
                        >
                          <IconRefresh size={16} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Regenerate</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {item.type === 'image_url' && image && (
          <div>
            <img
              src={image.url}
              alt={image.detail || 'Thread image'}
              className="max-w-full rounded-md"
            />
            {image.detail && <p className="text-sm mt-1">{image.detail}</p>}
          </div>
        )}
      </Fragment>
    )
  }
)
