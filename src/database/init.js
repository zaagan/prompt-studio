const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let database = null;

const getDatabasePath = () => {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'prompt-studio.db');
};

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (database) {
      return resolve(database);
    }

    const dbPath = getDatabasePath();
    console.log('Database path:', dbPath);

    database = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return reject(err);
      }
      console.log('Connected to SQLite database');
      createTables()
        .then(() => resolve(database))
        .catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
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
    ];

    let completed = 0;
    const total = tables.length;

    if (total === 0) {
      return resolve();
    }

    tables.forEach((sql, index) => {
      database.run(sql, (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err);
          return reject(err);
        }
        
        completed++;
        console.log(`Created table ${index + 1}/${total}`);
        
        if (completed === total) {
          console.log('All tables created successfully');
          insertDefaultData()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  });
};

const insertDefaultData = () => {
  return new Promise((resolve, reject) => {
    // First check if we already have data
    database.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
      if (err) {
        console.error('Error checking existing data:', err);
        return reject(err);
      }
      
      if (row.count > 0) {
        console.log('Default data already exists, skipping insertion');
        return resolve();
      }
      
      console.log('No existing data found, inserting defaults...');
      
      // Insert default categories
      const defaultCategories = [
        { name: 'General', description: 'General purpose prompts', color: '#007acc' },
        { name: 'Creative Writing', description: 'Prompts for creative writing tasks', color: '#ff6b6b' },
        { name: 'Code Generation', description: 'Programming and code-related prompts', color: '#4ecdc4' },
        { name: 'Analysis', description: 'Data analysis and research prompts', color: '#45b7d1' },
        { name: 'Marketing', description: 'Marketing and copywriting prompts', color: '#96ceb4' }
      ];

      // Insert default templates
      const defaultTemplates = [
        {
          name: 'Basic Question Template',
          description: 'A simple template for asking questions',
          content: 'Please answer the following question about {{topic}}:\n\n{{question}}\n\nProvide a detailed explanation.',
          variables: JSON.stringify(['topic', 'question']),
          category_id: 1
        },
        {
          name: 'Code Review Template',
          description: 'Template for code review requests',
          content: 'Please review the following {{language}} code and provide feedback:\n\n```{{language}}\n{{code}}\n```\n\nFocus on:\n- Code quality\n- Performance\n- Best practices\n- Security considerations',
          variables: JSON.stringify(['language', 'code']),
          category_id: 3
        },
        {
          name: 'Creative Story Template',
          description: 'Template for creative writing prompts',
          content: 'Write a {{genre}} story about {{character}} who discovers {{discovery}} in {{setting}}. The story should be approximately {{length}} words and include {{mood}} tone.',
          variables: JSON.stringify(['genre', 'character', 'discovery', 'setting', 'length', 'mood']),
          category_id: 2
        }
      ];

      let insertedCategories = 0;
      let insertedTemplates = 0;
      const totalOperations = defaultCategories.length + defaultTemplates.length;
      let completedOperations = 0;

      // Insert categories
      defaultCategories.forEach((category) => {
        database.run(
          'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
          [category.name, category.description, category.color],
          function(err) {
            if (err) {
              console.error('Error inserting category:', err);
            } else {
              insertedCategories++;
            }
            completedOperations++;
            
            if (completedOperations === totalOperations) {
              console.log(`Inserted ${insertedCategories} default categories and ${insertedTemplates} default templates`);
              resolve();
            }
          }
        );
      });

      // Insert templates
      defaultTemplates.forEach((template) => {
        database.run(
          'INSERT INTO templates (name, description, content, variables, category_id) VALUES (?, ?, ?, ?, ?)',
          [template.name, template.description, template.content, template.variables, template.category_id],
          function(err) {
            if (err) {
              console.error('Error inserting template:', err);
            } else {
              insertedTemplates++;
            }
            completedOperations++;
            
            if (completedOperations === totalOperations) {
              console.log(`Inserted ${insertedCategories} default categories and ${insertedTemplates} default templates`);
              resolve();
            }
          }
        );
      });
    });
  });
};

const closeDatabase = () => {
  return new Promise((resolve) => {
    if (database) {
      database.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
        database = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initDatabase,
  closeDatabase,
  getDatabasePath
};