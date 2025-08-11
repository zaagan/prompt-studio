import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CategoryManager } from './category-manager'
import { TemplateManager } from './template-manager'
import { TagManager } from './tag-manager'
import { FactoryReset } from './factory-reset'
import { Palette, FileText, Settings as SettingsIcon, Database, Hash, X } from 'lucide-react'

interface SettingsViewProps {
  onClose?: () => void
}

export function SettingsView({ onClose }: SettingsViewProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your application preferences and data
              </p>
            </div>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6">
        <div className="max-w-6xl mx-auto h-full">
          <Tabs defaultValue="categories" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 max-w-3xl flex-shrink-0 mb-6">
              <TabsTrigger value="categories" className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Categories</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center space-x-2">
                <Hash className="h-4 w-4" />
                <span>Tags</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Data</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="categories" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <CategoryManager />
              </TabsContent>

              <TabsContent value="templates" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <TemplateManager />
              </TabsContent>

              <TabsContent value="tags" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <TagManager />
              </TabsContent>

              <TabsContent value="general" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    General settings coming soon...
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <FactoryReset />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}