import { ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'
import { create } from 'zustand'
import { RenderMarkdown } from './RenderMarkdown'
import { useMemo } from 'react'

interface Props {
  result: string
  name: string
  id: number
  loading: boolean
}

type ToolCallBlockState = {
  collapseState: { [id: number]: boolean }
  setCollapseState: (id: number, expanded: boolean) => void
}

const useToolCallBlockStore = create<ToolCallBlockState>((set) => ({
  collapseState: {},
  setCollapseState: (id, expanded) =>
    set((state) => ({
      collapseState: {
        ...state.collapseState,
        [id]: expanded,
      },
    })),
}))

// Types for MCP response content
interface MCPContentItem {
  type: string
  data?: string
  text?: string
  mimeType?: string
}

interface MCPResponse {
  content?: MCPContentItem[]
}

// Utility function to create data URL from base64 and mimeType
const createDataUrl = (base64Data: string, mimeType: string): string => {
  // Handle case where base64 data might already include data URL prefix
  if (base64Data.startsWith('data:')) {
    return base64Data
  }
  return `data:${mimeType};base64,${base64Data}`
}

// Parse MCP response and extract content items
const parseMCPResponse = (result: string) => {
  try {
    const parsed: MCPResponse = JSON.parse(result)
    const content = parsed.content || []

    return {
      parsedResult: parsed,
      contentItems: content,
      hasStructuredContent: content.length > 0,
      parseError: false,
    }
  } catch {
    // Fallback: JSON parsing failed, treat as plain text
    return {
      parsedResult: result,
      contentItems: [],
      hasStructuredContent: false,
      parseError: true,
    }
  }
}

// Component to render individual content items based on type
const ContentItemRenderer = ({
  item,
  index,
}: {
  item: MCPContentItem
  index: number
}) => {
  if (item.type === 'image' && item.data && item.mimeType) {
    const imageUrl = createDataUrl(item.data, item.mimeType)
    return (
      <div key={index} className="mt-3">
        <img
          src={imageUrl}
          alt={`Result image ${index + 1}`}
          className="max-w-full max-h-64 object-contain rounded-md border border-main-view-fg/10"
          onError={(e) => {
            // Hide broken images
            e.currentTarget.style.display = 'none'
          }}
          onClick={() => window.open(imageUrl, '_blank')}
          style={{ cursor: 'pointer' }}
        />
      </div>
    )
  }

  if (item.type === 'text' && item.text) {
    return (
      <div key={index} className="mt-3">
        <RenderMarkdown content={item.text} />
      </div>
    )
  }

  // For any other types, render as JSON
  return (
    <div key={index} className="mt-3">
      <RenderMarkdown
        content={'```json\n' + JSON.stringify(item, null, 2) + '\n```'}
      />
    </div>
  )
}

const ToolCallBlock = ({ id, name, result, loading }: Props) => {
  const { collapseState, setCollapseState } = useToolCallBlockStore()
  const isExpanded = collapseState[id] ?? false

  const handleClick = () => {
    const newExpandedState = !isExpanded
    setCollapseState(id, newExpandedState)
  }

  // Parse the MCP response and extract content items
  const { parsedResult, contentItems, hasStructuredContent, parseError } =
    useMemo(() => {
      return parseMCPResponse(result)
    }, [result])

  return (
    <div
      className="mx-auto w-full cursor-pointer break-words"
      onClick={handleClick}
      data-tool-call-block={id}
    >
      <div className="rounded-lg bg-main-view-fg/4 border border-dashed border-main-view-fg/10">
        <div className="flex items-center gap-3 p-2">
          {loading && (
            <Loader className="size-4 animate-spin text-main-view-fg/60" />
          )}
          <button className="flex items-center gap-2 focus:outline-none">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="font-medium text-main-view-fg/80">
              View result from{' '}
              <span className="font-medium text-main-view-fg">{name}</span>
            </span>
          </button>
        </div>

        <div
          className={cn(
            'h-fit w-full overflow-auto transition-all duration-300 px-2',
            isExpanded ? '' : 'max-h-0 overflow-hidden'
          )}
        >
          <div className="mt-2 text-main-view-fg/60">
            {hasStructuredContent ? (
              /* Render each content item individually based on its type */
              <div className="space-y-2">
                {contentItems.map((item, index) => (
                  <ContentItemRenderer key={index} item={item} index={index} />
                ))}
              </div>
            ) : parseError ? (
              /* Handle JSON parse error - render as plain text */
              <div className="mt-3 p-3 bg-main-view-fg/5 rounded-md border border-main-view-fg/10">
                <div className="text-sm font-medium text-main-view-fg/80 mb-2">
                  Raw Response:
                </div>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {parsedResult as string}
                </div>
              </div>
            ) : (
              /* Fallback: render as JSON for valid JSON but unstructured responses */
              <RenderMarkdown
                content={
                  '```json\n' + JSON.stringify(parsedResult, null, 2) + '\n```'
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolCallBlock
