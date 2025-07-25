import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:from-primary/95 hover:to-primary/85",
        destructive:
          "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-[0_2px_8px_rgba(229,69,69,0.3)] hover:shadow-[0_4px_20px_rgba(229,69,69,0.4)]",
        outline:
          "border border-border bg-background/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/50 hover:text-primary shadow-sm hover:shadow-md",
        secondary:
          "bg-gradient-to-b from-secondary to-secondary/90 text-secondary-foreground shadow-sm hover:shadow-md hover:from-secondary/95 hover:to-secondary/85",
        ghost: "hover:bg-primary/5 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Subtle shine effect */}
        {variant === "default" || variant === "destructive" ? (
          <span className="absolute inset-0 -top-[20px] bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />
        ) : null}
        {props.children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
