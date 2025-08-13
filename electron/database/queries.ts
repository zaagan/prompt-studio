import { Database } from 'sqlite3'
import { writeFileSync, readFileSync } from 'fs'
import { extname, basename } from 'path'
import type {
  Prompt,
  Category,
  Template,
  PromptVersion,
  CreatePromptData,
  UpdatePromptData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateTemplateData,
  UpdateTemplateData,
  ImportResult,
} from '../../src/types'

// Utility function to promisify database operations with transaction support
const runQuery = (db: Database, sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID, changes: this.changes })
        }
      })
    })
  })
}

const getQuery = <T = any>(db: Database, sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

const allQuery = <T = any>(db: Database, sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

// PROMPTS OPERATIONS
export const getAllPrompts = async (db: Database): Promise<readonly Prompt[]> => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    ORDER BY p.updated_at DESC
  `
  const rows = await allQuery<any>(db, sql)
  const prompts = rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_favorite: Boolean(row.is_favorite)
  })) as readonly Prompt[]
  return prompts
}

export const getPrompt = async (db: Database, id: number): Promise<Prompt | null> => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.id = ?
  `
  const row = await getQuery<any>(db, sql, [id])
  if (row) {
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      is_favorite: Boolean(row.is_favorite)
    } as Prompt
  }
  return null
}

export const createPrompt = async (db: Database, prompt: CreatePromptData): Promise<Prompt> => {
  const { title, content, description, category_id, template_id, tags, is_favorite } = prompt
  const sql = `
    INSERT INTO prompts (title, content, description, category_id, template_id, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  const result = await runQuery(db, sql, [
    title,
    content,
    description || null,
    category_id || null,
    template_id || null,
    JSON.stringify(tags || []),
    is_favorite || false
  ])

  // Create initial version
  await createPromptVersion(db, result.id, content)

  const created = await getPrompt(db, result.id)
  if (!created) throw new Error('Failed to create prompt')
  return created
}

export const updatePrompt = async (db: Database, id: number, prompt: UpdatePromptData): Promise<Prompt> => {
  const { title, content, description, category_id, template_id, tags, is_favorite } = prompt

  // Get current prompt to preserve existing values and check if content changed
  const currentPrompt = await getPrompt(db, id)
  if (!currentPrompt) throw new Error('Prompt not found')

  // Build dynamic SQL query with only provided fields
  const updates: string[] = []
  const values: any[] = []

  if (title !== undefined) {
    updates.push('title = ?')
    values.push(title)
  }

  if (content !== undefined) {
    updates.push('content = ?')
    values.push(content)
  }

  if (description !== undefined) {
    updates.push('description = ?')
    values.push(description || null)
  }

  if (category_id !== undefined) {
    updates.push('category_id = ?')
    values.push(category_id || null)
  }

  if (template_id !== undefined) {
    updates.push('template_id = ?')
    values.push(template_id || null)
  }

  if (tags !== undefined) {
    updates.push('tags = ?')
    values.push(JSON.stringify(tags || []))
  }

  if (is_favorite !== undefined) {
    updates.push('is_favorite = ?')
    values.push(is_favorite)
  }

  if (updates.length === 0) {
    // No updates to make, return current prompt
    return currentPrompt
  }

  // Always update the timestamp
  updates.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id) // Add id for WHERE clause

  const sql = `UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`
  await runQuery(db, sql, values)

  // Create new version if content changed
  if (content !== undefined && currentPrompt.content !== content) {
    const versions = await getPromptVersions(db, id)
    await createPromptVersion(db, id, content, versions.length + 1)
  }

  const updated = await getPrompt(db, id)
  if (!updated) throw new Error('Failed to update prompt')
  return updated
}

export const deletePrompt = async (db: Database, id: number): Promise<{ success: boolean }> => {
  const sql = 'DELETE FROM prompts WHERE id = ?'
  await runQuery(db, sql, [id])
  return { success: true }
}

export const searchPrompts = async (db: Database, query: string): Promise<readonly Prompt[]> => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.title LIKE ? OR p.content LIKE ? OR p.description LIKE ?
    ORDER BY p.updated_at DESC
  `
  const searchTerm = `%${query}%`
  const rows = await allQuery<any>(db, sql, [searchTerm, searchTerm, searchTerm])
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_favorite: Boolean(row.is_favorite)
  })) as readonly Prompt[]
}

