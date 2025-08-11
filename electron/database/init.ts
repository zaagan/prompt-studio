import sqlite3, { Database } from 'sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { app } from 'electron'
import { sampleCategories, sampleTemplates, samplePrompts, assignCategoryIds } from './sample-data'

let database: Database | null = null

export const getDatabasePath = (): string => {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  const dbPath = join(userDataPath, 'prompt-studio.db')
  return dbPath
}

export const initDatabase = (): Promise<Database> => {
  return new Promise((resolve, reject) => {
    if (database) {
      return resolve(database)
    }

    const dbPath = getDatabasePath()

    database = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err)
        return reject(err)
      }
      
      // Enable WAL mode for better concurrency and durability
      database!.run('PRAGMA journal_mode=WAL;', (pragmaErr) => {
        if (pragmaErr) {
          console.warn('Could not enable WAL mode:', pragmaErr)
        }
        
        // Enable foreign keys
        database!.run('PRAGMA foreign_keys=ON;', (fkErr) => {
          if (fkErr) {
            console.warn('Could not enable foreign keys:', fkErr)
          }
          
          // Set synchronous mode to FULL for data integrity
          database!.run('PRAGMA synchronous=FULL;', (syncErr) => {
            if (syncErr) {
              console.warn('Could not set synchronous mode:', syncErr)
            }
            
            createTables()
              .then(() => resolve(database!))
              .catch(reject)
          })
        })
      })
    })
  })
}

