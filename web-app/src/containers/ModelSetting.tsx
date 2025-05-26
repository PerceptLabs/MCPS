import { IconSettings } from '@tabler/icons-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DynamicControllerSetting } from '@/containers/dynamicControllerSetting'
import { useModelProvider } from '@/hooks/useModelProvider'
import { updateModel } from '@/services/models'
import { ModelSettingParams } from '@janhq/core'

type ModelSettingProps = {
  provider: ProviderObject
  model: Model
}

export function ModelSetting({ model, provider }: ModelSettingProps) {
  const { updateProvider } = useModelProvider()

  const handleSettingChange = (
    key: string,
    value: string | boolean | number
  ) => {
    if (!provider) return

    // Create a copy of the model with updated settings
    const updatedModel = {
      ...model,
      settings: {
        ...model.settings,
        [key]: {
          ...(model.settings?.[key] != null ? model.settings?.[key] : {}),
          controller_props: {
            ...(model.settings?.[key]?.controller_props ?? {}),
            value: value,
          },
        },
      },
    }

    // Find the model index in the provider's models array
    const modelIndex = provider.models.findIndex((m) => m.id === model.id)

    if (modelIndex !== -1) {
      // Create a copy of the provider's models array
      const updatedModels = [...provider.models]

      // Update the specific model in the array
      updatedModels[modelIndex] = updatedModel as Model

      // Update the provider with the new models array
      updateProvider(provider.provider, {
        models: updatedModels,
      })

      const params = Object.entries(updatedModel.settings).reduce(
        (acc, [key, value]) => {
          const rawVal = value.controller_props?.value
          const num = parseFloat(rawVal as string)
          acc[key] = !isNaN(num) ? num : rawVal
          return acc
        },
        {} as Record<string, unknown>
      ) as ModelSettingParams
      updateModel({
        id: model.id,
        settings: params,
        ...(params as unknown as object),
      })
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out">
          <IconSettings size={18} className="text-main-view-fg/50" />
        </div>
      </SheetTrigger>
      <SheetContent className="h-[calc(100%-8px)] top-1 right-1 rounded-e-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Model Settings - {model.id}</SheetTitle>
          <SheetDescription>
            Configure model settings to optimize performance and behavior.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 space-y-6">
          {Object.entries(model.settings || {}).map(([key, value]) => {
            const config = value as ProviderSetting
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-start justify-between gap-8">
                  <div className="space-y-1 mb-2">
                    <h3 className="font-medium">{config.title}</h3>
                    <p className="text-main-view-fg/70 text-xs">
                      {config.description}
                    </p>
                  </div>
                  <DynamicControllerSetting
                    key={config.key}
                    title={config.title}
                    description={config.description}
                    controllerType={config.controller_type}
                    controllerProps={{
                      ...config.controller_props,
                      value: config.controller_props?.value,
                    }}
                    onChange={(newValue) => handleSettingChange(key, newValue)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
