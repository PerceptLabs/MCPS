import { models as providerModels } from 'token.js'
import { mockModelProvider } from '@/mock/data'
import { EngineManager, SettingComponentProps } from '@janhq/core'
import { ModelCapabilities } from '@/types/models'
import { modelSettings } from '@/lib/predefined'
import { fetchModels } from './models'
import { ExtensionManager } from '@/lib/extension'

export const getProviders = async (): Promise<ModelProvider[]> => {
  const builtinProviders = mockModelProvider.map((provider) => {
    let models = provider.models as Model[]
    if (Object.keys(providerModels).includes(provider.provider)) {
      const builtInModels = providerModels[
        provider.provider as unknown as keyof typeof providerModels
      ].models as unknown as string[]

      if (Array.isArray(builtInModels))
        models = builtInModels.map((model) => {
          const modelManifest = models.find((e) => e.id === model)
          const capabilities = [
            ModelCapabilities.COMPLETION,
            (
              providerModels[
                provider.provider as unknown as keyof typeof providerModels
              ].supportsToolCalls as unknown as string[]
            ).includes(model)
              ? ModelCapabilities.TOOLS
              : undefined,
          ].filter(Boolean) as string[]
          return {
            ...(modelManifest ?? { id: model, name: model }),
            capabilities,
          } as Model
        })
    }
    return {
      ...provider,
      models,
    }
  })

  const runtimeProviders: ModelProvider[] = []

  for (const [key, value] of EngineManager.instance().engines) {
    // TODO: Remove this when the cortex extension is removed
    const providerName = key === 'cortex' ? 'llama.cpp' : key

    const models =
      ((await fetchModels()) ?? []).filter(
        (model) =>
          (model.engine === 'llama-cpp' ? 'llama.cpp' : model.engine) ===
            providerName &&
          'status' in model &&
          model.status === 'downloaded'
      ) ?? []
    const provider: ModelProvider = {
      active: false,
      provider: providerName,
      base_url:
        'inferenceUrl' in value
          ? (value.inferenceUrl as string).replace('/chat/completions', '')
          : '',
      settings: (await value.getSettings()).map((setting) => ({
        key: setting.key,
        title: setting.title,
        description: setting.description,
        controller_type: setting.controllerType as unknown,
        controller_props: setting.controllerProps as unknown,
      })) as ProviderSetting[],
      models: models.map((model) => ({
        id: model.id,
        model: model.id,
        name: model.name,
        description: model.description,
        capabilities:
          'capabilities' in model
            ? (model.capabilities as string[])
            : [ModelCapabilities.COMPLETION],
        provider: providerName,
        settings: Object.values(modelSettings).reduce(
          (acc, setting) => {
            acc[setting.key] = {
              ...setting,
              controller_props: {
                ...setting.controller_props,
                value: model[
                  setting.key as keyof typeof model
                ] as unknown as keyof typeof setting.controller_props.value,
              },
            }
            return acc
          },
          {} as Record<string, ProviderSetting>
        ),
      })),
    }
    runtimeProviders.push(provider)
  }

  return runtimeProviders.concat(builtinProviders as ModelProvider[])
}

/**
 * Update the settings of a provider extension.
 * TODO: Later on we don't retrieve this using provider name
 * @param providerName
 * @param settings
 */
export const updateSettings = async (
  providerName: string,
  settings: ProviderSetting[]
): Promise<void> => {
  const provider = providerName === 'llama.cpp' ? 'cortex' : providerName
  return ExtensionManager.getInstance()
    .getEngine(provider)
    ?.updateSettings(
      settings.map((setting) => ({
        ...setting,
        controllerProps: {
          ...setting.controller_props,
          value: setting.controller_props.value ?? '',
        },
        controllerType: setting.controller_type,
      })) as SettingComponentProps[]
    )
}
