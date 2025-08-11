interface SearchQuery {
  generalQuery: string
  tags: string[]
  title: string
  content: string
  category: string
  isFavorite?: boolean | undefined
}

export function parseSearchQuery(query: string): SearchQuery {
  const result: SearchQuery = {
    generalQuery: '',
    tags: [],
    title: '',
    content: '',
    category: '',
    isFavorite: undefined
  }

  if (!query.trim()) {
    return result
  }

  // Regular expressions for different search patterns
  // Updated patterns to handle quoted strings and multi-word values
  const patterns = [
    { key: 'tag', regex: /tag:("([^"]*)"|([^\s]+))/gi },
    { key: 'title', regex: /title:("([^"]*)"|([^\s]+))/gi },
    { key: 'content', regex: /content:("([^"]*)"|([^\s]+))/gi },
    { key: 'category', regex: /category:("([^"]*)"|([^\s]+))/gi },
    { key: 'favorite', regex: /is:favorite/gi },
    { key: 'not-favorite', regex: /is:not-favorite/gi }
  ]

  let remainingQuery = query

  // Extract special patterns
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.regex.exec(query)) !== null) {
      // For quoted strings: match[2] contains quoted content, match[3] contains unquoted content
      const value = match[2] || match[3] || match[1] || ''
      
      switch (pattern.key) {
        case 'tag':
          // Handle comma-separated tags: tag:AI,Writing
          result.tags.push(...value.split(',').map(t => t.trim()).filter(Boolean))
          break
        case 'title':
          result.title = value.trim()
          break
        case 'content':
          result.content = value.trim()
          break
        case 'category':
          result.category = value.trim()
          break
        case 'favorite':
          result.isFavorite = true
          break
        case 'not-favorite':
          result.isFavorite = false
          break
      }
      
      // Remove the matched pattern from the remaining query
      remainingQuery = remainingQuery.replace(match[0], '').trim()
    }
  }

  // The remaining query is treated as a general search
  result.generalQuery = remainingQuery.trim()

  return result
}

function needsQuotes(value: string): boolean {
  return value.includes(' ') || value.includes(',') || value.includes('"')
}

function formatValue(value: string): string {
  if (needsQuotes(value)) {
    // Escape any existing quotes and wrap in quotes
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return value
}

export function formatSearchQuery(parsedQuery: SearchQuery): string {
  const parts: string[] = []
  
  if (parsedQuery.generalQuery) {
    parts.push(parsedQuery.generalQuery)
  }
  
  if (parsedQuery.tags.length > 0) {
    // Format tags, quoting individual tags if needed
    const formattedTags = parsedQuery.tags.map(tag => needsQuotes(tag) ? formatValue(tag) : tag)
    parts.push(`tag:${formattedTags.join(',')}`)
  }
  
  if (parsedQuery.title) {
    parts.push(`title:${formatValue(parsedQuery.title)}`)
  }
  
  if (parsedQuery.content) {
    parts.push(`content:${formatValue(parsedQuery.content)}`)
  }
  
  if (parsedQuery.category) {
    parts.push(`category:${formatValue(parsedQuery.category)}`)
  }
  
  if (parsedQuery.isFavorite === true) {
    parts.push('is:favorite')
  } else if (parsedQuery.isFavorite === false) {
    parts.push('is:not-favorite')
  }
  
  return parts.join(' ')
}

export function getSearchSuggestions(query: string, availableTags: string[], availableCategories: string[]): string[] {
  const suggestions: string[] = []
  const lowerQuery = query.toLowerCase()
  
  // Tag suggestions
  if (lowerQuery.includes('tag:')) {
    const tagMatch = lowerQuery.match(/tag:([^,\s]*)$/)
    if (tagMatch) {
      const partial = tagMatch[1] || ''
      const matchingTags = availableTags
        .filter(tag => tag.toLowerCase().startsWith(partial.toLowerCase()))
        .slice(0, 5)
      
      matchingTags.forEach(tag => {
        suggestions.push(query.replace(/tag:[^,\s]*$/, `tag:${tag}`))
      })
    }
  }
  
  // Category suggestions
  if (lowerQuery.includes('category:')) {
    const categoryMatch = lowerQuery.match(/category:("([^"]*)"|([^\s]*))$/)
    if (categoryMatch) {
      const partial = (categoryMatch[2] || categoryMatch[3] || '').toLowerCase()
      const matchingCategories = availableCategories
        .filter(cat => cat.toLowerCase().startsWith(partial))
        .slice(0, 5)
      
      matchingCategories.forEach(category => {
        const needsQuotes = category.includes(' ') || category.includes(',') || category.includes('"')
        const formattedCategory = needsQuotes ? `"${category.replace(/"/g, '\\"')}"` : category
        suggestions.push(query.replace(/category:("([^"]*)"|([^\s]*))$/, `category:${formattedCategory}`))
      })
    }
  }
  
  // Add common search patterns if query is simple
  if (!query.includes(':') && query.trim()) {
    suggestions.push(
      `${query} is:favorite`,
      `tag:${query}`,
      `title:${query}`,
      `content:${query}`
    )
  }
  
  return suggestions.slice(0, 8) // Limit to 8 suggestions
}