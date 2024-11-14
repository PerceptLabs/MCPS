/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react'

import { MessageStatus } from '@janhq/core'
import hljs from 'highlight.js'
import { useAtom, useAtomValue } from 'jotai'

import { BaseEditor, createEditor, Editor, Transforms } from 'slate'
import { withHistory } from 'slate-history' // Import withHistory
import {
  Editable,
  ReactEditor,
  Slate,
  withReact,
  RenderLeafProps,
} from 'slate-react'

import { twMerge } from 'tailwind-merge'

import { currentPromptAtom } from '@/containers/Providers/Jotai'

import { useActiveModel } from '@/hooks/useActiveModel'
import useSendChatMessage from '@/hooks/useSendChatMessage'

import { getCurrentChatMessagesAtom } from '@/helpers/atoms/ChatMessage.atom'

import {
  getActiveThreadIdAtom,
  activeSettingInputBoxAtom,
} from '@/helpers/atoms/Thread.atom'

type CustomElement = {
  type: 'paragraph' | 'code' | null
  children: CustomText[]
  language?: string // Store the language for code blocks
}
type CustomText = {
  text: string
  code?: boolean
  language?: string
  className?: string
  type?: 'paragraph' | 'code' // Add the type property
  format?: 'bold' | 'italic'
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

type RichTextEditorProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const RichTextEditor = ({
  className,
  style,
  disabled,
  placeholder,
  spellCheck,
}: RichTextEditorProps) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())))
  const currentLanguage = useRef<string>('plaintext')
  const hasStartBackticks = useRef<boolean>(false)
  const hasEndBackticks = useRef<boolean>(false)

  const [currentPrompt, setCurrentPrompt] = useAtom(currentPromptAtom)
  const textareaRef = useRef<HTMLDivElement>(null)
  const activeThreadId = useAtomValue(getActiveThreadIdAtom)
  const activeSettingInputBox = useAtomValue(activeSettingInputBoxAtom)
  const messages = useAtomValue(getCurrentChatMessagesAtom)
  const { sendChatMessage } = useSendChatMessage()
  const { stopInference } = useActiveModel()

  // The decorate function identifies code blocks and marks the ranges
  const decorate = useCallback(
    (entry: [any, any]) => {
      const ranges: any[] = []
      const [node, path] = entry

      if (Editor.isBlock(editor, node) && node.type === 'paragraph') {
        node.children.forEach((child: { text: any }, childIndex: number) => {
          const text = child.text

          // Match bold text pattern *text*
          const boldMatches = [...text.matchAll(/(\*.*?\*)/g)] // Find bold patterns
          boldMatches.forEach((match) => {
            const startOffset = match.index + 1 || 0
            const length = match[0].length - 2

            ranges.push({
              anchor: { path: [...path, childIndex], offset: startOffset },
              focus: {
                path: [...path, childIndex],
                offset: startOffset + length,
              },
              format: 'italic',
              className: 'italic',
            })
          })
        })
      }

      if (Editor.isBlock(editor, node) && node.type === 'paragraph') {
        node.children.forEach((child: { text: any }, childIndex: number) => {
          const text = child.text

          // Match bold text pattern **text**
          const boldMatches = [...text.matchAll(/(\*\*.*?\*\*)/g)] // Find bold patterns
          boldMatches.forEach((match) => {
            const startOffset = match.index + 2 || 0
            const length = match[0].length - 4

            ranges.push({
              anchor: { path: [...path, childIndex], offset: startOffset },
              focus: {
                path: [...path, childIndex],
                offset: startOffset + length,
              },
              format: 'bold',
              className: 'font-bold',
            })
          })
        })
      }

      if (Editor.isBlock(editor, node) && node.type === 'paragraph') {
        node.children.forEach((child: { text: any }, childIndex: number) => {
          const text = child.text

          const codeBlockStartRegex = /```(\w*)/g
          const matches = [...currentPrompt.matchAll(codeBlockStartRegex)]

          if (matches.length % 2 !== 0) {
            hasEndBackticks.current = false
          }

          // Match code block start and end
          const lang = text.match(/^```(\w*)$/)
          const endMatch = text.match(/^```$/)

          if (lang) {
            // If it's the start of a code block, store the language
            currentLanguage.current = lang[1] || 'plaintext'
          } else if (endMatch) {
            // Reset language when code block ends
            currentLanguage.current = 'plaintext'
          } else if (
            hasStartBackticks.current &&
            hasEndBackticks.current &&
            currentLanguage.current !== 'plaintext'
          ) {
            // Highlight entire code line if in a code block

            const codeContent = text.trim() // Remove leading spaces for highlighting

            let highlighted = ''
            highlighted = hljs.highlightAuto(codeContent).value
            try {
              highlighted = hljs.highlight(codeContent, {
                language:
                  currentLanguage.current.length > 1
                    ? currentLanguage.current
                    : 'plaintext',
              }).value
            } catch (err) {
              highlighted = hljs.highlight(codeContent, {
                language: 'javascript',
              }).value
            }

            const parser = new DOMParser()
            const doc = parser.parseFromString(highlighted, 'text/html')

            let slateTextIndex = 0

            doc.body.childNodes.forEach((childNode) => {
              const childText = childNode.textContent || ''

              const length = childText.length
              const className =
                childNode.nodeType === Node.ELEMENT_NODE
                  ? (childNode as HTMLElement).className
                  : ''

              ranges.push({
                anchor: {
                  path: [...path, childIndex],
                  offset: slateTextIndex,
                },
                focus: {
                  path: [...path, childIndex],
                  offset: slateTextIndex + length,
                },
                type: 'code',
                code: true,
                language: currentLanguage.current,
                className,
              })

              slateTextIndex += length
            })
          } else {
            currentLanguage.current = 'plaintext'
            ranges.push({
              anchor: { path: [...path, childIndex], offset: 0 },
              focus: { path: [...path, childIndex], offset: text.length },
              type: 'paragraph', // Treat as a paragraph
              code: false,
            })
          }
        })
      }

      return ranges
    },
    [currentPrompt, editor]
  )

  // RenderLeaf applies the decoration styles
  const renderLeaf = useCallback(
    ({ attributes, children, leaf }: RenderLeafProps) => {
      if (leaf.format === 'italic') {
        return (
          <i className={leaf.className} {...attributes}>
            {children}
          </i>
        )
      }
      if (leaf.format === 'bold') {
        return (
          <strong className={leaf.className} {...attributes}>
            {children}
          </strong>
        )
      }
      if (leaf.code) {
        // Apply syntax highlighting to code blocks
        return (
          <code className={leaf.className} {...attributes}>
            {children}
          </code>
        )
      }

      return <span {...attributes}>{children}</span>
    },
    []
  )

  useEffect(() => {
    if (!ReactEditor.isFocused(editor)) {
      ReactEditor.focus(editor)
    }
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [activeThreadId, editor])

  useEffect(() => {
    if (textareaRef.current?.clientHeight) {
      textareaRef.current.style.height = activeSettingInputBox
        ? '100px'
        : '40px'
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 2 + 'px'
      textareaRef.current?.scrollTo({
        top: textareaRef.current.scrollHeight,
        behavior: 'instant',
      })
      textareaRef.current.style.overflow =
        textareaRef.current.clientHeight >= 390 ? 'auto' : 'hidden'
    }

    if (currentPrompt.length === 0) {
      resetEditor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textareaRef.current?.clientHeight, currentPrompt, activeSettingInputBox])

  const onStopInferenceClick = async () => {
    stopInference()
  }

  const resetEditor = useCallback(() => {
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    })

    // Adjust the height of the textarea to its initial state
    if (textareaRef.current) {
      textareaRef.current.style.height = activeSettingInputBox
        ? '100px'
        : '44px'
      textareaRef.current.style.overflow = 'hidden' // Reset overflow style
    }

    // Ensure the editor re-renders decorations
    editor.onChange()
  }, [activeSettingInputBox, editor])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (messages[messages.length - 1]?.status !== MessageStatus.Pending) {
          sendChatMessage(currentPrompt)
          resetEditor()
        } else onStopInferenceClick()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPrompt, editor, messages]
  )

  return (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={(value) => {
        const combinedText = value
          .map((block) => {
            if ('children' in block) {
              return block.children.map((child) => child.text).join('')
            }
            return ''
          })
          .join('\n')

        setCurrentPrompt(combinedText)
        if (combinedText.trim() === '') {
          currentLanguage.current = 'plaintext'
        }
        const hasCodeBlockStart = combinedText.match(/^```(\w*)/m)
        const hasCodeBlockEnd = combinedText.match(/^```$/m)

        // Set language to plaintext if no code block with language identifier is found
        if (!hasCodeBlockStart) {
          currentLanguage.current = 'plaintext'
          hasStartBackticks.current = false
        } else {
          hasStartBackticks.current = true
        }
        if (!hasCodeBlockEnd) {
          currentLanguage.current = 'plaintext'
          hasEndBackticks.current = false
        } else {
          hasEndBackticks.current = true
        }
      }}
    >
      <Editable
        ref={textareaRef}
        decorate={decorate} // Pass the decorate function
        renderLeaf={renderLeaf} // Pass the renderLeaf function
        onKeyDown={handleKeyDown}
        className={twMerge(
          className,
          disabled &&
            'cursor-not-allowed border-none bg-[hsla(var(--disabled-bg))] text-[hsla(var(--disabled-fg))]'
        )}
        placeholder={placeholder}
        style={style}
        disabled={disabled}
        readOnly={disabled}
        spellCheck={spellCheck}
      />
    </Slate>
  )
}

export default RichTextEditor
