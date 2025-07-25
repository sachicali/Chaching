import * as React from "react"
import { cn } from "@/lib/utils"

interface TexturedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'mesh' | 'dots'
}

const TexturedCard = React.forwardRef<HTMLDivElement, TexturedCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "",
      gradient: "bg-gradient-to-br from-card via-card to-primary/5",
      glass: "backdrop-blur-xl bg-card/80 border-white/10",
      mesh: "bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-card via-primary/5 to-card",
      dots: ""
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border/40",
          "shadow-lg shadow-black/5",
          "transition-all duration-300 ease-out",
          "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
          "relative overflow-hidden group",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {/* Variant-specific patterns */}
        {variant === 'dots' && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
          </div>
        )}

        {/* Mesh gradient overlay */}
        {variant === 'mesh' && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5" />
          </div>
        )}

        {/* Glass reflection */}
        {variant === 'glass' && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {/* Content */}
        <div className="relative z-10">
          {props.children}
        </div>
      </div>
    )
  }
)
TexturedCard.displayName = "TexturedCard"

export { TexturedCard }