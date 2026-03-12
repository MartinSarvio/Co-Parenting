import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/28",
        className
      )}
      {...props}
    />
  )
}

// Hook: touch-based drag-to-dismiss for bottom sheets
function useBottomSheetDrag(onClose: () => void) {
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const startY = React.useRef(0)
  const currentY = React.useRef(0)
  const isDragging = React.useRef(false)

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    const el = sheetRef.current
    if (!el) return
    // Only allow drag when at scroll top or touching the drag handle area
    const target = e.target as HTMLElement
    const isDragHandle = target.closest('[data-drag-handle]')
    const scrollContainer = el.querySelector('[data-sheet-scroll]') as HTMLElement | null
    const isAtTop = !scrollContainer || scrollContainer.scrollTop <= 0

    if (!isDragHandle && !isAtTop) return

    startY.current = e.touches[0].clientY
    currentY.current = 0
    isDragging.current = true
  }, [])

  const onTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta < 0) { currentY.current = 0; return } // Only drag down
    currentY.current = delta
    sheetRef.current.style.transform = `translateY(${delta}px)`
    sheetRef.current.style.transition = 'none'
  }, [])

  const onTouchEnd = React.useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return
    isDragging.current = false
    if (currentY.current > 120) {
      // Dismiss
      sheetRef.current.style.transform = `translateY(100%)`
      sheetRef.current.style.transition = 'transform 0.2s ease-out'
      setTimeout(onClose, 200)
    } else {
      // Spring back
      sheetRef.current.style.transform = ''
      sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.2,1,0.3,1)'
    }
    currentY.current = 0
  }, [onClose])

  return { sheetRef, onTouchStart, onTouchMove, onTouchEnd }
}

function SheetContent({
  className,
  children,
  side = "right",
  hideClose = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  hideClose?: boolean
}) {
  const isBottom = side === "bottom"

  // Extract onOpenChange from the parent Sheet's context to call close
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const handleDragClose = React.useCallback(() => {
    closeRef.current?.click()
  }, [])

  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useBottomSheetDrag(handleDragClose)

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={isBottom ? sheetRef : undefined}
        data-slot="sheet-content"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-[0_20px_48px_rgba(15,15,15,0.24)] transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l border-[#d8d7d0] max-w-[430px]",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r border-[#d8d7d0] max-w-[430px]",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b border-[#d8d7d0] mx-auto max-w-[430px]",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t border-[#d8d7d0] mx-auto max-w-[430px]",
          className
        )}
        {...(isBottom ? { onTouchStart, onTouchMove, onTouchEnd } : {})}
        {...props}
      >
        {children}
        {/* Hidden close button for drag-to-dismiss */}
        <SheetPrimitive.Close ref={closeRef} className="sr-only" aria-hidden tabIndex={-1}>
          Close
        </SheetPrimitive.Close>
        {!hideClose && (
          <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
