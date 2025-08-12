import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { InfoIcon } from '@/components/ui/info-icon'
import { CategoryManager } from './category-manager'
import { TagManager } from './tag-manager'
import { FactoryReset } from './factory-reset'
import { Palette, Settings as SettingsIcon, Database, Hash, X } from 'lucide-react'

interface SettingsViewProps {
  onClose?: () => void
}

export function SettingsView({ onClose }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('categories')
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Content */}
      <div className="flex-1 min-h-0 p-6">
        <div className="max-w-6xl mx-auto h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl flex-shrink-0">
                  <TabsTrigger value="categories" className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Categories</span>
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
                
                {/* Info icons for each tab */}
                {activeTab === 'categories' && (
                  <InfoIcon 
                    title="Categories"
                    description={
                      <div className="space-y-2">
                        <p>Organize your prompts with color-coded categories for easy identification and filtering.</p>
                        <p><strong>Create:</strong> Click "New Category" to add custom categories with names, descriptions, and color themes.</p>
                        <p><strong>Manage:</strong> Edit or delete categories using the hover controls on each category card.</p>
                        <p><strong>Usage:</strong> View prompt count for each category to understand your organization patterns.</p>
                      </div>
                    }
                  />
                )}
                
                {activeTab === 'tags' && (
                  <InfoIcon 
                    title="Tags"
                    description={
                      <div className="space-y-2">
                        <p>Manage and organize your prompt tags for flexible categorization and advanced search capabilities.</p>
                        <p><strong>Search:</strong> Use the search bar to find specific tags or use advanced syntax like 'tag:AI,Writing' in the main prompt search.</p>
                        <p><strong>Statistics:</strong> View usage counts to see which tags are most popular in your prompt collection.</p>
                        <p><strong>Bulk Operations:</strong> Edit or delete tags across all prompts (coming in future updates).</p>
                      </div>
                    }
                  />
                )}
                
                {activeTab === 'general' && (
                  <InfoIcon 
                    title="General Settings"
                    description={
                      <div className="space-y-2">
                        <p>Configure general application preferences and behavior settings.</p>
                        <p><strong>Theme:</strong> Customize the application appearance with light, dark, or system themes.</p>
                        <p><strong>Preferences:</strong> Set default behaviors for editors, search, and other features.</p>
                        <p><strong>Shortcuts:</strong> Configure keyboard shortcuts for faster workflow.</p>
                      </div>
                    }
                  />
                )}
                
                {activeTab === 'data' && (
                  <InfoIcon 
                    title="Data Management"
                    description={
                      <div className="space-y-2">
                        <p>Manage your application data including backup, restore, and reset operations.</p>
                        <p><strong>Factory Reset:</strong> Permanently delete all data and restore sample content to start fresh.</p>
                        <p><strong>Export:</strong> Create backups of your prompts, categories, and settings (coming soon).</p>
                        <p><strong>Import:</strong> Restore data from previous backups or import from other sources (coming soon).</p>
                      </div>
                    }
                  />
                )}
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

            <div className="flex-1 min-h-0">
              <TabsContent value="categories" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <CategoryManager />
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