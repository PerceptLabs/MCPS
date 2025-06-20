import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToolApproval } from '@/hooks/useToolApproval'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { Trans } from 'react-i18next'

export default function ToolApproval() {
  const { t } = useTranslation()
  const { isModalOpen, modalProps, setModalOpen } = useToolApproval()

  if (!modalProps) {
    return null
  }

  const { toolName, onApprove, onDeny } = modalProps

  const handleAllowOnce = () => {
    onApprove(true) // true = allow once only
  }

  const handleAllow = () => {
    onApprove(false) // false = remember for this thread
  }

  const handleDeny = () => {
    onDeny()
  }

  const handleDialogOpen = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      onDeny()
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleDialogOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <DialogTitle>{t('tools:toolApproval.title')}</DialogTitle>
              <DialogDescription className="mt-1 text-main-view-fg/70">
                <Trans
                  i18nKey="tools:toolApproval.description"
                  values={{ toolName }}
                  components={{ strong: <strong className="font-semibold" /> }}
                />
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-main-view-fg/8 p-2 border border-main-view-fg/5 rounded-lg">
          <p className="text-sm text-main-view-fg/70 leading-relaxed">
            {t('tools:toolApproval.securityNotice')}
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="link"
            onClick={handleDeny}
            className="flex-1 text-right sm:flex-none"
          >
            {t('tools:toolApproval.deny')}
          </Button>
          <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-center">
            <Button
              variant="link"
              onClick={handleAllowOnce}
              className="border border-main-view-fg/20"
            >
              {t('tools:toolApproval.allowOnce')}
            </Button>
            <Button variant="default" onClick={handleAllow}>
              {t('tools:toolApproval.alwaysAllow')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