export const getPromptsByTag = async (db: Database, tag: string): Promise<readonly Prompt[]> => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.tags LIKE ?
    ORDER BY p.updated_at DESC
  `
  const rows = await allQuery<any>(db, sql, [`%"${tag}"%`])
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_favorite: Boolean(row.is_favorite)
  })) as readonly Prompt[]
}

export const getAllTags = async (db: Database): Promise<readonly string[]> => {
  const sql = 'SELECT DISTINCT tags FROM prompts WHERE tags IS NOT NULL AND tags != "[]"'
  const rows = await allQuery<{ tags: string }>(db, sql)
  const allTags = new Set<string>()

  rows.forEach(row => {
    try {
      const tags = JSON.parse(row.tags) as string[]
      tags.forEach(tag => allTags.add(tag))
    } catch (e) {
      // Skip invalid JSON
    }
  })

  return Array.from(allTags).sort()
}

// PROMPT VERSIONS
export const getPromptVersions = async (db: Database, promptId: number): Promise<readonly PromptVersion[]> => {
  const sql = `
    SELECT * FROM prompt_versions 
    WHERE prompt_id = ? 
    ORDER BY version_number DESC
  `
  return await allQuery<PromptVersion>(db, sql, [promptId]) as readonly PromptVersion[]
}

export const createPromptVersion = async (db: Database, promptId: number, content: string, versionNumber?: number): Promise<PromptVersion> => {
  if (!versionNumber) {
    const versions = await getPromptVersions(db, promptId)
    versionNumber = versions.length + 1
  }

  const sql = `
    INSERT INTO prompt_versions (prompt_id, content, version_number)
    VALUES (?, ?, ?)
  `
  const result = await runQuery(db, sql, [promptId, content, versionNumber])
  
  return {
    id: result.id,
    prompt_id: promptId,
    content,
    version_number: versionNumber,
    created_at: new Date().toISOString()
  }
}

// CATEGORIES
export const getAllCategories = async (db: Database): Promise<readonly Category[]> => {
  const sql = 'SELECT * FROM categories ORDER BY name'
  return await allQuery<Category>(db, sql) as readonly Category[]
}

export const createCategory = async (db: Database, category: CreateCategoryData): Promise<Category> => {
  const { name, description, color } = category
  const sql = 'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)'
  const result = await runQuery(db, sql, [name, description || null, color || '#007acc'])
  
  const created = await getQuery<Category>(db, 'SELECT * FROM categories WHERE id = ?', [result.id])
  if (!created) throw new Error('Failed to create category')
  return created
}

export const updateCategory = async (db: Database, id: number, category: UpdateCategoryData): Promise<Category> => {
  const { name, description, color } = category
  const sql = `
    UPDATE categories 
    SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
  await runQuery(db, sql, [name, description || null, color || '#007acc', id])
  
  const updated = await getQuery<Category>(db, 'SELECT * FROM categories WHERE id = ?', [id])
  if (!updated) throw new Error('Failed to update category')
  return updated
}

export const deleteCategory = async (db: Database, id: number): Promise<{ success: boolean }> => {
  // First, update prompts to remove the category reference
  await runQuery(db, 'UPDATE prompts SET category_id = NULL WHERE category_id = ?', [id])
  // Then delete the category
  await runQuery(db, 'DELETE FROM categories WHERE id = ?', [id])
  return { success: true }
}

// TEMPLATES
export const getAllTemplates = async (db: Database): Promise<readonly Template[]> => {
  const sql = `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.name
  `
  const rows = await allQuery<any>(db, sql)
  return rows.map(row => ({
    ...row,
    variables: row.variables ? JSON.parse(row.variables) : []
  })) as readonly Template[]
}

