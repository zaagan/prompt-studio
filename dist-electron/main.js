"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const sampleCategories = [
  { name: "General", description: "General purpose prompts for various tasks", color: "#6366f1" },
  { name: "Creative Writing", description: "Prompts for creative writing, storytelling, and content creation", color: "#ec4899" },
  { name: "Code Generation", description: "Programming, debugging, and code-related prompts", color: "#10b981" },
  { name: "Analysis", description: "Data analysis, research, and analytical thinking prompts", color: "#f59e0b" },
  { name: "Business", description: "Business strategy, marketing, and professional communication", color: "#8b5cf6" },
  { name: "Education", description: "Learning, teaching, and educational content prompts", color: "#06b6d4" },
  { name: "Personal", description: "Personal development, productivity, and lifestyle prompts", color: "#ef4444" }
];
const sampleTemplates = [
  {
    name: "Code Review Template",
    description: "Comprehensive code review with focus areas",
    content: `Please review the following {{language}} code and provide feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
- Code quality and readability
- Performance optimizations
- Security considerations
- Best practices for {{language}}
- Potential bugs or issues

Please provide specific suggestions for improvement.`,
    variables: ["language", "code"],
    category_id: 3
  },
  {
    name: "Blog Post Outline",
    description: "Structure for creating engaging blog posts",
    content: `Create a detailed blog post outline for: "{{title}}"

Target audience: {{audience}}
Tone: {{tone}}
Word count: {{wordCount}} words

Include:
1. Compelling headline variations (3-5 options)
2. Introduction hook
3. Main sections with subheadings
4. Key points for each section
5. Call-to-action ideas
6. SEO considerations

Make it engaging and actionable for the {{audience}} audience.`,
    variables: ["title", "audience", "tone", "wordCount"],
    category_id: 2
  },
  {
    name: "Data Analysis Framework",
    description: "Structured approach for data analysis tasks",
    content: `Analyze the following {{dataType}} data:

{{dataDescription}}

Please provide:
1. Data overview and quality assessment
2. Key patterns and trends identified
3. Statistical insights and correlations
4. {{analysisType}} analysis
5. Actionable recommendations
6. Potential limitations and caveats

Present findings in a clear, business-friendly format with supporting visualizations suggestions.`,
    variables: ["dataType", "dataDescription", "analysisType"],
    category_id: 4
  },
  {
    name: "Learning Plan Creator",
    description: "Personalized learning roadmap template",
    content: `Create a comprehensive learning plan for: {{subject}}

Learner profile:
- Current level: {{currentLevel}}
- Available time: {{timeCommitment}} per week
- Learning style: {{learningStyle}}
- Goal: {{goal}}

Include:
1. Learning objectives and milestones
2. Week-by-week study plan
3. Recommended resources (books, courses, tutorials)
4. Practice exercises and projects
5. Assessment methods
6. Troubleshooting common challenges

Make it practical and achievable within the specified timeframe.`,
    variables: ["subject", "currentLevel", "timeCommitment", "learningStyle", "goal"],
    category_id: 6
  },
  {
    name: "Meeting Summary Template",
    description: "Professional meeting notes and action items",
    content: `Summarize the following meeting content:

Meeting: {{meetingTitle}}
Date: {{date}}
Participants: {{participants}}

Meeting notes:
{{meetingNotes}}

Please provide:
1. Executive summary (2-3 sentences)
2. Key decisions made
3. Action items with owners and deadlines
4. Open questions and next steps
5. Follow-up meeting requirements

Format for easy sharing with stakeholders.`,
    variables: ["meetingTitle", "date", "participants", "meetingNotes"],
    category_id: 5
  }
];
const samplePrompts = [
  // Creative Writing Prompts
  {
    title: "Character Development Helper",
    content: `Help me create a compelling character for my story. Ask me questions about their background, motivations, fears, and goals. Then provide a detailed character profile including:

- Physical description
- Personality traits and quirks
- Backstory and formative experiences
- Internal conflicts and growth arc
- Relationships with other characters
- Dialogue style and speech patterns

Make the character feel authentic and three-dimensional.`,
    description: "Interactive character creation for fiction writing",
    category_id: 2,
    tags: ["writing", "characters", "fiction", "creativity"],
    is_favorite: true
  },
  {
    title: "Story Twist Generator",
    content: `I'm writing a {{genre}} story and need help creating an unexpected plot twist. Here's my current plot:

{{plotSummary}}

The twist should:
- Be surprising but logical in hindsight
- Connect to earlier story elements
- Raise the stakes for the protagonist
- Feel organic to the story world

Please suggest 3 different twist options with brief explanations of how to foreshadow them earlier in the story.`,
    description: "Generate surprising plot twists for stories",
    category_id: 2,
    template_id: null,
    tags: ["writing", "plot", "storytelling", "creativity", "fiction"],
    is_favorite: false
  },
  // Code Generation Prompts
  {
    title: "API Endpoint Creator",
    content: `Create a RESTful API endpoint for {{resource}} with the following requirements:

Framework: {{framework}}
Database: {{database}}
Authentication: {{authType}}

Include:
- Route definitions with proper HTTP methods
- Request/response schemas
- Input validation
- Error handling
- Database queries
- Authentication middleware
- Unit tests
- API documentation

Follow best practices for security, performance, and maintainability.`,
    description: "Generate complete API endpoints with tests and documentation",
    category_id: 3,
    tags: ["api", "backend", "rest", "database", "authentication"],
    is_favorite: true
  },
  {
    title: "Algorithm Optimization",
    content: `Analyze and optimize this algorithm for better performance:

\`\`\`python
{{algorithm}}
\`\`\`

Current time complexity: {{currentComplexity}}
Target improvement: {{targetImprovement}}

Please provide:
1. Complexity analysis of the current implementation
2. Bottlenecks and performance issues identified
3. Optimized version with explanations
4. New time/space complexity analysis
5. Benchmarking suggestions
6. Alternative approaches if applicable

Include code examples and explain the optimization techniques used.`,
    description: "Analyze and improve algorithm performance",
    category_id: 3,
    tags: ["algorithms", "optimization", "performance", "python", "complexity"],
    is_favorite: false
  },
  // Analysis Prompts
  {
    title: "Market Research Analyzer",
    content: `Conduct a comprehensive market analysis for {{industry}} focusing on {{targetMarket}}.

Research areas:
- Market size and growth trends
- Key competitors and their positioning
- Customer segments and personas
- Pricing strategies and models
- Emerging opportunities and threats
- Technology disruptions
- Regulatory considerations

Provide actionable insights and strategic recommendations for entering or expanding in this market.`,
    description: "Comprehensive market research and competitive analysis",
    category_id: 4,
    tags: ["market-research", "analysis", "business", "strategy", "competitors"],
    is_favorite: true
  },
  {
    title: "Data Visualization Consultant",
    content: `I have a dataset with the following characteristics:
- Data type: {{dataType}}
- Size: {{dataSize}}
- Key variables: {{variables}}
- Business question: {{businessQuestion}}

Recommend the best visualization types and create:
1. Appropriate chart types for each variable
2. Dashboard layout suggestions
3. Color schemes and styling guidelines
4. Interactive features to include
5. Key insights to highlight
6. Tools/libraries recommendations

Focus on clarity, accuracy, and business impact.`,
    description: "Expert advice on data visualization and dashboard design",
    category_id: 4,
    tags: ["data-viz", "charts", "dashboard", "analytics", "insights"],
    is_favorite: false
  },
  // Business Prompts
  {
    title: "Email Campaign Writer",
    content: `Create a professional email campaign for {{campaignType}}:

Target audience: {{audience}}
Goal: {{goal}}
Tone: {{tone}}
Industry: {{industry}}

Include:
- Compelling subject line (5 variations)
- Email body with clear structure
- Strong call-to-action
- Follow-up sequence (3 emails)
- A/B testing suggestions
- Performance metrics to track

Ensure compliance with email marketing best practices and regulations.`,
    description: "Professional email marketing campaign creation",
    category_id: 5,
    tags: ["email", "marketing", "copywriting", "campaigns", "business"],
    is_favorite: true
  },
  {
    title: "Business Plan Reviewer",
    content: `Review my business plan and provide detailed feedback:

{{businessPlan}}

Evaluate:
- Executive summary clarity and impact
- Market analysis depth and accuracy
- Financial projections realism
- Marketing strategy effectiveness
- Operations plan feasibility
- Risk assessment completeness
- Funding requirements justification

Provide specific improvement suggestions and highlight strengths and weaknesses.`,
    description: "Comprehensive business plan analysis and feedback",
    category_id: 5,
    tags: ["business-plan", "strategy", "analysis", "feedback", "entrepreneurship"],
    is_favorite: false
  },
  // Education Prompts
  {
    title: "Lesson Plan Creator",
    content: `Create an engaging lesson plan for {{subject}} targeting {{gradeLevel}} students.

Topic: {{topic}}
Duration: {{duration}}
Learning objectives: {{objectives}}

Include:
- Learning objectives (specific, measurable)
- Materials and resources needed
- Step-by-step activity breakdown
- Assessment methods
- Differentiation strategies
- Extension activities for advanced learners
- Homework assignments
- Reflection questions

Make it interactive and aligned with educational standards.`,
    description: "Comprehensive lesson plan with activities and assessments",
    category_id: 6,
    tags: ["education", "lesson-plan", "teaching", "learning", "curriculum"],
    is_favorite: true
  },
  {
    title: "Study Guide Generator",
    content: `Create a comprehensive study guide for {{subject}} focusing on {{topics}}.

Format for {{learningStyle}} learners.
Exam date: {{examDate}}
Available study time: {{studyTime}}

Include:
- Key concepts and definitions
- Summary of main topics
- Practice questions with answers
- Memory aids and mnemonics
- Study schedule breakdown
- Review checklists
- Common mistakes to avoid
- Additional resources

Make it practical and exam-focused.`,
    description: "Personalized study guides for exam preparation",
    category_id: 6,
    tags: ["study-guide", "exam-prep", "learning", "education", "memory"],
    is_favorite: false
  },
  // Personal Development Prompts
  {
    title: "Goal Setting Coach",
    content: `Help me set and plan actionable goals for {{timeframe}}.

Current situation: {{currentSituation}}
Desired outcomes: {{desiredOutcomes}}
Constraints: {{constraints}}

Provide:
- SMART goal formulation
- Milestone breakdown
- Action plan with deadlines
- Potential obstacles and solutions
- Success metrics and tracking methods
- Accountability strategies
- Motivation techniques
- Weekly review framework

Make it realistic and achievable.`,
    description: "Personal goal setting and achievement planning",
    category_id: 7,
    tags: ["goals", "planning", "productivity", "personal-development", "motivation"],
    is_favorite: true
  },
  {
    title: "Habit Formation Guide",
    content: `Help me build a lasting habit around {{habitDescription}}.

Current routine: {{currentRoutine}}
Available time: {{availableTime}}
Motivation level: {{motivationLevel}}
Past challenges: {{pastChallenges}}

Create a plan including:
- Habit stacking opportunities
- Environmental design suggestions
- Reward system setup
- Progress tracking methods
- Overcoming common obstacles
- Weekly habit review process
- Long-term maintenance strategies

Use proven behavioral science principles.`,
    description: "Science-based habit formation and maintenance strategies",
    category_id: 7,
    tags: ["habits", "behavior", "personal-development", "routine", "psychology"],
    is_favorite: false
  },
  // General Purpose Prompts
  {
    title: "Decision Making Framework",
    content: `Help me make a well-informed decision about {{decision}}.

Context: {{context}}
Options: {{options}}
Constraints: {{constraints}}
Timeline: {{timeline}}

Apply a structured decision-making process:
1. Clarify objectives and criteria
2. Evaluate pros and cons of each option
3. Risk assessment for each choice
4. Stakeholder impact analysis
5. Cost-benefit analysis
6. Implementation considerations
7. Contingency planning
8. Final recommendation with reasoning

Provide an objective, analytical perspective.`,
    description: "Structured approach to important decision making",
    category_id: 1,
    tags: ["decision-making", "analysis", "strategy", "planning", "framework"],
    is_favorite: true
  },
  {
    title: "Problem Solving Assistant",
    content: `I'm facing this problem: {{problemDescription}}

Context and background: {{context}}
What I've tried so far: {{attemptedSolutions}}
Constraints: {{constraints}}

Help me solve it using:
1. Problem definition and root cause analysis
2. Creative brainstorming techniques
3. Solution evaluation criteria
4. Step-by-step implementation plan
5. Risk mitigation strategies
6. Success measurement methods
7. Alternative approaches if first solution fails

Think systematically and creatively.`,
    description: "Systematic problem-solving using proven methodologies",
    category_id: 1,
    tags: ["problem-solving", "analysis", "creativity", "planning", "methodology"],
    is_favorite: false
  }
];
let database = null;
const getDatabasePath = () => {
  const userDataPath = electron.app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  const dbPath = path.join(userDataPath, "prompt-studio.db");
  return dbPath;
};
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (database) {
      return resolve(database);
    }
    const dbPath = getDatabasePath();
    database = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err);
        return reject(err);
      }
      database.run("PRAGMA journal_mode=WAL;", (pragmaErr) => {
        if (pragmaErr) {
          console.warn("Could not enable WAL mode:", pragmaErr);
        }
        database.run("PRAGMA foreign_keys=ON;", (fkErr) => {
          if (fkErr) {
            console.warn("Could not enable foreign keys:", fkErr);
          }
          database.run("PRAGMA synchronous=FULL;", (syncErr) => {
            if (syncErr) {
              console.warn("Could not set synchronous mode:", syncErr);
            }
            createTables().then(() => resolve(database)).catch(reject);
          });
        });
      });
    });
  });
};
const createTables = () => {
  return new Promise((resolve, reject) => {
    if (!database)
      return reject(new Error("Database not initialized"));
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
        if (completed === total) {
          insertDefaultData().then(resolve).catch(reject);
        }
      });
    });
  });
};
const insertDefaultData = () => {
  return new Promise((resolve, reject) => {
    if (!database)
      return reject(new Error("Database not initialized"));
    database.get("SELECT value FROM settings WHERE key = ?", ["first_time_setup_complete"], (err, row) => {
      if (err) {
        console.error("Error checking first time setup:", err);
        return reject(err);
      }
      if (row && row.value === "true") {
        database.get("SELECT COUNT(*) as count FROM categories", (countErr, countRow) => {
          if (countErr) {
            console.error("Error checking existing categories:", countErr);
            return reject(countErr);
          }
          if (countRow.count > 0) {
            return resolve();
          }
          insertBasicCategories().then(resolve).catch(reject);
        });
        return;
      }
      console.log("First time setup detected - inserting sample data...");
      insertSampleData().then(() => {
        database.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          ["first_time_setup_complete", "true"],
          (settingErr) => {
            if (settingErr) {
              console.error("Error marking first time setup complete:", settingErr);
              return reject(settingErr);
            }
            console.log("Sample data loaded successfully - first time setup complete");
            resolve();
          }
        );
      }).catch(reject);
    });
  });
};
const insertBasicCategories = () => {
  return new Promise((resolve, reject) => {
    if (!database)
      return reject(new Error("Database not initialized"));
    const basicCategories = [
      { name: "General", description: "General purpose prompts", color: "#007acc" },
      { name: "Creative Writing", description: "Prompts for creative writing tasks", color: "#ff6b6b" },
      { name: "Code Generation", description: "Programming and code-related prompts", color: "#4ecdc4" },
      { name: "Analysis", description: "Data analysis and research prompts", color: "#45b7d1" },
      { name: "Business", description: "Business and professional prompts", color: "#96ceb4" }
    ];
    database.run("BEGIN TRANSACTION", (beginErr) => {
      if (beginErr) {
        console.error("Error starting transaction:", beginErr);
        return reject(beginErr);
      }
      let completed = 0;
      const total = basicCategories.length;
      basicCategories.forEach((category) => {
        database.run(
          "INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)",
          [category.name, category.description, category.color],
          function(err) {
            if (err) {
              console.error("Error inserting basic category:", err);
              database.run("ROLLBACK");
              return reject(err);
            }
            completed++;
            if (completed === total) {
              database.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  console.error("Error committing basic categories:", commitErr);
                  return reject(commitErr);
                }
                resolve();
              });
            }
          }
        );
      });
    });
  });
};
const insertSampleData = () => {
  return new Promise((resolve, reject) => {
    if (!database)
      return reject(new Error("Database not initialized"));
    database.run("BEGIN TRANSACTION", (beginErr) => {
      if (beginErr) {
        console.error("Error starting sample data transaction:", beginErr);
        return reject(beginErr);
      }
      let totalOperations = 0;
      let completedOperations = 0;
      const categoriesToInsert = [...sampleCategories];
      totalOperations += categoriesToInsert.length;
      const checkComplete = () => {
        completedOperations++;
        if (completedOperations === totalOperations) {
          database.run("COMMIT", (commitErr) => {
            if (commitErr) {
              console.error("Error committing sample data:", commitErr);
              database.run("ROLLBACK");
              return reject(commitErr);
            }
            resolve();
          });
        }
      };
      const categoryIdMap = /* @__PURE__ */ new Map();
      categoriesToInsert.forEach((category, index) => {
        database.run(
          "INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)",
          [category.name, category.description, category.color],
          function(insertErr) {
            if (insertErr) {
              console.error("Error inserting sample category:", insertErr);
              database.run("ROLLBACK");
              return reject(insertErr);
            }
            database.get(
              "SELECT id FROM categories WHERE name = ?",
              [category.name],
              function(selectErr, row) {
                if (selectErr) {
                  console.error("Error getting category ID:", selectErr);
                  database.run("ROLLBACK");
                  return reject(selectErr);
                }
                const categoryId = row.id;
                categoryIdMap.set(category.name, categoryId);
                const categoryTemplates = sampleTemplates.filter((t) => t.category_id === index + 1);
                totalOperations += categoryTemplates.length;
                categoryTemplates.forEach((template) => {
                  database.run(
                    "INSERT OR IGNORE INTO templates (name, description, content, variables, category_id) VALUES (?, ?, ?, ?, ?)",
                    [template.name, template.description, template.content, JSON.stringify(template.variables), categoryId],
                    (templateErr) => {
                      if (templateErr) {
                        console.error("Error inserting sample template:", templateErr);
                        database.run("ROLLBACK");
                        return reject(templateErr);
                      }
                      checkComplete();
                    }
                  );
                });
                const categoryPrompts = samplePrompts.filter((p) => p.category_id === index + 1);
                totalOperations += categoryPrompts.length;
                categoryPrompts.forEach((prompt) => {
                  database.run(
                    "INSERT OR IGNORE INTO prompts (title, content, description, category_id, template_id, tags, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
                        console.error("Error inserting sample prompt:", promptErr);
                        database.run("ROLLBACK");
                        return reject(promptErr);
                      }
                      if (this.lastID > 0) {
                        database.run(
                          "INSERT INTO prompt_versions (prompt_id, content, version_number) VALUES (?, ?, ?)",
                          [this.lastID, prompt.content, 1],
                          (versionErr) => {
                            if (versionErr) {
                              console.error("Error inserting prompt version:", versionErr);
                            }
                            checkComplete();
                          }
                        );
                      } else {
                        checkComplete();
                      }
                    }
                  );
                });
                checkComplete();
              }
            );
          }
        );
      });
    });
  });
};
const factoryReset = () => {
  return new Promise((resolve, reject) => {
    if (!database)
      return reject(new Error("Database not initialized"));
    console.log("Performing factory reset...");
    database.run("BEGIN TRANSACTION", (beginErr) => {
      if (beginErr) {
        console.error("Error starting factory reset transaction:", beginErr);
        return reject(beginErr);
      }
      const deleteQueries = [
        "DELETE FROM test_results",
        "DELETE FROM prompt_versions",
        "DELETE FROM prompts",
        "DELETE FROM templates",
        "DELETE FROM categories",
        'DELETE FROM settings WHERE key != "first_time_setup_complete"'
        // Keep the first time setup flag
      ];
      let completed = 0;
      const total = deleteQueries.length;
      deleteQueries.forEach((query) => {
        database.run(query, (err) => {
          if (err) {
            console.error("Error during factory reset:", err);
            database.run("ROLLBACK");
            return reject(err);
          }
          completed++;
          if (completed === total) {
            database.run(
              "UPDATE settings SET value = ? WHERE key = ?",
              ["false", "first_time_setup_complete"],
              (updateErr) => {
                if (updateErr) {
                  console.error("Error resetting first time setup flag:", updateErr);
                  database.run("ROLLBACK");
                  return reject(updateErr);
                }
                database.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    console.error("Error committing factory reset:", commitErr);
                    return reject(commitErr);
                  }
                  console.log("Factory reset completed successfully");
                  resolve();
                });
              }
            );
          }
        });
      });
    });
  });
};
const closeDatabase = () => {
  return new Promise((resolve) => {
    if (database) {
      database.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
        } else {
          console.log("Database connection closed");
        }
        database = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};
const init = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  closeDatabase,
  factoryReset,
  getDatabasePath,
  initDatabase
}, Symbol.toStringTag, { value: "Module" }));
const runQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
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
  const prompts = rows.map((row) => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_favorite: Boolean(row.is_favorite)
  }));
  return prompts;
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
      tags: row.tags ? JSON.parse(row.tags) : [],
      is_favorite: Boolean(row.is_favorite)
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
  await createPromptVersion(db, result.id, content);
  const created = await getPrompt(db, result.id);
  if (!created)
    throw new Error("Failed to create prompt");
  return created;
};
const updatePrompt = async (db, id, prompt) => {
  const { title, content, description, category_id, template_id, tags, is_favorite } = prompt;
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
  if (currentPrompt && content && currentPrompt.content !== content) {
    const versions = await getPromptVersions(db, id);
    await createPromptVersion(db, id, content, versions.length + 1);
  }
  const updated = await getPrompt(db, id);
  if (!updated)
    throw new Error("Failed to update prompt");
  return updated;
};
const deletePrompt = async (db, id) => {
  const sql = "DELETE FROM prompts WHERE id = ?";
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
  return rows.map((row) => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_favorite: Boolean(row.is_favorite)
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
  return rows.map((row) => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_favorite: Boolean(row.is_favorite)
  }));
};
const getAllTags = async (db) => {
  const sql = 'SELECT DISTINCT tags FROM prompts WHERE tags IS NOT NULL AND tags != "[]"';
  const rows = await allQuery(db, sql);
  const allTags = /* @__PURE__ */ new Set();
  rows.forEach((row) => {
    try {
      const tags = JSON.parse(row.tags);
      tags.forEach((tag) => allTags.add(tag));
    } catch (e) {
    }
  });
  return Array.from(allTags).sort();
};
const getPromptVersions = async (db, promptId) => {
  const sql = `
    SELECT * FROM prompt_versions 
    WHERE prompt_id = ? 
    ORDER BY version_number DESC
  `;
  return await allQuery(db, sql, [promptId]);
};
const createPromptVersion = async (db, promptId, content, versionNumber) => {
  if (!versionNumber) {
    const versions = await getPromptVersions(db, promptId);
    versionNumber = versions.length + 1;
  }
  const sql = `
    INSERT INTO prompt_versions (prompt_id, content, version_number)
    VALUES (?, ?, ?)
  `;
  const result = await runQuery(db, sql, [promptId, content, versionNumber]);
  return {
    id: result.id,
    prompt_id: promptId,
    content,
    version_number: versionNumber,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
};
const getAllCategories = async (db) => {
  const sql = "SELECT * FROM categories ORDER BY name";
  return await allQuery(db, sql);
};
const createCategory = async (db, category) => {
  const { name, description, color } = category;
  const sql = "INSERT INTO categories (name, description, color) VALUES (?, ?, ?)";
  const result = await runQuery(db, sql, [name, description || null, color || "#007acc"]);
  const created = await getQuery(db, "SELECT * FROM categories WHERE id = ?", [result.id]);
  if (!created)
    throw new Error("Failed to create category");
  return created;
};
const updateCategory = async (db, id, category) => {
  const { name, description, color } = category;
  const sql = `
    UPDATE categories 
    SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runQuery(db, sql, [name, description || null, color || "#007acc", id]);
  const updated = await getQuery(db, "SELECT * FROM categories WHERE id = ?", [id]);
  if (!updated)
    throw new Error("Failed to update category");
  return updated;
};
const deleteCategory = async (db, id) => {
  await runQuery(db, "UPDATE prompts SET category_id = NULL WHERE category_id = ?", [id]);
  await runQuery(db, "DELETE FROM categories WHERE id = ?", [id]);
  return { success: true };
};
const getAllTemplates = async (db) => {
  const sql = `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.name
  `;
  const rows = await allQuery(db, sql);
  return rows.map((row) => ({
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
  const created = await getQuery(db, `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `, [result.id]);
  if (!created)
    throw new Error("Failed to create template");
  return {
    ...created,
    variables: created.variables ? JSON.parse(created.variables) : []
  };
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
  const updated = await getQuery(db, `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `, [id]);
  if (!updated)
    throw new Error("Failed to update template");
  return {
    ...updated,
    variables: updated.variables ? JSON.parse(updated.variables) : []
  };
};
const deleteTemplate = async (db, id) => {
  await runQuery(db, "UPDATE prompts SET template_id = NULL WHERE template_id = ?", [id]);
  await runQuery(db, "DELETE FROM templates WHERE id = ?", [id]);
  return { success: true };
};
const generateFromTemplate = async (db, templateId, variables) => {
  const template = await getQuery(db, "SELECT * FROM templates WHERE id = ?", [templateId]);
  if (!template) {
    throw new Error("Template not found");
  }
  let content = template.content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, value);
  });
  return {
    title: `Generated from ${template.name}`,
    content,
    template_id: templateId,
    category_id: template.category_id
  };
};
const getSetting = async (db, key) => {
  const row = await getQuery(db, "SELECT value FROM settings WHERE key = ?", [key]);
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
const exportPrompts = async (db, filePath, format = "json") => {
  const prompts = await getAllPrompts(db);
  if (format === "json") {
    const data = {
      prompts,
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } else {
    let content = "Prompt Studio Export\n";
    content += "==================\n\n";
    prompts.forEach((prompt, index) => {
      content += `${index + 1}. ${prompt.title}
`;
      content += `Category: ${prompt.category_name || "None"}
`;
      content += `Tags: ${prompt.tags.join(", ")}
`;
      content += `Created: ${prompt.created_at}

`;
      content += `${prompt.content}

`;
      if (prompt.description) {
        content += `Description: ${prompt.description}
`;
      }
      content += "---\n\n";
    });
    fs.writeFileSync(filePath, content);
  }
};
const importPrompts = async (db, filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".json") {
      const data = JSON.parse(content);
      const prompts = data.prompts || data;
      let imported = 0;
      for (const prompt of prompts) {
        try {
          const { id, created_at, updated_at, ...promptData } = prompt;
          await createPrompt(db, promptData);
          imported++;
        } catch (err) {
          console.error("Error importing prompt:", err);
        }
      }
      return { success: true, imported, total: prompts.length };
    } else {
      const title = path.basename(filePath, ext);
      await createPrompt(db, {
        title,
        content,
        description: `Imported from ${filePath}`,
        tags: ["imported"]
      });
      return { success: true, imported: 1, total: 1 };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
class PromptStudioApp {
  constructor() {
    this.mainWindow = null;
    this.menuBarWindow = null;
    this.tray = null;
    this.db = null;
    this.currentMode = "desktop";
    this.isDev = process.env.IS_DEV === "true";
    this.enableDevTools = process.env.ENABLE_DEV_TOOLS === "true";
    this.isQuitting = false;
    this.setupEventHandlers();
  }
  setupEventHandlers() {
    electron.app.whenReady().then(() => {
      this.initialize();
    });
    electron.app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        electron.app.quit();
      }
    });
    electron.app.on("activate", () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      } else if (this.currentMode === "desktop" && this.mainWindow) {
        this.mainWindow.show();
      }
    });
    electron.app.on("before-quit", async () => {
      this.isQuitting = true;
      if (this.db) {
        try {
          const { closeDatabase: closeDatabase2 } = await Promise.resolve().then(() => init);
          await closeDatabase2();
          console.log("Database closed on app quit");
        } catch (error) {
          console.error("Error closing database:", error);
        }
      }
    });
  }
  async initialize() {
    try {
      this.db = await initDatabase();
      const savedMode = await getSetting(this.db, "appMode");
      this.currentMode = savedMode || "desktop";
      this.setupIpcHandlers();
      await this.createMainWindow();
      await this.createMenuBarWindow();
      this.createTray();
      if (this.currentMode === "desktop" && this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    } catch (error) {
      console.error("Failed to initialize app:", error);
      electron.app.quit();
    }
  }
  async createMainWindow() {
    this.mainWindow = new electron.BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js")
      },
      icon: this.getAppIcon(),
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default"
    });
    if (this.isDev) {
      await this.mainWindow.loadURL("http://localhost:5173");
      if (this.enableDevTools) {
        this.mainWindow.webContents.openDevTools();
      }
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
    this.mainWindow.once("ready-to-show", () => {
      if (this.currentMode === "desktop" && this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });
    this.mainWindow.on("close", (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        if (this.mainWindow) {
          this.mainWindow.hide();
        }
      }
    });
    if (this.isDev) {
      this.mainWindow.webContents.on("before-input-event", (_, input) => {
        if (input.control && input.shift && input.key === "I") {
          this.mainWindow.webContents.toggleDevTools();
        }
        if ((input.meta || input.control) && input.key === "F12") {
          this.mainWindow.webContents.toggleDevTools();
        }
      });
    }
  }
  async createMenuBarWindow() {
    this.menuBarWindow = new electron.BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js")
      },
      skipTaskbar: true,
      alwaysOnTop: true
    });
    if (this.isDev) {
      await this.menuBarWindow.loadURL("http://localhost:5173/menubar");
    } else {
      await this.menuBarWindow.loadFile(path.join(__dirname, "../dist/menubar.html"));
    }
    this.menuBarWindow.on("blur", () => {
      if (this.currentMode === "menubar" && this.menuBarWindow) {
        this.menuBarWindow.hide();
      }
    });
  }
  createTray() {
    const icon = this.createTrayIcon();
    this.tray = new electron.Tray(icon);
    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: "Show Prompt Studio",
        click: async () => await this.showApp()
      },
      { type: "separator" },
      {
        label: "Desktop Mode",
        type: "radio",
        checked: this.currentMode === "desktop",
        click: () => this.switchMode("desktop")
      },
      {
        label: "Menu Bar Mode",
        type: "radio",
        checked: this.currentMode === "menubar",
        click: () => this.switchMode("menubar")
      },
      { type: "separator" },
      {
        label: "Preferences",
        click: () => this.openPreferences()
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          this.isQuitting = true;
          electron.app.quit();
        }
      }
    ]);
    this.tray.setToolTip("Prompt Studio");
    this.tray.setContextMenu(contextMenu);
    this.tray.on("click", async () => {
      if (process.platform !== "darwin") {
        await this.toggleApp();
      }
    });
    if (process.platform === "darwin") {
      this.tray.on("right-click", async () => {
        if (this.currentMode === "menubar") {
          await this.toggleMenuBarWindow();
        }
      });
    }
  }
  createTrayIcon() {
    const trayIconPath = path.join(__dirname, "../assets/tray-icon.png");
    if (fs.existsSync(trayIconPath)) {
      const icon2 = electron.nativeImage.createFromPath(trayIconPath);
      icon2.setTemplateImage(true);
      return icon2.resize({ width: 16, height: 16 });
    }
    const iconPath = path.join(__dirname, "../assets/icon.png");
    if (fs.existsSync(iconPath)) {
      const icon2 = electron.nativeImage.createFromPath(iconPath);
      icon2.setTemplateImage(true);
      return icon2.resize({ width: 16, height: 16 });
    }
    const icon = electron.nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAI4SURBVDjLpZPLSyNBEMafJBpfGI0vfIKKD1YR30HFhQVZWFjwgSiIBy+CBx8H8eJBL4IX8eJBD4IXD3oRvHjQi+DFgx4ELx70InjxoAfBiwc9CF48eJEkZjKZt91O05lJJsaD/UF3VVd9X1V3dwvAuHEEeEnNK24HAEhpWjTqsEgUEUlHYgAAAAAAAAD4/nONAAAOFyLSdF3l0AvI7Gii0XDbfU7k9+g7mRn1AHhhNBCJRm+yYdoECUCcvAHxvuwT2g5bMJHsJR0UiSLSSRFJwC"
    );
    icon.setTemplateImage(true);
    return icon;
  }
  getAppIcon() {
    const iconPath = path.join(__dirname, "../assets/icon.png");
    return fs.existsSync(iconPath) ? iconPath : "";
  }
  async showApp() {
    if (this.currentMode === "desktop" && this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    } else if (this.currentMode === "menubar") {
      await this.toggleMenuBarWindow();
    }
  }
  async toggleApp() {
    if (this.currentMode === "desktop" && this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    } else {
      await this.toggleMenuBarWindow();
    }
  }
  async toggleMenuBarWindow() {
    if (!this.menuBarWindow || !this.tray)
      return;
    if (this.menuBarWindow.isVisible()) {
      this.menuBarWindow.hide();
    } else {
      if (this.isDev) {
        await this.menuBarWindow.loadURL("http://localhost:5173/menubar");
      } else {
        await this.menuBarWindow.loadFile(path.join(__dirname, "../dist/menubar.html"));
      }
      const bounds = this.tray.getBounds();
      const x = Math.round(bounds.x + bounds.width / 2 - 200);
      const y = Math.round(bounds.y + bounds.height);
      this.menuBarWindow.setPosition(x, y, false);
      this.menuBarWindow.show();
      this.menuBarWindow.focus();
    }
  }
  async switchMode(mode) {
    this.currentMode = mode;
    if (this.db) {
      await setSetting(this.db, "appMode", mode);
    }
    if (mode === "desktop") {
      if (this.menuBarWindow)
        this.menuBarWindow.hide();
      if (this.mainWindow) {
        if (this.isDev) {
          await this.mainWindow.loadURL("http://localhost:5173");
        } else {
          await this.mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
        }
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    } else {
      if (this.mainWindow)
        this.mainWindow.hide();
      if (this.menuBarWindow)
        this.menuBarWindow.hide();
    }
    this.updateTrayMenu();
  }
  updateTrayMenu() {
    if (!this.tray)
      return;
    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: "Show Prompt Studio",
        click: async () => await this.showApp()
      },
      { type: "separator" },
      {
        label: "Desktop Mode",
        type: "radio",
        checked: this.currentMode === "desktop",
        click: () => this.switchMode("desktop")
      },
      {
        label: "Menu Bar Mode",
        type: "radio",
        checked: this.currentMode === "menubar",
        click: () => this.switchMode("menubar")
      },
      { type: "separator" },
      {
        label: "Preferences",
        click: () => this.openPreferences()
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          this.isQuitting = true;
          electron.app.quit();
        }
      }
    ]);
    this.tray.setContextMenu(contextMenu);
  }
  openPreferences() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      this.mainWindow.webContents.send("open-preferences");
    }
  }
  setupIpcHandlers() {
    electron.ipcMain.handle("copy-to-clipboard", async (_event, text) => {
      const { clipboard } = require("electron");
      clipboard.writeText(text);
      return { success: true };
    });
    electron.ipcMain.handle("switch-mode", async (_event, mode) => {
      await this.switchMode(mode);
    });
    electron.ipcMain.handle("get-current-mode", () => {
      return this.currentMode;
    });
    electron.ipcMain.handle("factory-reset", async () => {
      try {
        await factoryReset();
        this.db = await initDatabase();
        return { success: true };
      } catch (error) {
        console.error("Factory reset failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    });
    if (!this.db)
      return;
    electron.ipcMain.handle("get-all-prompts", async () => {
      return await getAllPrompts(this.db);
    });
    electron.ipcMain.handle("get-prompt", async (_event, id) => {
      return await getPrompt(this.db, id);
    });
    electron.ipcMain.handle("create-prompt", async (_event, data) => {
      return await createPrompt(this.db, data);
    });
    electron.ipcMain.handle("update-prompt", async (_event, id, data) => {
      return await updatePrompt(this.db, id, data);
    });
    electron.ipcMain.handle("delete-prompt", async (_event, id) => {
      return await deletePrompt(this.db, id);
    });
    electron.ipcMain.handle("search-prompts", async (_event, query) => {
      return await searchPrompts(this.db, query);
    });
    electron.ipcMain.handle("get-prompts-by-tag", async (_event, tag) => {
      return await getPromptsByTag(this.db, tag);
    });
    electron.ipcMain.handle("get-all-categories", async () => {
      return await getAllCategories(this.db);
    });
    electron.ipcMain.handle("create-category", async (_event, data) => {
      return await createCategory(this.db, data);
    });
    electron.ipcMain.handle("update-category", async (_event, id, data) => {
      return await updateCategory(this.db, id, data);
    });
    electron.ipcMain.handle("delete-category", async (_event, id) => {
      return await deleteCategory(this.db, id);
    });
    electron.ipcMain.handle("get-all-templates", async () => {
      return await getAllTemplates(this.db);
    });
    electron.ipcMain.handle("create-template", async (_event, data) => {
      return await createTemplate(this.db, data);
    });
    electron.ipcMain.handle("update-template", async (_event, id, data) => {
      return await updateTemplate(this.db, id, data);
    });
    electron.ipcMain.handle("delete-template", async (_event, id) => {
      return await deleteTemplate(this.db, id);
    });
    electron.ipcMain.handle("generate-from-template", async (_event, templateId, variables) => {
      return await generateFromTemplate(this.db, templateId, variables);
    });
    electron.ipcMain.handle("get-all-tags", async () => {
      return await getAllTags(this.db);
    });
    electron.ipcMain.handle("get-prompt-versions", async (_event, promptId) => {
      return await getPromptVersions(this.db, promptId);
    });
    electron.ipcMain.handle("create-prompt-version", async (_event, promptId, content) => {
      return await createPromptVersion(this.db, promptId, content);
    });
    electron.ipcMain.handle("get-setting", async (_event, key) => {
      return await getSetting(this.db, key);
    });
    electron.ipcMain.handle("set-setting", async (_event, key, value) => {
      return await setSetting(this.db, key, value);
    });
    electron.ipcMain.handle("export-prompts", async (_event, format) => {
      const { filePath } = await electron.dialog.showSaveDialog({
        filters: format === "json" ? [{ name: "JSON Files", extensions: ["json"] }] : [{ name: "Text Files", extensions: ["txt"] }]
      });
      if (filePath) {
        await exportPrompts(this.db, filePath, format);
        return { success: true, path: filePath };
      }
      return { success: false };
    });
    electron.ipcMain.handle("import-prompts", async () => {
      const { filePaths } = await electron.dialog.showOpenDialog({
        filters: [
          { name: "Supported Files", extensions: ["json", "txt"] },
          { name: "JSON Files", extensions: ["json"] },
          { name: "Text Files", extensions: ["txt"] }
        ],
        properties: ["openFile"]
      });
      if (filePaths && filePaths.length > 0) {
        return await importPrompts(this.db, filePaths[0]);
      }
      return { success: false };
    });
    electron.ipcMain.handle("test-prompt", async (_event, request) => {
      var _a;
      try {
        const { prompt, config } = request;
        const endpoint = config.apiEndpoint || "https://api.openai.com/v1/chat/completions";
        const startTime = Date.now();
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: "user", content: prompt }],
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens
          })
        });
        const responseTime = Date.now() - startTime;
        const data = await response.json();
        if (!response.ok) {
          throw new Error(((_a = data.error) == null ? void 0 : _a.message) || "API request failed");
        }
        return {
          success: true,
          response: data.choices[0].message.content,
          usage: data.usage,
          responseTime
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    });
  }
}
new PromptStudioApp();
//# sourceMappingURL=main.js.map
