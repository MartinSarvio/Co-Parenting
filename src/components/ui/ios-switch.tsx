import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * IOSSwitch — Apple iOS-style toggle, pure CSS (no Radix dependency).
 * Renders identically on Chrome, Safari and WKWebView (Capacitor).
 * Grøn (#34C759) når aktiv, grå (#e9e9ea) når inaktiv.
 */
function IOSSwitch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full p-[2px] border-none outline-none focus:outline-none focus-visible:outline-none transition-colors duration-200 ease-in-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#34C759]" : "bg-[#e9e9ea]",
        className
      )}
      style={{ WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none' } as React.CSSProperties}
    >
      <div
        className={cn(
          "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white transition-transform duration-200 ease-in-out",
          checked ? "translate-x-[20px]" : "translate-x-0"
        )}
        style={{ boxShadow: '0 2px 4px 0 rgba(0,0,0,0.15), 0 1px 1px 0 rgba(0,0,0,0.06)' }}
      />
    </button>
  )
}

export { IOSSwitch }
