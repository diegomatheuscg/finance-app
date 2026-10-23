import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800 [&>svg]:text-emerald-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Alert = forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role={variant === 'destructive' ? 'alert' : 'status'}
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
