import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import SettingsMenu from '@/containers/SettingsMenu'
import HeaderPage from '@/containers/HeaderPage'
import { ColorPickerAppBgColor } from '@/containers/ColorPickerAppBgColor'
import { ColorPickerAppMainView } from '@/containers/ColorPickerAppMainView'
import { CardSetting, CardSettingItem } from '@/containers/CardSetting'
import { useTranslation } from 'react-i18next'
import { ThemeSwitcher } from '@/containers/ThemeSwitcher'
import { FontSizeSwitcher } from '@/containers/FontSizeSwitcher'
import { ColorPickerAppPrimaryColor } from '@/containers/ColorPickerAppPrimaryColor'
import { ColorPickerAppAccentColor } from '@/containers/ColorPickerAppAccentColor'
import { ColorPickerAppDestructiveColor } from '@/containers/ColorPickerAppDestructiveColor'
import { useAppearance } from '@/hooks/useAppearance'
import { useCodeblock } from '@/hooks/useCodeblock'
import { Button } from '@/components/ui/button'
import CodeBlockStyleSwitcher from '@/containers/CodeBlockStyleSwitcher'
import { LineNumbersSwitcher } from '@/containers/LineNumbersSwitcher'
import { CodeBlockExample } from '@/containers/CodeBlockExample'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute(route.settings.appearance as any)({
  component: Appareances,
})

function Appareances() {
  const { t } = useTranslation()
  const { resetAppearance } = useAppearance()
  const { resetCodeBlockStyle } = useCodeblock()

  return (
    <div className="flex flex-col h-full">
      <HeaderPage>
        <h1 className="font-medium">{t('common.settings')}</h1>
      </HeaderPage>
      <div className="flex h-full w-full">
        <SettingsMenu />
        <div className="p-4 w-full h-[calc(100%-32px)] overflow-y-auto">
          <div className="flex flex-col justify-between gap-4 gap-y-3 w-full">
            {/* Appearance */}
            <CardSetting title="Appearance">
              <CardSettingItem
                title="Theme"
                description="Native appearance for consistent theming across OS UI elements"
                actions={<ThemeSwitcher />}
              />
              <CardSettingItem
                title="Font Size"
                description="Adjust the size of text across the app"
                actions={<FontSizeSwitcher />}
              />
              <CardSettingItem
                title="Window Background"
                description="Choose the App window color"
                actions={<ColorPickerAppBgColor />}
              />
              <CardSettingItem
                title="App Main View"
                description="Sets the background color for the main content area"
                actions={<ColorPickerAppMainView />}
              />
              <CardSettingItem
                title="Primary"
                description="Controls the primary color used for components"
                actions={<ColorPickerAppPrimaryColor />}
              />
              <CardSettingItem
                title="Accent"
                description="Controls the accent color used for highlights"
                actions={<ColorPickerAppAccentColor />}
              />
              <CardSettingItem
                title="Destructive"
                description="Controls the color used for destructive actions"
                actions={<ColorPickerAppDestructiveColor />}
              />
              <CardSettingItem
                title="Reset to Default"
                description="Reset all colors to their default values"
                actions={
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      resetAppearance()
                      toast.success('Appearance Reset', {
                        id: 'reset-appearance',
                        description:
                          'Your appearance settings have been restored to default.',
                      })
                    }}
                  >
                    {t('common.reset')}
                  </Button>
                }
              />
            </CardSetting>

            {/* Message */}
            <CardSetting title="Chat Message">
              <CardSettingItem
                title="Code Block Style"
                description="Choose the style for code block syntax highlighting"
                actions={<CodeBlockStyleSwitcher />}
              />
              <CodeBlockExample />
              <CardSettingItem
                title="Show Line Numbers"
                description="Toggle line numbers in code blocks"
                actions={<LineNumbersSwitcher />}
              />
              <CardSettingItem
                title="Reset Code Block Style"
                description="Reset code block style to default"
                actions={
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      resetCodeBlockStyle()
                      toast.success('Code Block Style Reset', {
                        id: 'code-block-style',
                        description:
                          'Your Code Block style settings have been restored to default.',
                      })
                    }}
                  >
                    {t('common.reset')}
                  </Button>
                }
              />
            </CardSetting>
          </div>
        </div>
      </div>
    </div>
  )
}
