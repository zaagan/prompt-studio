import { ScrollArea } from '@/components/ui/scroll-area'
import { TemplateGrid } from './template-grid'
import { TemplateListView } from './template-list-view'
import type { Template } from '@/types'

interface TemplateListProps {
  viewMode: 'list' | 'grid'
  filteredTemplates: Template[]
}

export function TemplateList({ viewMode, filteredTemplates }: TemplateListProps) {

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-4">
          {viewMode === 'grid' ? (
            <TemplateGrid templates={filteredTemplates} />
          ) : (
            <TemplateListView templates={filteredTemplates} />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}