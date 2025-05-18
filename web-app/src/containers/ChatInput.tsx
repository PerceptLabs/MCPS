'use client'

import TextareaAutosize from 'react-textarea-autosize'
import { cn } from '@/lib/utils'
import { usePrompt } from '@/hooks/usePrompt'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import {
  IconPaperclip,
  IconWorld,
  IconAtom,
  IconMicrophone,
  IconEye,
  IconTool,
  IconCodeCircle2,
  IconPlayerStopFilled,
  IconBrandSpeedtest,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useGeneralSetting } from '@/hooks/useGeneralSetting'
import { useModelProvider } from '@/hooks/useModelProvider'
import {
  emptyThreadContent,
  extractToolCall,
  newAssistantThreadContent,
  newUserThreadContent,
  postMessageProcessing,
  sendCompletion,
  startModel,
} from '@/lib/completion'
import { useThreads } from '@/hooks/useThreads'
import { defaultModel } from '@/lib/models'
import { useMessages } from '@/hooks/useMessages'
import { useRouter } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useAppState } from '@/hooks/useAppState'
import { MovingBorder } from './MovingBorder'
import { MCPTool } from '@/types/completion'
import { listen } from '@tauri-apps/api/event'
import { SystemEvent } from '@/types/events'
import { CompletionMessagesBuilder } from '@/lib/messages'
import { ChatCompletionMessageToolCall } from 'openai/resources'
import { getTools } from '@/services/mcp'

type ChatInputProps = {
  className?: string
  showSpeedToken?: boolean
}

