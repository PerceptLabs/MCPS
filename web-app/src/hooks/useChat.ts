import { useCallback, useEffect, useMemo } from 'react'
import { usePrompt } from './usePrompt'
import { useModelProvider } from './useModelProvider'
import { useThreads } from './useThreads'
import { useAppState } from './useAppState'
import { useMessages } from './useMessages'
import { useRouter } from '@tanstack/react-router'
import { defaultModel } from '@/lib/models'
import { route } from '@/constants/routes'
import {
  emptyThreadContent,
  extractToolCall,
  isCompletionResponse,
  newAssistantThreadContent,
  newUserThreadContent,
  postMessageProcessing,
  sendCompletion,
  startModel,
} from '@/lib/completion'
import { CompletionMessagesBuilder } from '@/lib/messages'
import { ChatCompletionMessageToolCall } from 'openai/resources'
import { useAssistant } from './useAssistant'
import { toast } from 'sonner'
import { getTools } from '@/services/mcp'
import { MCPTool } from '@/types/completion'
import { listen } from '@tauri-apps/api/event'
import { SystemEvent } from '@/types/events'

export const useChat = () => {
  const { prompt, setPrompt } = usePrompt()
  const {
    tools,
    updateTokenSpeed,
    resetTokenSpeed,
    updateTools,
    updateStreamingContent,
    updateLoadingModel,
    setAbortController,
  } = useAppState()
  const { currentAssistant } = useAssistant()

  const { getProviderByName, selectedModel, selectedProvider } =
    useModelProvider()

  const { getCurrentThread: retrieveThread, createThread } = useThreads()
  const { getMessages, addMessage } = useMessages()
  const router = useRouter()

  const provider = useMemo(() => {
    return getProviderByName(selectedProvider)
  }, [selectedProvider, getProviderByName])

  useEffect(() => {
    function setTools() {
      getTools().then((data: MCPTool[]) => {
        updateTools(data)
      })
    }
    setTools()

    let unsubscribe = () => {}
    listen(SystemEvent.MCP_UPDATE, setTools).then((unsub) => {
      // Unsubscribe from the event when the component unmounts
      unsubscribe = unsub
    })
    return unsubscribe
  }, [updateTools])

  const getCurrentThread = useCallback(async () => {
    let currentThread = retrieveThread()
    if (!currentThread) {
      currentThread = await createThread(
        {
          id: selectedModel?.id ?? defaultModel(selectedProvider),
          provider: selectedProvider,
        },
        prompt,
        currentAssistant
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
    currentAssistant,
  ])

  const sendMessage = useCallback(
    async (message: string) => {
      const activeThread = await getCurrentThread()

      resetTokenSpeed()
      if (!activeThread || !provider) return
      const messages = getMessages(activeThread.id)
      const abortController = new AbortController()
      setAbortController(activeThread.id, abortController)
      updateStreamingContent(emptyThreadContent)
      addMessage(newUserThreadContent(activeThread.id, message))
      setPrompt('')
      try {
        if (selectedModel?.id) {
          updateLoadingModel(true)
          await startModel(provider, selectedModel.id, abortController).catch(
            console.error
          )
          updateLoadingModel(false)
        }

        const builder = new CompletionMessagesBuilder(
          messages,
          currentAssistant?.instructions
        )

        builder.addUserMessage(message)

        let isCompleted = false

        let availableTools = selectedModel?.capabilities?.includes('tools')
          ? tools
          : []
        while (
          !isCompleted &&
          !abortController.signal.aborted
          // TODO: Max attempts can be set in the provider settings later
        ) {
          const completion = await sendCompletion(
            activeThread,
            provider,
            builder.getMessages(),
            abortController,
            availableTools,
            currentAssistant.parameters?.stream === false ? false : true,
            currentAssistant.parameters as unknown as Record<string, object>
            // TODO: replace it with according provider setting later on
            // selectedProvider === 'llama.cpp' && availableTools.length > 0
            //   ? false
            //   : true
          )

          if (!completion) throw new Error('No completion received')
          let accumulatedText = ''
          const currentCall: ChatCompletionMessageToolCall | null = null
          const toolCalls: ChatCompletionMessageToolCall[] = []
          if (isCompletionResponse(completion)) {
            accumulatedText = completion.choices[0]?.message?.content || ''
            if (completion.choices[0]?.message?.tool_calls) {
              toolCalls.push(...completion.choices[0].message.tool_calls)
            }
          } else {
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
                updateTokenSpeed(currentContent)
                await new Promise((resolve) => setTimeout(resolve, 0))
              }
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
            finalContent,
            abortController
          )
          addMessage(updatedMessage ?? finalContent)

          isCompleted = !toolCalls.length
          availableTools = []
        }
      } catch (error) {
        toast.error(
          `Error sending message: ${error && typeof error === 'object' && 'message' in error ? error.message : error}`
        )
        console.error('Error sending message:', error)
      } finally {
        updateLoadingModel(false)
        updateStreamingContent(undefined)
      }
    },
    [
      getCurrentThread,
      resetTokenSpeed,
      provider,
      getMessages,
      setAbortController,
      updateStreamingContent,
      addMessage,
      setPrompt,
      selectedModel,
      currentAssistant,
      tools,
      updateLoadingModel,
      updateTokenSpeed,
    ]
  )

  return { sendMessage }
}
