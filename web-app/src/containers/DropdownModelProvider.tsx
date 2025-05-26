import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useModelProvider } from '@/hooks/useModelProvider'
import { cn, getProviderLogo, getProviderTitle } from '@/lib/utils'
import { useEffect, useState } from 'react'
import Capabilities from './Capabilities'
import { IconSettings } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useThreads } from '@/hooks/useThreads'
import { ModelSetting } from '@/containers/ModelSetting'

type DropdownModelProviderProps = {
  model?: ThreadModel
}

const DropdownModelProvider = ({ model }: DropdownModelProviderProps) => {
  const {
    providers,
    getProviderByName,
    selectModelProvider,
    selectedProvider,
    selectedModel,
  } = useModelProvider()
  const [displayModel, setDisplayModel] = useState<string>('')
  const { updateCurrentThreadModel } = useThreads()
  const navigate = useNavigate()

  // Initialize model provider only once
  useEffect(() => {
    // Auto select model when existing thread is passed
    if (model) {
      selectModelProvider(model?.provider as string, model?.id as string)
    } else {
      // default model, we should add from setting
      selectModelProvider('llama.cpp', 'llama3.2:3b')
    }
  }, [model, selectModelProvider, updateCurrentThreadModel]) // Only run when threadData changes

  // Update display model when selection changes
  useEffect(() => {
    if (selectedProvider && selectedModel) {
      setDisplayModel(selectedModel.id)
    } else {
      setDisplayModel('Select a model')
    }
  }, [selectedProvider, selectedModel])

  if (!providers.length) return null

  console.log(selectedModel)

  const provider = getProviderByName(selectedProvider)

  return (
    <>
      <DropdownMenu>
        <div className="bg-main-view-fg/5 hover:bg-main-view-fg/8 px-2 py-1 flex items-center gap-1.5 rounded-sm">
          <DropdownMenuTrigger asChild>
            <button
              title={displayModel}
              className="font-medium cursor-pointer flex items-center gap-1.5 relative z-20 max-w-38"
            >
              <img
                src={getProviderLogo(selectedProvider as string)}
                alt={`${selectedProvider} - Logo`}
                className="size-4"
              />
              <span
                className={cn(
                  'text-main-view-fg/80 truncate leading-normal',
                  !selectedModel?.id && 'text-main-view-fg/50'
                )}
              >
                {displayModel}
              </span>
            </button>
          </DropdownMenuTrigger>
          {selectedModel && (
            <ModelSetting
              model={selectedModel as Model}
              provider={provider as ProviderObject}
            />
          )}
        </div>
        <DropdownMenuContent
          className="w-60 max-h-[320px]"
          side="bottom"
          align="start"
        >
          <DropdownMenuGroup>
            {providers.map((provider, index) => {
              // Only show active providers
              if (!provider.active) return null

              return (
                <div
                  className={cn(
                    'bg-main-view-fg/4 first:mt-0 rounded-sm my-1.5 first:mb-0 '
                  )}
                  key={`provider-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <DropdownMenuLabel className="flex items-center gap-1.5">
                      <img
                        src={getProviderLogo(provider.provider)}
                        alt={`${provider.provider} - Logo`}
                        className="size-4"
                      />
                      <span className="capitalize truncate text-sm">
                        {getProviderTitle(provider.provider)}
                      </span>
                    </DropdownMenuLabel>
                    <div
                      className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out mr-2"
                      onClick={() =>
                        navigate({
                          to: route.settings.providers,
                          params: { providerName: provider.provider },
                        })
                      }
                    >
                      <IconSettings
                        size={18}
                        className="text-main-view-fg/50"
                      />
                    </div>
                  </div>

                  {provider.models.map((model, modelIndex) => {
                    const capabilities = model.capabilities || []

                    return (
                      <DropdownMenuItem
                        className={cn(
                          'h-8 mx-1',
                          provider.provider !== 'llama.cpp' &&
                            !provider.api_key?.length &&
                            'hidden'
                        )}
                        title={model.id}
                        key={`model-${modelIndex}`}
                        onClick={() => {
                          selectModelProvider(provider.provider, model.id)
                          updateCurrentThreadModel({
                            id: model.id,
                            provider: provider.provider,
                          })
                        }}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="truncate text-main-view-fg/70">
                            {model.id}
                          </span>
                          <div className="-mr-1.5">
                            <Capabilities capabilities={capabilities} />
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default DropdownModelProvider
