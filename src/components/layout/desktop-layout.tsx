import { useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Sidebar } from './sidebar'
import { MainContent } from './main-content'
import { PromptEditor } from '../prompts/prompt-editor'
import { PromptViewer } from '../prompts/prompt-viewer'
import { TemplateEditor } from '../templates/template-editor'
import { SettingsView } from '../settings/settings-view'
import { AppHeader } from './app-header'
import { usePromptStore } from '@/stores/usePromptStore'

export function DesktopLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { 
    isPromptEditorOpen, 
    isPromptViewerOpen, 
    isSettingsOpen,
    isTemplateEditorOpen,
    selectedPrompt,
    selectedTemplate,
    closePromptViewer,
    closeSettings,
    closeTemplateEditor
  } = usePromptStore()
  
  // Determine if right panel should be shown
  const showRightPanel = isPromptEditorOpen || isPromptViewerOpen || isTemplateEditorOpen

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* App Header */}
      <AppHeader />
      
      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel 
            defaultSize={20} 
            minSize={15}
            maxSize={30}
            collapsible
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={sidebarCollapsed ? 'min-w-[50px]' : ''}
          >
            <Sidebar collapsed={sidebarCollapsed} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Content Area */}
          <ResizablePanel defaultSize={80} minSize={50}>
            {isSettingsOpen ? (
              <SettingsView onClose={closeSettings} />
            ) : showRightPanel ? (
              <ResizablePanelGroup direction="horizontal">
                {/* Prompt List and Content */}
                <ResizablePanel defaultSize={60} minSize={40}>
                  <MainContent />
                </ResizablePanel>

                {/* Right Panel - Editor or Viewer */}
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
                  {isPromptEditorOpen ? (
                    <PromptEditor />
                  ) : isTemplateEditorOpen ? (
                    <TemplateEditor />
                  ) : isPromptViewerOpen && selectedPrompt ? (
                    <PromptViewer 
                      key={selectedPrompt.id} // Force re-render when prompt changes
                      prompt={selectedPrompt} 
                      onClose={closePromptViewer}
                    />
                  ) : null}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              // When no right panel is open, just show main content
              <MainContent />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}