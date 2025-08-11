import { PromptCard } from './prompt-card'
import { usePromptStore } from '@/stores/usePromptStore'
import type { Prompt } from '@/types'

interface PromptListProps {
  prompts: readonly Prompt[]
}

export function PromptList({ prompts }: PromptListProps) {
  const { openPromptViewer } = usePromptStore()

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onClick={() => openPromptViewer(prompt)}
        />
      ))}
    </div>
  )
}