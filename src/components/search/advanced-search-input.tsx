import { useState, useEffect, useRef } from 'react'
import { Search, X, Tag, Hash, Star, FileText, Palette } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { parseSearchQuery, getSearchSuggestions } from '@/lib/search-parser'
import { usePromptStore } from '@/stores/usePromptStore'

interface AdvancedSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function AdvancedSearchInput({ 
  value, 
  onChange, 
  placeholder = "Search prompts... (try: tag:AI,Writing or is:favorite)",
  className 
}: AdvancedSearchInputProps) {
  const { tags, categories } = usePromptStore()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const parsedQuery = parseSearchQuery(value)

  useEffect(() => {
    if (value.trim()) {
      const categoryNames = categories.map(c => c.name)
      const newSuggestions = getSearchSuggestions(value, tags, categoryNames)
      setSuggestions(newSuggestions)
      setSelectedSuggestion(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [value, tags, categories])

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setShowSuggestions(newValue.trim().length > 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        if (selectedSuggestion >= 0) {
          e.preventDefault()
          onChange(suggestions[selectedSuggestion])
          setShowSuggestions(false)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    onChange('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const addQuickFilter = (filter: string) => {
    const newValue = value ? `${value} ${filter}` : filter
    onChange(newValue)
    inputRef.current?.focus()
  }

  const removeFilter = (filterType: 'tag' | 'title' | 'content' | 'category' | 'favorite', filterValue?: string) => {
    let newValue = value
    
    switch (filterType) {
      case 'tag':
        if (filterValue) {
          // Remove specific tag - handle both quoted and unquoted tags
          const tagRegex = /tag:("([^"]*)"|([^\s]+))/gi
          newValue = newValue.replace(tagRegex, (match) => {
            // Extract the tag list (handle quoted values)
            const tagMatch = match.match(/tag:("([^"]*)"|([^\s]+))/i)
            if (!tagMatch) return ''
            
            const tagList = tagMatch[2] || tagMatch[3] || tagMatch[1] || ''
            const tags = tagList.split(',').map(t => t.trim()).filter(t => t && t !== filterValue)
            
            if (tags.length === 0) return ''
            
            // Format the remaining tags properly
            const needsQuoting = (tag: string) => tag.includes(' ') || tag.includes(',') || tag.includes('"')
            const formattedTags = tags.map(tag => needsQuoting(tag) ? `"${tag.replace(/"/g, '\\"')}"` : tag)
            return `tag:${formattedTags.join(',')}`
          })
        } else {
          // Remove all tags - handle both quoted and unquoted
          newValue = newValue.replace(/tag:("([^"]*)"|([^\s]+))/gi, '')
        }
        break
      case 'title':
        // Handle both quoted and unquoted title values
        newValue = newValue.replace(/title:("([^"]*)"|([^\s]+))/gi, '')
        break
      case 'content':
        // Handle both quoted and unquoted content values
        newValue = newValue.replace(/content:("([^"]*)"|([^\s]+))/gi, '')
        break
      case 'category':
        // Handle both quoted and unquoted category values
        newValue = newValue.replace(/category:("([^"]*)"|([^\s]+))/gi, '')
        break
      case 'favorite':
        newValue = newValue.replace(/is:(not-)?favorite/gi, '')
        break
    }
    
    onChange(newValue.replace(/\s+/g, ' ').trim())
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(value.trim().length > 0 && suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={cn("pl-9 pr-10", className)}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(parsedQuery.tags.length > 0 || parsedQuery.title || parsedQuery.content || parsedQuery.category || parsedQuery.isFavorite !== undefined) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {parsedQuery.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Hash className="h-3 w-3 mr-1" />
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('tag', tag)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
          {parsedQuery.title && (
            <Badge variant="secondary" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              title:{parsedQuery.title}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('title')}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {parsedQuery.content && (
            <Badge variant="secondary" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              content:{parsedQuery.content}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('content')}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {parsedQuery.category && (
            <Badge variant="secondary" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              category:{parsedQuery.category}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('category')}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {parsedQuery.isFavorite === true && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1 fill-current" />
              favorite
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('favorite')}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {parsedQuery.isFavorite === false && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              not favorite
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter('favorite')}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md">
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground",
                    selectedSuggestion === index && "bg-accent text-accent-foreground"
                  )}
                >
                  <Search className="inline h-3 w-3 mr-2" />
                  {suggestion}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Quick Filters */}
      {!value && (
        <div className="flex flex-wrap gap-1 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuickFilter('is:favorite')}
            className="text-xs"
          >
            <Star className="h-3 w-3 mr-1" />
            Favorites
          </Button>
          {tags.slice(0, 3).map((tag) => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              onClick={() => addQuickFilter(`tag:${tag}`)}
              className="text-xs"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}