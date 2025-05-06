import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModelProvider } from '@/hooks/useModelProvider'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { getProviderTitle } from '@/lib/utils'

type DialogAddModelProps = {
  provider: ModelProvider
  trigger?: React.ReactNode
}

export const DialogAddModel = ({ provider, trigger }: DialogAddModelProps) => {
  const { updateProvider } = useModelProvider()
  const [modelId, setModelId] = useState<string>('')
  const [open, setOpen] = useState(false)

  // Handle form submission
  const handleSubmit = () => {
    if (!modelId.trim()) {
      return // Don't submit if model ID is empty
    }

    // Create the new model
    const newModel = {
      id: modelId,
      model: modelId,
      name: modelId,
      capabilities: ['completion'], // Default capability
      version: '1.0',
    }

    // Update the provider with the new model
    const updatedModels = [...provider.models, newModel]
    updateProvider(provider.provider, {
      ...provider,
      models: updatedModels,
    })

    // Reset form and close dialog
    setModelId('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm">
            <IconPlus size={16} />
            Add Model
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Model</DialogTitle>
          <DialogDescription>
            Add a new model to the {getProviderTitle(provider.provider)}
            &nbsp;provider.
          </DialogDescription>
        </DialogHeader>

        {/* Model ID field - required */}
        <div className="space-y-2">
          <label
            htmlFor="model-id"
            className="text-sm font-medium inline-block"
          >
            Model ID <span className="text-destructive">*</span>
          </label>
          <Input
            id="model-id"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Enter model ID"
            required
          />
        </div>

        {/* Explore models link */}
        {provider.explore_models_url && (
          <div className="text-sm text-main-view-fg/70">
            <a
              href={provider.explore_models_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline text-primary"
            >
              <span>
                See model list from {getProviderTitle(provider.provider)}
              </span>
            </a>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!modelId.trim()}
          >
            Add Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
