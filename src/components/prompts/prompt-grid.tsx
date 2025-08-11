import { PromptCard } from './prompt-card'
import { usePromptStore } from '@/stores/usePromptStore'
import type { Prompt } from '@/types'

interface PromptGridProps {
  prompts: readonly Prompt[]
  compactMode?: boolean
}

export function PromptGrid({ prompts, compactMode = false }: PromptGridProps) {
  const { openPromptViewer } = usePromptStore()

  // Adjust grid columns based on compact mode (when right sidebar is open)
  const gridClasses = compactMode
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4"

  return (
    <div className={gridClasses}>
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          variant="card"
          onClick={() => openPromptViewer(prompt)}
        />
      ))}
    </div>
  )
}