const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('Database not initialized'))

    const tables = [
      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#007acc',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Templates table
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        variables TEXT, -- JSON array of variable names
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )`,

      // Prompts table
      `CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        template_id INTEGER,
        tags TEXT, -- JSON array of tags
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (template_id) REFERENCES templates (id)
      )`,

      // Prompt versions table for history tracking
      `CREATE TABLE IF NOT EXISTS prompt_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prompt_id) REFERENCES prompts (id) ON DELETE CASCADE
      )`,

      // Test results table
      `CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id INTEGER NOT NULL,
        input_prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        model TEXT,
        api_endpoint TEXT,
        response_time INTEGER,
        token_usage TEXT, -- JSON object with usage stats
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prompt_id) REFERENCES prompts (id) ON DELETE CASCADE
      )`
    ]

    let completed = 0
    const total = tables.length

    if (total === 0) {
      return resolve()
    }

    tables.forEach((sql, index) => {
      database!.run(sql, (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err)
          return reject(err)
        }

        completed++

        if (completed === total) {
          insertDefaultData()
            .then(resolve)
            .catch(reject)
        }
      })
    })
  })
}

const insertDefaultData = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('Database not initialized'))

    // Check if this is first time setup by looking at settings
    database.get('SELECT value FROM settings WHERE key = ?', ['first_time_setup_complete'], (err, row: any) => {
      if (err) {
        console.error('Error checking first time setup:', err)
        return reject(err)
      }

      // If first time setup is already complete, just insert basic categories if none exist
      if (row && row.value === 'true') {
        database!.get('SELECT COUNT(*) as count FROM categories', (countErr, countRow: any) => {
          if (countErr) {
            console.error('Error checking existing categories:', countErr)
            return reject(countErr)
          }
          
          if (countRow.count > 0) {
            return resolve() // Data already exists
          }
          
          // Insert just basic categories for existing users
          insertBasicCategories().then(resolve).catch(reject)
        })
        return
      }

      // This is first time setup - insert sample data
      console.log('First time setup detected - inserting sample data...')
      insertSampleData()
        .then(() => {
          // Mark first time setup as complete
          database!.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 
            ['first_time_setup_complete', 'true'], 
            (settingErr) => {
              if (settingErr) {
                console.error('Error marking first time setup complete:', settingErr)
                return reject(settingErr)
              }
              console.log('Sample data loaded successfully - first time setup complete')
              resolve()
            }
          )
        })
        .catch(reject)
    })
  })
}

const insertBasicCategories = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('Database not initialized'))

    // Insert just the basic default categories (no sample prompts)
    const basicCategories = [
      { name: 'General', description: 'General purpose prompts', color: '#007acc' },
      { name: 'Creative Writing', description: 'Prompts for creative writing tasks', color: '#ff6b6b' },
      { name: 'Code Generation', description: 'Programming and code-related prompts', color: '#4ecdc4' },
      { name: 'Analysis', description: 'Data analysis and research prompts', color: '#45b7d1' },
      { name: 'Business', description: 'Business and professional prompts', color: '#96ceb4' }
    ]

    database.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        console.error('Error starting transaction:', beginErr)
        return reject(beginErr)
      }

      let completed = 0
      const total = basicCategories.length

      basicCategories.forEach((category) => {
        database!.run(
          'INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)',
          [category.name, category.description, category.color],
          function(err) {
            if (err) {
              console.error('Error inserting basic category:', err)
              database!.run('ROLLBACK')
              return reject(err)
            }
            
            completed++
            if (completed === total) {
              database!.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('Error committing basic categories:', commitErr)
                  return reject(commitErr)
                }
                resolve()
              })
            }
          }
        )
      })
    })
  })
}

const insertSampleData = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('Database not initialized'))

    // Use transaction for all sample data
    database.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        console.error('Error starting sample data transaction:', beginErr)
        return reject(beginErr)
      }

      let totalOperations = 0
      let completedOperations = 0

      // Insert categories first
      const categoriesToInsert = [...sampleCategories]
      totalOperations += categoriesToInsert.length

      const checkComplete = () => {
        completedOperations++
        if (completedOperations === totalOperations) {
          database!.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('Error committing sample data:', commitErr)
              database!.run('ROLLBACK')
              return reject(commitErr)
            }
            resolve()
          })
        }
      }

      // Insert sample categories and get their IDs
      let processedCategories = 0
      const categoryIdMap = new Map<string, number>()

      categoriesToInsert.forEach((category, index) => {
        // First try to insert, then get the ID regardless of whether it was inserted or already existed
        database!.run(
          'INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)',
          [category.name, category.description, category.color],
          function(insertErr) {
            if (insertErr) {
              console.error('Error inserting sample category:', insertErr)
              database!.run('ROLLBACK')
              return reject(insertErr)
            }
            
            // Now get the actual ID for this category
            database!.get(
              'SELECT id FROM categories WHERE name = ?',
              [category.name],
              function(selectErr, row: any) {
                if (selectErr) {
                  console.error('Error getting category ID:', selectErr)
                  database!.run('ROLLBACK')
                  return reject(selectErr)
                }
                
                const categoryId = row.id
                categoryIdMap.set(category.name, categoryId)

                // Insert templates for this category
                const categoryTemplates = sampleTemplates.filter(t => t.category_id === (index + 1))
                totalOperations += categoryTemplates.length

                categoryTemplates.forEach((template) => {
                  database!.run(
                    'INSERT OR IGNORE INTO templates (name, description, content, variables, category_id) VALUES (?, ?, ?, ?, ?)',
                    [template.name, template.description, template.content, JSON.stringify(template.variables), categoryId],
                    (templateErr) => {
                      if (templateErr) {
                        console.error('Error inserting sample template:', templateErr)
                        database!.run('ROLLBACK')
                        return reject(templateErr)
                      }
                      checkComplete()
                    }
                  )
                })

                // Insert prompts for this category
                const categoryPrompts = samplePrompts.filter(p => p.category_id === (index + 1))
                totalOperations += categoryPrompts.length

                categoryPrompts.forEach((prompt) => {
                  database!.run(
                    'INSERT OR IGNORE INTO prompts (title, content, description, category_id, template_id, tags, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                      prompt.title,
                      prompt.content,
                      prompt.description || null,
                      categoryId,
                      prompt.template_id || null,
                      JSON.stringify(prompt.tags || []),
                      prompt.is_favorite || false
                    ],
                    function(promptErr) {
                      if (promptErr) {
                        console.error('Error inserting sample prompt:', promptErr)
                        database!.run('ROLLBACK')
                        return reject(promptErr)
                      }
                      
                      // Only create version if prompt was actually inserted (lastID > 0)
                      if (this.lastID > 0) {
                        database!.run(
                          'INSERT INTO prompt_versions (prompt_id, content, version_number) VALUES (?, ?, ?)',
                          [this.lastID, prompt.content, 1],
                          (versionErr) => {
                            if (versionErr) {
                              console.error('Error inserting prompt version:', versionErr)
                            }
                            checkComplete()
                          }
                        )
                      } else {
                        checkComplete()
                      }
                    }
                  )
                })

                checkComplete()
              }
            )
          }
        )
      })
    })
  })
}

// Factory reset function - clears all user data and resets to sample data
export const factoryReset = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('Database not initialized'))

    console.log('Performing factory reset...')
    
    database.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        console.error('Error starting factory reset transaction:', beginErr)
        return reject(beginErr)
      }

      // Delete all data in reverse order of dependencies
      const deleteQueries = [
        'DELETE FROM test_results',
        'DELETE FROM prompt_versions', 
        'DELETE FROM prompts',
        'DELETE FROM templates',
        'DELETE FROM categories',
        'DELETE FROM settings WHERE key != "first_time_setup_complete"' // Keep the first time setup flag
      ]

      let completed = 0
      const total = deleteQueries.length

      deleteQueries.forEach((query) => {
        database!.run(query, (err) => {
          if (err) {
            console.error('Error during factory reset:', err)
            database!.run('ROLLBACK')
            return reject(err)
          }
          
          completed++
          if (completed === total) {
            // Reset the first time setup flag so sample data will be loaded again
            database!.run(
              'UPDATE settings SET value = ? WHERE key = ?',
              ['false', 'first_time_setup_complete'],
              (updateErr) => {
                if (updateErr) {
                  console.error('Error resetting first time setup flag:', updateErr)
                  database!.run('ROLLBACK')
                  return reject(updateErr)
                }
                
                database!.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('Error committing factory reset:', commitErr)
                    return reject(commitErr)
                  }
                  console.log('Factory reset completed successfully')
                  resolve()
                })
              }
            )
          }
        })
      })
    })
  })
}

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve) => {
    if (database) {
      database.close((err) => {
        if (err) {
          console.error('Error closing database:', err)
        } else {
          console.log('Database connection closed')
        }
        database = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}