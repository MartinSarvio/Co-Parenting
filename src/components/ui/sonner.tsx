import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset="env(safe-area-inset-top, 12px)"
      gap={8}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          borderRadius: '16px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        },
      }}
      style={
        {
          "--normal-bg": "#2f2f2d",
          "--normal-text": "#ffffff",
          "--normal-border": "transparent",
          "--border-radius": "16px",
          "--success-bg": "#2f2f2d",
          "--success-text": "#ffffff",
          "--success-border": "transparent",
          "--error-bg": "#c0392b",
          "--error-text": "#ffffff",
          "--error-border": "transparent",
          "--info-bg": "#2f2f2d",
          "--info-text": "#ffffff",
          "--info-border": "transparent",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