export const createTemplate = async (db: Database, template: CreateTemplateData): Promise<Template> => {
  const { name, description, content, variables, category_id } = template
  const sql = `
    INSERT INTO templates (name, description, content, variables, category_id)
    VALUES (?, ?, ?, ?, ?)
  `
  const result = await runQuery(db, sql, [
    name,
    description || null,
    content,
    JSON.stringify(variables || []),
    category_id || null
  ])
  
  const created = await getQuery<any>(db, `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `, [result.id])
  
  if (!created) throw new Error('Failed to create template')
  
  return {
    ...created,
    variables: created.variables ? JSON.parse(created.variables) : []
  } as Template
}

export const updateTemplate = async (db: Database, id: number, template: UpdateTemplateData): Promise<Template> => {
  const { name, description, content, variables, category_id } = template
  const sql = `
    UPDATE templates 
    SET name = ?, description = ?, content = ?, variables = ?, category_id = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
  await runQuery(db, sql, [
    name,
    description || null,
    content,
    JSON.stringify(variables || []),
    category_id || null,
    id
  ])
  
  const updated = await getQuery<any>(db, `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `, [id])
  
  if (!updated) throw new Error('Failed to update template')
  
  return {
    ...updated,
    variables: updated.variables ? JSON.parse(updated.variables) : []
  } as Template
}

export const deleteTemplate = async (db: Database, id: number): Promise<{ success: boolean }> => {
  // First, update prompts to remove the template reference
  await runQuery(db, 'UPDATE prompts SET template_id = NULL WHERE template_id = ?', [id])
  // Then delete the template
  await runQuery(db, 'DELETE FROM templates WHERE id = ?', [id])
  return { success: true }
}

export const generateFromTemplate = async (db: Database, templateId: number, variables: Record<string, string>): Promise<CreatePromptData> => {
  const template = await getQuery<Template>(db, 'SELECT * FROM templates WHERE id = ?', [templateId])
  if (!template) {
    throw new Error('Template not found')
  }

  let content = template.content

  // Replace variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    content = content.replace(regex, value)
  })

  return {
    title: `Generated from ${template.name}`,
    content,
    template_id: templateId,
    category_id: template.category_id
  }
}

// SETTINGS
export const getSetting = async (db: Database, key: string): Promise<string | null> => {
  const row = await getQuery<{ value: string }>(db, 'SELECT value FROM settings WHERE key = ?', [key])
  return row ? row.value : null
}

export const setSetting = async (db: Database, key: string, value: string): Promise<{ key: string; value: string }> => {
  const sql = `
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `
  await runQuery(db, sql, [key, value])
  return { key, value }
}

// EXPORT/IMPORT
export const exportPrompts = async (db: Database, filePath: string, format: 'json' | 'txt' = 'json'): Promise<void> => {
  const prompts = await getAllPrompts(db)

  if (format === 'json') {
    const data = {
      prompts,
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    }
    writeFileSync(filePath, JSON.stringify(data, null, 2))
  } else {
    let content = 'Prompt Studio Export\n'
    content += '==================\n\n'

    prompts.forEach((prompt, index) => {
      content += `${index + 1}. ${prompt.title}\n`
      content += `Category: ${prompt.category_name || 'None'}\n`
      content += `Tags: ${prompt.tags.join(', ')}\n`
      content += `Created: ${prompt.created_at}\n\n`
      content += `${prompt.content}\n\n`
      if (prompt.description) {
        content += `Description: ${prompt.description}\n`
      }
      content += '---\n\n'
    })

    writeFileSync(filePath, content)
  }
}

export const importPrompts = async (db: Database, filePath: string): Promise<ImportResult> => {
  try {
    const content = readFileSync(filePath, 'utf8')
    const ext = extname(filePath).toLowerCase()

    if (ext === '.json') {
      const data = JSON.parse(content)
      const prompts = data.prompts || data // Handle both formats

      let imported = 0
      for (const prompt of prompts) {
        try {
          // Remove ID to avoid conflicts
          const { id, created_at, updated_at, ...promptData } = prompt
          await createPrompt(db, promptData)
          imported++
        } catch (err) {
          console.error('Error importing prompt:', err)
        }
      }

      return { success: true, imported, total: prompts.length }
    } else {
      // Simple text import - create one prompt from the file
      const title = basename(filePath, ext)
      await createPrompt(db, {
        title,
        content,
        description: `Imported from ${filePath}`,
        tags: ['imported']
      })

      return { success: true, imported: 1, total: 1 }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}