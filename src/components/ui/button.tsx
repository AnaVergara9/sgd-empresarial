import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const variantesBoton = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#5865f2] text-white shadow hover:bg-[#4752c4]",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-white/20 bg-transparent shadow-sm hover:bg-white/10 text-white",
        secondary: "bg-[#2b2d31] text-white shadow-sm hover:bg-[#383a40]",
        ghost: "hover:bg-white/10 text-white",
        link: "text-[#5865f2] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PropiedadesBoton
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBoton> {
  asChild?: boolean
}

const Boton = React.forwardRef<HTMLButtonElement, PropiedadesBoton>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Componente = asChild ? Slot : "button"
    return (
      <Componente
        className={cn(variantesBoton({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Boton.displayName = "Boton"

export { Boton as Button, variantesBoton }