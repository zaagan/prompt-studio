const fs = require('fs');
const path = require('path');

// Utility function to promisify database operations
const runQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// PROMPTS OPERATIONS
const getAllPrompts = async (db) => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    ORDER BY p.updated_at DESC
  `;
  const rows = await allQuery(db, sql);
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : []
  }));
};

const getPrompt = async (db, id) => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.id = ?
  `;
  const row = await getQuery(db, sql, [id]);
  if (row) {
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    };
  }
  return null;
};

const createPrompt = async (db, prompt) => {
  const { title, content, description, category_id, template_id, tags, is_favorite } = prompt;
  const sql = `
    INSERT INTO prompts (title, content, description, category_id, template_id, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await runQuery(db, sql, [
    title,
    content,
    description || null,
    category_id || null,
    template_id || null,
    JSON.stringify(tags || []),
    is_favorite || false
  ]);
  
  // Create initial version
  await createPromptVersion(db, result.id, content);
  
  return { id: result.id, ...prompt };
};

const updatePrompt = async (db, id, prompt) => {
  const { title, content, description, category_id, template_id, tags, is_favorite } = prompt;
  
  // Get current content to check if it changed
  const currentPrompt = await getPrompt(db, id);
  
  const sql = `
    UPDATE prompts 
    SET title = ?, content = ?, description = ?, category_id = ?, 
        template_id = ?, tags = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runQuery(db, sql, [
    title,
    content,
    description || null,
    category_id || null,
    template_id || null,
    JSON.stringify(tags || []),
    is_favorite || false,
    id
  ]);
  
  // Create new version if content changed
  if (currentPrompt && currentPrompt.content !== content) {
    const versions = await getPromptVersions(db, id);
    await createPromptVersion(db, id, content, versions.length + 1);
  }
  
  return { id, ...prompt };
};

const deletePrompt = async (db, id) => {
  const sql = 'DELETE FROM prompts WHERE id = ?';
  await runQuery(db, sql, [id]);
  return { success: true };
};

const searchPrompts = async (db, query) => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.title LIKE ? OR p.content LIKE ? OR p.description LIKE ?
    ORDER BY p.updated_at DESC
  `;
  const searchTerm = `%${query}%`;
  const rows = await allQuery(db, sql, [searchTerm, searchTerm, searchTerm]);
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : []
  }));
};

const getPromptsByTag = async (db, tag) => {
  const sql = `
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.tags LIKE ?
    ORDER BY p.updated_at DESC
  `;
  const rows = await allQuery(db, sql, [`%"${tag}"%`]);
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : []
  }));
};

const getAllTags = async (db) => {
  const sql = 'SELECT DISTINCT tags FROM prompts WHERE tags IS NOT NULL AND tags != "[]"';
  const rows = await allQuery(db, sql);
  const allTags = new Set();
  
  rows.forEach(row => {
    try {
      const tags = JSON.parse(row.tags);
      tags.forEach(tag => allTags.add(tag));
    } catch (e) {
      // Skip invalid JSON
    }
  });
  
  return Array.from(allTags).sort();
};

// PROMPT VERSIONS
const getPromptVersions = async (db, promptId) => {
  const sql = `
    SELECT * FROM prompt_versions 
    WHERE prompt_id = ? 
    ORDER BY version_number DESC
  `;
  return await allQuery(db, sql, [promptId]);
};

const createPromptVersion = async (db, promptId, content, versionNumber = null) => {
  if (!versionNumber) {
    const versions = await getPromptVersions(db, promptId);
    versionNumber = versions.length + 1;
  }
  
  const sql = `
    INSERT INTO prompt_versions (prompt_id, content, version_number)
    VALUES (?, ?, ?)
  `;
  const result = await runQuery(db, sql, [promptId, content, versionNumber]);
  return { id: result.id, promptId, content, versionNumber };
};

// CATEGORIES
const getAllCategories = async (db) => {
  const sql = 'SELECT * FROM categories ORDER BY name';
  return await allQuery(db, sql);
};

const createCategory = async (db, category) => {
  const { name, description, color } = category;
  const sql = 'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)';
  const result = await runQuery(db, sql, [name, description || null, color || '#007acc']);
  return { id: result.id, ...category };
};

const updateCategory = async (db, id, category) => {
  const { name, description, color } = category;
  const sql = `
    UPDATE categories 
    SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runQuery(db, sql, [name, description || null, color || '#007acc', id]);
  return { id, ...category };
};

const deleteCategory = async (db, id) => {
  // First, update prompts to remove the category reference
  await runQuery(db, 'UPDATE prompts SET category_id = NULL WHERE category_id = ?', [id]);
  // Then delete the category
  await runQuery(db, 'DELETE FROM categories WHERE id = ?', [id]);
  return { success: true };
};

