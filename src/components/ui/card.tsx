import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border/50 bg-card",
      "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      "transition-all duration-300 ease-out",
      "hover:border-primary/50 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] hover:shadow-primary/10 hover:-translate-y-0.5",
      "relative overflow-hidden group",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] before:via-white/[0.02] before:to-transparent before:pointer-events-none",
      "after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] after:from-primary/[0.04] after:via-transparent after:to-transparent after:pointer-events-none",
      className
    )}
    {...props}
  >
    {/* Grainy texture overlay */}
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="grainyFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.95"
              numOctaves="4"
              result="noise"
              seed="1"
            />
            <feColorMatrix in="noise" type="saturate" values="0"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#grainyFilter)" opacity="1"/>
      </svg>
    </div>
    
    {/* Additional film grain effect */}
    <div 
      className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter' x='0%25' y='0%25' width='100%25' height='100%25'%3E%3CfeTurbulence baseFrequency='0.98' seed='5' numOctaves='2' result='turbulence'/%3E%3CfeColorMatrix in='turbulence' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px'
      }}
    />
    
    {/* Inner border for depth */}
    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
    
    {/* Content with proper z-index */}
    <div className="relative z-10">
      {props.children}
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-8 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-8 pt-2", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