const ChatInput = ({ className, showSpeedToken = true }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [rows, setRows] = useState(1)
  const [tools, setTools] = useState<MCPTool[]>([])
  const { prompt, setPrompt } = usePrompt()
  const { t } = useTranslation()
  const { spellCheckChatInput } = useGeneralSetting()
  const maxRows = 10

  const { getProviderByName, selectedModel, selectedProvider } =
    useModelProvider()

  const { getCurrentThread: retrieveThread, createThread } = useThreads()
  const { streamingContent, updateStreamingContent, updateLoadingModel } =
    useAppState()
  const { addMessage } = useMessages()
  const router = useRouter()

  const provider = useMemo(() => {
    return getProviderByName(selectedProvider)
  }, [selectedProvider, getProviderByName])

  useEffect(() => {
    const handleFocusIn = () => {
      if (document.activeElement === textareaRef.current) {
        setIsFocused(true)
      }
    }

    const handleFocusOut = () => {
      if (document.activeElement !== textareaRef.current) {
        setIsFocused(false)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  useEffect(() => {
    function updateTools() {
      getTools().then((data: MCPTool[]) => {
        setTools(data)
      })
    }
    updateTools()

    let unsubscribe = () => {}
    listen(SystemEvent.MCP_UPDATE, updateTools).then((unsub) => {
      // Unsubscribe from the event when the component unmounts
      unsubscribe = unsub
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const getCurrentThread = useCallback(async () => {
    let currentThread = retrieveThread()
    if (!currentThread) {
      currentThread = await createThread(
        {
          id: selectedModel?.id ?? defaultModel(selectedProvider),
          provider: selectedProvider,
        },
        prompt
      )
      router.navigate({
        to: route.threadsDetail,
        params: { threadId: currentThread.id },
      })
    }
    return currentThread
  }, [
    createThread,
    prompt,
    retrieveThread,
    router,
    selectedModel?.id,
    selectedProvider,
  ])

  const sendMessage = useCallback(async () => {
    const activeThread = await getCurrentThread()

    if (!activeThread || !provider) return

    updateStreamingContent(emptyThreadContent)
    addMessage(newUserThreadContent(activeThread.id, prompt))
    setPrompt('')
    try {
      if (selectedModel?.id) {
        updateLoadingModel(true)
        await startModel(provider.provider, selectedModel.id).catch(
          console.error
        )
        updateLoadingModel(false)
      }

      const builder = new CompletionMessagesBuilder()
      // REMARK: Would it possible to not attach the entire message history to the request?
      // TODO: If not amend messages history here
      builder.addUserMessage(prompt)

      let isCompleted = false

      while (!isCompleted) {
        const completion = await sendCompletion(
          activeThread,
          provider,
          builder.getMessages(),
          tools
        )

        if (!completion) throw new Error('No completion received')
        let accumulatedText = ''
        const currentCall: ChatCompletionMessageToolCall | null = null
        const toolCalls: ChatCompletionMessageToolCall[] = []
        for await (const part of completion) {
          const delta = part.choices[0]?.delta?.content || ''
          if (part.choices[0]?.delta?.tool_calls) {
            extractToolCall(part, currentCall, toolCalls)
          }
          if (delta) {
            accumulatedText += delta
            // Create a new object each time to avoid reference issues
            // Use a timeout to prevent React from batching updates too quickly
            const currentContent = newAssistantThreadContent(
              activeThread.id,
              accumulatedText
            )
            updateStreamingContent(currentContent)
            await new Promise((resolve) => setTimeout(resolve, 0))
          }
        }
        // Create a final content object for adding to the thread
        const finalContent = newAssistantThreadContent(
          activeThread.id,
          accumulatedText
        )
        builder.addAssistantMessage(accumulatedText, undefined, toolCalls)
        const updatedMessage = await postMessageProcessing(
          toolCalls,
          builder,
          finalContent
        )
        addMessage(updatedMessage ?? finalContent)

        isCompleted = !toolCalls.length
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
    updateStreamingContent(undefined)
  }, [
    getCurrentThread,
    provider,
    updateStreamingContent,
    addMessage,
    prompt,
    setPrompt,
    selectedModel,
    tools,
    updateLoadingModel,
  ])

  return (
    <div className="relative">
      <div
        className={cn(
          'relative overflow-hidden p-[2px] rounded-lg',
          Boolean(streamingContent) && 'opacity-70'
        )}
      >
        {streamingContent && (
          <div className="absolute inset-0">
            <MovingBorder rx="10%" ry="10%">
              <div
                className={cn(
                  'h-100 w-100 bg-[radial-gradient(var(--app-primary),transparent_60%)]'
                )}
              />
            </MovingBorder>
          </div>
        )}
        <div
          className={cn(
            'relative z-20 px-0 pb-10 border border-main-view-fg/5 rounded-lg text-main-view-fg bg-main-view',
            isFocused && 'ring-1 ring-main-view-fg/10'
          )}
        >
          <TextareaAutosize
            ref={textareaRef}
            disabled={Boolean(streamingContent)}
            minRows={2}
            rows={1}
            maxRows={10}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              // Count the number of newlines to estimate rows
              const newRows = (e.target.value.match(/\n/g) || []).length + 1
              setRows(Math.min(newRows, maxRows))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && prompt) {
                e.preventDefault()
                // Submit the message when Enter is pressed without Shift
                sendMessage()
                // When Shift+Enter is pressed, a new line is added (default behavior)
              }
            }}
            placeholder={t('common.placeholder.chatInput')}
            autoFocus
            spellCheck={spellCheckChatInput}
            data-gramm={spellCheckChatInput}
            data-gramm_editor={spellCheckChatInput}
            data-gramm_grammarly={spellCheckChatInput}
            className={cn(
              'bg-transparent pt-4 w-full flex-shrink-0 border-none resize-none outline-0 px-4',
              rows < maxRows && 'scrollbar-hide',
              className
            )}
          />
        </div>
      </div>
      <div className="absolute z-20 bg-transparent bottom-0 w-full p-2 ">
        <div className="flex justify-between items-center w-full">
          <div className="px-1 flex items-center gap-1">
            <div
              className={cn(
                'px-1 flex items-center gap-1',
                streamingContent && 'opacity-50 pointer-events-none'
              )}
            >
              {/* File attachment - always available */}
              <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                <IconPaperclip size={18} className="text-main-view-fg/50" />
              </div>

              {/* Microphone - always available */}
              <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                <IconMicrophone size={18} className="text-main-view-fg/50" />
              </div>

              {selectedModel?.capabilities?.includes('vision') && (
                <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                  <IconEye size={18} className="text-main-view-fg/50" />
                </div>
              )}

              {selectedModel?.capabilities?.includes('embeddings') && (
                <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                  <IconCodeCircle2 size={18} className="text-main-view-fg/50" />
                </div>
              )}

              {selectedModel?.capabilities?.includes('tools') && (
                <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                  <IconTool size={18} className="text-main-view-fg/50" />
                </div>
              )}

              {selectedModel?.capabilities?.includes('web_search') && (
                <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                  <IconWorld size={18} className="text-main-view-fg/50" />
                </div>
              )}

              {selectedModel?.capabilities?.includes('reasoning') && (
                <div className="h-6 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                  <IconAtom size={18} className="text-main-view-fg/50" />
                </div>
              )}
            </div>

            {showSpeedToken && (
              <div className="flex items-center gap-1 text-main-view-fg/60 text-xs">
                <IconBrandSpeedtest size={18} />
                <span>42 tokens/sec</span>
              </div>
            )}
          </div>

          {streamingContent ? (
            <Button variant="destructive" size="icon">
              <IconPlayerStopFilled />
            </Button>
          ) : (
            <Button
              variant={!prompt ? null : 'default'}
              size="icon"
              disabled={!prompt}
              onClick={sendMessage}
            >
              {streamingContent ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <ArrowRight className="text-primary-fg" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInput
