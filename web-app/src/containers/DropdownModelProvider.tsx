import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useModelProvider } from '@/hooks/useModelProvider'
import { cn, getProviderTitle } from '@/lib/utils'
import Capabilities from './Capabilities'
import { IconSettings, IconX, IconCheck } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useThreads } from '@/hooks/useThreads'
import { ModelSetting } from '@/containers/ModelSetting'
import ProvidersAvatar from '@/containers/ProvidersAvatar'
import { Fzf } from 'fzf'

type DropdownModelProviderProps = {
  model?: ThreadModel
}

interface SearchableModel {
  provider: ModelProvider
  model: Model
  searchStr: string
  value: string
}

const DropdownModelProvider = ({ model }: DropdownModelProviderProps) => {
  const {
    providers,
    getProviderByName,
    selectModelProvider,
    getModelBy,
    selectedProvider,
    selectedModel,
  } = useModelProvider()
  const [displayModel, setDisplayModel] = useState<string>('')
  const { updateCurrentThreadModel } = useThreads()
  const navigate = useNavigate()
  
  // Search state
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize model provider only once
  useEffect(() => {
    // Auto select model when existing thread is passed
    if (model) {
      selectModelProvider(model?.provider as string, model?.id as string)
    } else {
      // default model, we should add from setting
      selectModelProvider('llama.cpp', 'llama3.2:3b')
    }
  }, [model, selectModelProvider, updateCurrentThreadModel])

  // Update display model when selection changes
  useEffect(() => {
    if (selectedProvider && selectedModel) {
      setDisplayModel(selectedModel.id)
    } else {
      setDisplayModel('Select a model')
    }
  }, [selectedProvider, selectedModel])

  // Reset search value when dropdown closes
  const onOpenChange = useCallback((open: boolean) => {
    setOpen(open)
    if (!open) {
      requestAnimationFrame(() => setSearchValue(''))
    } else {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [])

  // Clear search and focus input
  const onClearSearch = useCallback(() => {
    setSearchValue('')
    searchInputRef.current?.focus()
  }, [])

  // Create searchable items from all models
  const searchableItems = useMemo(() => {
    const items: SearchableModel[] = []
    
    providers.forEach((provider) => {
      if (!provider.active) return
      
      provider.models.forEach((modelItem) => {
        // Skip models that require API key but don't have one (except llama.cpp)
        if (provider.provider !== 'llama.cpp' && !provider.api_key?.length) {
          return
        }

        const capabilities = modelItem.capabilities || []
        const capabilitiesString = capabilities.join(' ')
        const providerTitle = getProviderTitle(provider.provider)
        
        // Create search string with model id, provider, and capabilities
        const searchStr = `${modelItem.id} ${providerTitle} ${provider.provider} ${capabilitiesString}`.toLowerCase()

        items.push({
          provider,
          model: modelItem,
          searchStr,
          value: `${provider.provider}:${modelItem.id}`,
        })
      })
    })

    return items
  }, [providers])

  // Create Fzf instance for fuzzy search
  const fzfInstance = useMemo(() => {
    return new Fzf(searchableItems, {
      selector: (item) => item.searchStr,
    })
  }, [searchableItems])

  // Filter models based on search value
  const filteredItems = useMemo(() => {
    if (!searchValue) return searchableItems

    return fzfInstance.find(searchValue).map((result) => result.item)
  }, [searchableItems, searchValue, fzfInstance])

  // Group filtered items by provider
  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchableModel[]> = {}
    
    filteredItems.forEach((item) => {
      const providerKey = item.provider.provider
      if (!groups[providerKey]) {
        groups[providerKey] = []
      }
      groups[providerKey].push(item)
    })

    return groups
  }, [filteredItems])

  const handleSelect = useCallback((searchableModel: SearchableModel) => {
    selectModelProvider(searchableModel.provider.provider, searchableModel.model.id)
    updateCurrentThreadModel({
      id: searchableModel.model.id,
      provider: searchableModel.provider.provider,
    })
    setSearchValue('')
    setOpen(false)
  }, [selectModelProvider, updateCurrentThreadModel])

  const currentModel = selectedModel?.id ? getModelBy(selectedModel?.id) : undefined

  if (!providers.length) return null

  const provider = getProviderByName(selectedProvider)

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <div className="bg-main-view-fg/5 hover:bg-main-view-fg/8 px-2 py-1 flex items-center gap-1.5 rounded-sm max-h-[32px]">
          <PopoverTrigger asChild>
            <button
              title={displayModel}
              className="font-medium cursor-pointer flex items-center gap-1.5 relative z-20 max-w-38"
            >
              {provider && (
                <div className="shrink-0">
                  <ProvidersAvatar provider={provider} />
                </div>
              )}
              <span
                className={cn(
                  'text-main-view-fg/80 truncate leading-normal',
                  !selectedModel?.id && 'text-main-view-fg/50'
                )}
              >
                {displayModel}
              </span>
            </button>
          </PopoverTrigger>
          {currentModel?.settings && provider && (
            <ModelSetting model={currentModel as Model} provider={provider} />
          )}
        </div>
        
        <PopoverContent
          className="w-80 p-0 max-h-[400px] overflow-hidden"
          side="bottom"
          align="start"
          sideOffset={10}
          alignOffset={-8}
        >
          <div className="flex flex-col w-full">
            {/* Search input */}
            <div className="relative p-3 border-b border-main-view-fg/10">
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search models..."
                className="w-full h-8 px-3 py-1 text-sm bg-main-view border border-main-view-fg/10 rounded-md text-main-view-fg placeholder:text-main-view-fg/40 focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
              />
              {searchValue.length > 0 && (
                <div className="absolute right-5 top-0 bottom-0 flex items-center justify-center">
                  <IconX
                    size={16}
                    className="text-main-view-fg/50 hover:text-main-view-fg cursor-pointer"
                    onClick={onClearSearch}
                  />
                </div>
              )}
            </div>

            {/* Model list */}
            <div className="max-h-[320px] overflow-y-auto">
              {Object.keys(groupedItems).length === 0 && searchValue ? (
                <div className="py-3 px-4 text-sm text-main-view-fg/60">
                  No models found for "{searchValue}"
                </div>
              ) : (
                <div className="py-1">
                  {Object.entries(groupedItems).map(([providerKey, models]) => {
                    const providerInfo = providers.find(p => p.provider === providerKey)
                    if (!providerInfo) return null

                    return (
                      <div
                        key={providerKey}
                        className="bg-main-view-fg/4 first:mt-0 rounded-sm my-1.5 mx-1.5 first:mb-0"
                      >
                        {/* Provider header */}
                        <div className="flex items-center justify-between px-2 py-1">
                          <div className="flex items-center gap-1.5">
                            <ProvidersAvatar provider={providerInfo} />
                            <span className="capitalize truncate text-sm font-medium text-main-view-fg/80">
                              {getProviderTitle(providerInfo.provider)}
                            </span>
                          </div>
                          <div
                            className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate({
                                to: route.settings.providers,
                                params: { providerName: providerInfo.provider },
                              })
                              setOpen(false)
                            }}
                          >
                            <IconSettings
                              size={16}
                              className="text-main-view-fg/50"
                            />
                          </div>
                        </div>

                        {/* Models for this provider */}
                        {models.map((searchableModel) => {
                          const isSelected = selectedModel?.id === searchableModel.model.id && 
                                           selectedProvider === searchableModel.provider.provider
                          const capabilities = searchableModel.model.capabilities || []

                          return (
                            <div
                              key={searchableModel.value}
                              onClick={() => handleSelect(searchableModel)}
                              className={cn(
                                'mx-1 mb-1 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 transition-all duration-200',
                                'hover:bg-main-view-fg/10',
                                isSelected && 'bg-main-view-fg/15'
                              )}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="truncate text-main-view-fg/80 text-sm">
                                  {searchableModel.model.id}
                                </span>
                                {isSelected && (
                                  <IconCheck size={16} className="text-accent shrink-0" />
                                )}
                                <div className="flex-1"></div>
                                {capabilities.length > 0 && (
                                  <div className="flex-shrink-0">
                                    <Capabilities capabilities={capabilities} />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

export default DropdownModelProvider
