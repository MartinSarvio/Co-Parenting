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
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '14px',
          fontWeight: '400',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#2b2b28",
          "--normal-border": "#e5e4df",
          "--border-radius": "12px",
          "--success-bg": "#ffffff",
          "--success-text": "#2b2b28",
          "--success-border": "#e5e4df",
          "--error-bg": "#fff5f5",
          "--error-text": "#c0392b",
          "--error-border": "#f5c6c6",
          "--info-bg": "#ffffff",
          "--info-text": "#2b2b28",
          "--info-border": "#e5e4df",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
