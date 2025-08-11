import { useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Sidebar } from './sidebar'
import { MainContent } from './main-content'
import { PromptEditor } from '../prompts/prompt-editor'
import { PromptViewer } from '../prompts/prompt-viewer'
import { SettingsView } from '../settings/settings-view'
import { AppHeader } from './app-header'
import { usePromptStore } from '@/stores/usePromptStore'

export function DesktopLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { 
    isPromptEditorOpen, 
    isPromptViewerOpen, 
    isSettingsOpen,
    selectedPrompt,
    closePromptViewer,
    closeSettings
  } = usePromptStore()

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
            ) : (
              <ResizablePanelGroup direction="horizontal">
                {/* Prompt List and Content */}
                <ResizablePanel 
                  defaultSize={(isPromptEditorOpen || isPromptViewerOpen) ? 60 : 100}
                  minSize={40}
                >
                  <MainContent />
                </ResizablePanel>

                {/* Right Panel - Editor or Viewer */}
                {(isPromptEditorOpen || isPromptViewerOpen) && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
                      {isPromptEditorOpen ? (
                        <PromptEditor />
                      ) : isPromptViewerOpen && selectedPrompt ? (
                        <PromptViewer 
                          key={selectedPrompt.id} // Force re-render when prompt changes
                          prompt={selectedPrompt} 
                          onClose={closePromptViewer}
                        />
                      ) : null}
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}