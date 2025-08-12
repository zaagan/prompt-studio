import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface InfoIconProps {
  title: string
  description: string | React.ReactNode
  className?: string
}

export function InfoIcon({ title, description, className }: InfoIconProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 w-6 p-0 text-muted-foreground hover:text-foreground", className)}
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">More information</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs leading-relaxed">
              {description}
            </CardDescription>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}