// TEMPLATES
const getAllTemplates = async (db) => {
  const sql = `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.name
  `;
  const rows = await allQuery(db, sql);
  return rows.map(row => ({
    ...row,
    variables: row.variables ? JSON.parse(row.variables) : []
  }));
};

const createTemplate = async (db, template) => {
  const { name, description, content, variables, category_id } = template;
  const sql = `
    INSERT INTO templates (name, description, content, variables, category_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  const result = await runQuery(db, sql, [
    name,
    description || null,
    content,
    JSON.stringify(variables || []),
    category_id || null
  ]);
  return { id: result.id, ...template };
};

const updateTemplate = async (db, id, template) => {
  const { name, description, content, variables, category_id } = template;
  const sql = `
    UPDATE templates 
    SET name = ?, description = ?, content = ?, variables = ?, category_id = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runQuery(db, sql, [
    name,
    description || null,
    content,
    JSON.stringify(variables || []),
    category_id || null,
    id
  ]);
  return { id, ...template };
};

const deleteTemplate = async (db, id) => {
  // First, update prompts to remove the template reference
  await runQuery(db, 'UPDATE prompts SET template_id = NULL WHERE template_id = ?', [id]);
  // Then delete the template
  await runQuery(db, 'DELETE FROM templates WHERE id = ?', [id]);
  return { success: true };
};

const generateFromTemplate = async (db, templateId, variables) => {
  const template = await getQuery(db, 'SELECT * FROM templates WHERE id = ?', [templateId]);
  if (!template) {
    throw new Error('Template not found');
  }
  
  let content = template.content;
  
  // Replace variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value);
  });
  
  return {
    title: `Generated from ${template.name}`,
    content,
    template_id: templateId,
    category_id: template.category_id
  };
};

// SETTINGS
const getSetting = async (db, key) => {
  const row = await getQuery(db, 'SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
};

const setSetting = async (db, key, value) => {
  const sql = `
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `;
  await runQuery(db, sql, [key, value]);
  return { key, value };
};

// EXPORT/IMPORT
const exportPrompts = async (db, filePath, format = 'json') => {
  const prompts = await getAllPrompts(db);
  
  if (format === 'json') {
    const data = {
      prompts,
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } else {
    let content = 'Prompt Studio Export\n';
    content += '==================\n\n';
    
    prompts.forEach((prompt, index) => {
      content += `${index + 1}. ${prompt.title}\n`;
      content += `Category: ${prompt.category_name || 'None'}\n`;
      content += `Tags: ${prompt.tags.join(', ')}\n`;
      content += `Created: ${prompt.created_at}\n\n`;
      content += `${prompt.content}\n\n`;
      if (prompt.description) {
        content += `Description: ${prompt.description}\n`;
      }
      content += '---\n\n';
    });
    
    fs.writeFileSync(filePath, content);
  }
  
  return { success: true, count: prompts.length };
};

const importPrompts = async (db, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.json') {
      const data = JSON.parse(content);
      const prompts = data.prompts || data; // Handle both formats
      
      let imported = 0;
      for (const prompt of prompts) {
        try {
          // Remove ID to avoid conflicts
          const { id, ...promptData } = prompt;
          await createPrompt(db, promptData);
          imported++;
        } catch (err) {
          console.error('Error importing prompt:', err);
        }
      }
      
      return { success: true, imported, total: prompts.length };
    } else {
      // Simple text import - create one prompt from the file
      const title = path.basename(filePath, ext);
      await createPrompt(db, {
        title,
        content,
        description: `Imported from ${filePath}`,
        tags: ['imported']
      });
      
      return { success: true, imported: 1, total: 1 };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// TEST RESULTS
const saveTestResult = async (db, result) => {
  const { prompt_id, input_prompt, response, model, api_endpoint, response_time, token_usage } = result;
  const sql = `
    INSERT INTO test_results (prompt_id, input_prompt, response, model, api_endpoint, response_time, token_usage)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const dbResult = await runQuery(db, sql, [
    prompt_id,
    input_prompt,
    response,
    model || null,
    api_endpoint || null,
    response_time || null,
    JSON.stringify(token_usage || {})
  ]);
  return { id: dbResult.id, ...result };
};

const getTestResults = async (db, promptId, limit = 10) => {
  const sql = `
    SELECT * FROM test_results 
    WHERE prompt_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  const rows = await allQuery(db, sql, [promptId, limit]);
  return rows.map(row => ({
    ...row,
    token_usage: row.token_usage ? JSON.parse(row.token_usage) : {}
  }));
};

module.exports = {
  // Prompts
  getAllPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  searchPrompts,
  getPromptsByTag,
  getAllTags,
  
  // Versions
  getPromptVersions,
  createPromptVersion,
  
  // Categories
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Templates
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateFromTemplate,
  
  // Settings
  getSetting,
  setSetting,
  
  // Import/Export
  exportPrompts,
  importPrompts,
  
  // Test Results
  saveTestResult,
  getTestResults
};