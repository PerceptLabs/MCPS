import { useAppearance } from '@/hooks/useAppearance'
import { cn } from '@/lib/utils'
import { RgbaColor, RgbaColorPicker } from 'react-colorful'
import { IconColorPicker } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ColorPickerAppBgColor() {
  const { appBgColor, setAppBgColor } = useAppearance()

  const predefineAppBgColor: RgbaColor[] = [
    {
      r: 20,
      g: 20,
      b: 20,
      a: 0.4,
    },
    {
      r: 250,
      g: 250,
      b: 250,
      a: 0.4,
    },
    {
      r: 70,
      g: 79,
      b: 229,
      a: 0.5,
    },
    {
      r: 238,
      g: 130,
      b: 238,
      a: 0.5,
    },

    {
      r: 255,
      g: 99,
      b: 71,
      a: 0.5,
    },
    {
      r: 255,
      g: 165,
      b: 0,
      a: 0.5,
    },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {predefineAppBgColor.map((item, i) => {
        const isSelected =
          item.r === appBgColor.r &&
          item.g === appBgColor.g &&
          item.b === appBgColor.b &&
          item.a === appBgColor.a
        return (
          <div
            key={i}
            className={cn(
              'size-4 rounded-full border border-main-view-fg/20',
              isSelected && 'ring-2 ring-blue-500 border-none'
            )}
            onClick={() => {
              setAppBgColor(item)
            }}
            style={{
              backgroundColor: `rgba(${item.r}, ${item.g}, ${item.b}, ${item.a})`,
            }}
          />
        )
      })}

      <div className="">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="Pick Color Window Background"
              className="size-6 cursor-pointer flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out data-[state=open]:bg-main-view-fg/10"
            >
              <IconColorPicker size={18} className="text-main-view-fg/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="border-none w-full h-full overflow-visible"
            side="right"
            align="start"
          >
            <RgbaColorPicker
              color={appBgColor}
              onChange={(color) => setAppBgColor(color)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
