"use strict";const o=require("electron"),E=require("path"),f=require("fs"),F=require("sqlite3"),W=[{name:"General",description:"General purpose prompts for various tasks",color:"#6366f1"},{name:"Creative Writing",description:"Prompts for creative writing, storytelling, and content creation",color:"#ec4899"},{name:"Code Generation",description:"Programming, debugging, and code-related prompts",color:"#10b981"},{name:"Analysis",description:"Data analysis, research, and analytical thinking prompts",color:"#f59e0b"},{name:"Business",description:"Business strategy, marketing, and professional communication",color:"#8b5cf6"},{name:"Education",description:"Learning, teaching, and educational content prompts",color:"#06b6d4"},{name:"Personal",description:"Personal development, productivity, and lifestyle prompts",color:"#ef4444"}],B=[{name:"Code Review Template",description:"Comprehensive code review with focus areas",content:`Please review the following {{language}} code and provide feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
- Code quality and readability
- Performance optimizations
- Security considerations
- Best practices for {{language}}
- Potential bugs or issues

Please provide specific suggestions for improvement.`,variables:["language","code"],category_id:3},{name:"Blog Post Outline",description:"Structure for creating engaging blog posts",content:`Create a detailed blog post outline for: "{{title}}"

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

Make it engaging and actionable for the {{audience}} audience.`,variables:["title","audience","tone","wordCount"],category_id:2},{name:"Data Analysis Framework",description:"Structured approach for data analysis tasks",content:`Analyze the following {{dataType}} data:

{{dataDescription}}

Please provide:
1. Data overview and quality assessment
2. Key patterns and trends identified
3. Statistical insights and correlations
4. {{analysisType}} analysis
5. Actionable recommendations
6. Potential limitations and caveats

Present findings in a clear, business-friendly format with supporting visualizations suggestions.`,variables:["dataType","dataDescription","analysisType"],category_id:4},{name:"Learning Plan Creator",description:"Personalized learning roadmap template",content:`Create a comprehensive learning plan for: {{subject}}

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

Make it practical and achievable within the specified timeframe.`,variables:["subject","currentLevel","timeCommitment","learningStyle","goal"],category_id:6},{name:"Meeting Summary Template",description:"Professional meeting notes and action items",content:`Summarize the following meeting content:

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

Format for easy sharing with stakeholders.`,variables:["meetingTitle","date","participants","meetingNotes"],category_id:5}],U=[{title:"Character Development Helper",content:`Help me create a compelling character for my story. Ask me questions about their background, motivations, fears, and goals. Then provide a detailed character profile including:

- Physical description
- Personality traits and quirks
- Backstory and formative experiences
- Internal conflicts and growth arc
- Relationships with other characters
- Dialogue style and speech patterns

Make the character feel authentic and three-dimensional.`,description:"Interactive character creation for fiction writing",category_id:2,tags:["writing","characters","fiction","creativity"],is_favorite:!0},{title:"Story Twist Generator",content:`I'm writing a {{genre}} story and need help creating an unexpected plot twist. Here's my current plot:

{{plotSummary}}

The twist should:
- Be surprising but logical in hindsight
- Connect to earlier story elements
- Raise the stakes for the protagonist
- Feel organic to the story world

Please suggest 3 different twist options with brief explanations of how to foreshadow them earlier in the story.`,description:"Generate surprising plot twists for stories",category_id:2,template_id:null,tags:["writing","plot","storytelling","creativity","fiction"],is_favorite:!1},{title:"API Endpoint Creator",content:`Create a RESTful API endpoint for {{resource}} with the following requirements:

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

Follow best practices for security, performance, and maintainability.`,description:"Generate complete API endpoints with tests and documentation",category_id:3,tags:["api","backend","rest","database","authentication"],is_favorite:!0},{title:"Algorithm Optimization",content:`Analyze and optimize this algorithm for better performance:

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

Include code examples and explain the optimization techniques used.`,description:"Analyze and improve algorithm performance",category_id:3,tags:["algorithms","optimization","performance","python","complexity"],is_favorite:!1},{title:"Market Research Analyzer",content:`Conduct a comprehensive market analysis for {{industry}} focusing on {{targetMarket}}.

Research areas:
- Market size and growth trends
- Key competitors and their positioning
- Customer segments and personas
- Pricing strategies and models
- Emerging opportunities and threats
- Technology disruptions
- Regulatory considerations

Provide actionable insights and strategic recommendations for entering or expanding in this market.`,description:"Comprehensive market research and competitive analysis",category_id:4,tags:["market-research","analysis","business","strategy","competitors"],is_favorite:!0},{title:"Data Visualization Consultant",content:`I have a dataset with the following characteristics:
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

Focus on clarity, accuracy, and business impact.`,description:"Expert advice on data visualization and dashboard design",category_id:4,tags:["data-viz","charts","dashboard","analytics","insights"],is_favorite:!1},{title:"Email Campaign Writer",content:`Create a professional email campaign for {{campaignType}}:

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

Ensure compliance with email marketing best practices and regulations.`,description:"Professional email marketing campaign creation",category_id:5,tags:["email","marketing","copywriting","campaigns","business"],is_favorite:!0},{title:"Business Plan Reviewer",content:`Review my business plan and provide detailed feedback:

{{businessPlan}}

Evaluate:
- Executive summary clarity and impact
- Market analysis depth and accuracy
- Financial projections realism
- Marketing strategy effectiveness
- Operations plan feasibility
- Risk assessment completeness
- Funding requirements justification

Provide specific improvement suggestions and highlight strengths and weaknesses.`,description:"Comprehensive business plan analysis and feedback",category_id:5,tags:["business-plan","strategy","analysis","feedback","entrepreneurship"],is_favorite:!1},{title:"Lesson Plan Creator",content:`Create an engaging lesson plan for {{subject}} targeting {{gradeLevel}} students.

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

Make it interactive and aligned with educational standards.`,description:"Comprehensive lesson plan with activities and assessments",category_id:6,tags:["education","lesson-plan","teaching","learning","curriculum"],is_favorite:!0},{title:"Study Guide Generator",content:`Create a comprehensive study guide for {{subject}} focusing on {{topics}}.

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

Make it practical and exam-focused.`,description:"Personalized study guides for exam preparation",category_id:6,tags:["study-guide","exam-prep","learning","education","memory"],is_favorite:!1},{title:"Goal Setting Coach",content:`Help me set and plan actionable goals for {{timeframe}}.

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

Make it realistic and achievable.`,description:"Personal goal setting and achievement planning",category_id:7,tags:["goals","planning","productivity","personal-development","motivation"],is_favorite:!0},{title:"Habit Formation Guide",content:`Help me build a lasting habit around {{habitDescription}}.

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

Use proven behavioral science principles.`,description:"Science-based habit formation and maintenance strategies",category_id:7,tags:["habits","behavior","personal-development","routine","psychology"],is_favorite:!1},{title:"Decision Making Framework",content:`Help me make a well-informed decision about {{decision}}.

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

Provide an objective, analytical perspective.`,description:"Structured approach to important decision making",category_id:1,tags:["decision-making","analysis","strategy","planning","framework"],is_favorite:!0},{title:"Problem Solving Assistant",content:`I'm facing this problem: {{problemDescription}}

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

Think systematically and creatively.`,description:"Systematic problem-solving using proven methodologies",category_id:1,tags:["problem-solving","analysis","creativity","planning","methodology"],is_favorite:!1}];let c=null;const D=()=>{const i=o.app.getPath("userData");return f.existsSync(i)||f.mkdirSync(i,{recursive:!0}),E.join(i,"prompt-studio.db")},M=()=>new Promise((i,e)=>{if(c)return i(c);const t=D();c=new F.Database(t,a=>{if(a)return console.error("Error opening database:",a),e(a);c.run("PRAGMA journal_mode=WAL;",n=>{n&&console.warn("Could not enable WAL mode:",n),c.run("PRAGMA foreign_keys=ON;",s=>{s&&console.warn("Could not enable foreign keys:",s),c.run("PRAGMA synchronous=FULL;",r=>{r&&console.warn("Could not set synchronous mode:",r),x().then(()=>i(c)).catch(e)})})})})}),x=()=>new Promise((i,e)=>{if(!c)return e(new Error("Database not initialized"));const t=[`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#007acc',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,`CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        variables TEXT, -- JSON array of variable names
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )`,`CREATE TABLE IF NOT EXISTS prompts (
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
      )`,`CREATE TABLE IF NOT EXISTS prompt_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prompt_id) REFERENCES prompts (id) ON DELETE CASCADE
      )`,`CREATE TABLE IF NOT EXISTS test_results (
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
      )`];let a=0;const n=t.length;if(n===0)return i();t.forEach((s,r)=>{c.run(s,l=>{if(l)return console.error(`Error creating table ${r}:`,l),e(l);a++,a===n&&q().then(i).catch(e)})})}),q=()=>new Promise((i,e)=>{if(!c)return e(new Error("Database not initialized"));c.get("SELECT value FROM settings WHERE key = ?",["first_time_setup_complete"],(t,a)=>{if(t)return console.error("Error checking first time setup:",t),e(t);if(a&&a.value==="true"){c.get("SELECT COUNT(*) as count FROM categories",(n,s)=>{if(n)return console.error("Error checking existing categories:",n),e(n);if(s.count>0)return i();H().then(i).catch(e)});return}console.log("First time setup detected - inserting sample data..."),G().then(()=>{c.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",["first_time_setup_complete","true"],n=>{if(n)return console.error("Error marking first time setup complete:",n),e(n);console.log("Sample data loaded successfully - first time setup complete"),i()})}).catch(e)})}),H=()=>new Promise((i,e)=>{if(!c)return e(new Error("Database not initialized"));const t=[{name:"General",description:"General purpose prompts",color:"#007acc"},{name:"Creative Writing",description:"Prompts for creative writing tasks",color:"#ff6b6b"},{name:"Code Generation",description:"Programming and code-related prompts",color:"#4ecdc4"},{name:"Analysis",description:"Data analysis and research prompts",color:"#45b7d1"},{name:"Business",description:"Business and professional prompts",color:"#96ceb4"}];c.run("BEGIN TRANSACTION",a=>{if(a)return console.error("Error starting transaction:",a),e(a);let n=0;const s=t.length;t.forEach(r=>{c.run("INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)",[r.name,r.description,r.color],function(l){if(l)return console.error("Error inserting basic category:",l),c.run("ROLLBACK"),e(l);n++,n===s&&c.run("COMMIT",d=>{if(d)return console.error("Error committing basic categories:",d),e(d);i()})})})})}),G=()=>new Promise((i,e)=>{if(!c)return e(new Error("Database not initialized"));c.run("BEGIN TRANSACTION",t=>{if(t)return console.error("Error starting sample data transaction:",t),e(t);let a=0,n=0;const s=[...W];a+=s.length;const r=()=>{n++,n===a&&c.run("COMMIT",d=>{if(d)return console.error("Error committing sample data:",d),c.run("ROLLBACK"),e(d);i()})},l=new Map;s.forEach((d,p)=>{c.run("INSERT OR IGNORE INTO categories (name, description, color) VALUES (?, ?, ?)",[d.name,d.description,d.color],function(g){if(g)return console.error("Error inserting sample category:",g),c.run("ROLLBACK"),e(g);c.get("SELECT id FROM categories WHERE name = ?",[d.name],function(u,y){if(u)return console.error("Error getting category ID:",u),c.run("ROLLBACK"),e(u);const _=y.id;l.set(d.name,_);const b=B.filter(m=>m.category_id===p+1);a+=b.length,b.forEach(m=>{c.run("INSERT OR IGNORE INTO templates (name, description, content, variables, category_id) VALUES (?, ?, ?, ?, ?)",[m.name,m.description,m.content,JSON.stringify(m.variables),_],w=>{if(w)return console.error("Error inserting sample template:",w),c.run("ROLLBACK"),e(w);r()})});const R=U.filter(m=>m.category_id===p+1);a+=R.length,R.forEach(m=>{c.run("INSERT OR IGNORE INTO prompts (title, content, description, category_id, template_id, tags, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?)",[m.title,m.content,m.description||null,_,m.template_id||null,JSON.stringify(m.tags||[]),m.is_favorite||!1],function(w){if(w)return console.error("Error inserting sample prompt:",w),c.run("ROLLBACK"),e(w);this.lastID>0?c.run("INSERT INTO prompt_versions (prompt_id, content, version_number) VALUES (?, ?, ?)",[this.lastID,m.content,1],O=>{O&&console.error("Error inserting prompt version:",O),r()}):r()})}),r()})})})})}),P=()=>new Promise((i,e)=>{if(!c)return e(new Error("Database not initialized"));console.log("Performing factory reset..."),c.run("BEGIN TRANSACTION",t=>{if(t)return console.error("Error starting factory reset transaction:",t),e(t);const a=["DELETE FROM test_results","DELETE FROM prompt_versions","DELETE FROM prompts","DELETE FROM templates","DELETE FROM categories",'DELETE FROM settings WHERE key != "first_time_setup_complete"'];let n=0;const s=a.length;a.forEach(r=>{c.run(r,l=>{if(l)return console.error("Error during factory reset:",l),c.run("ROLLBACK"),e(l);n++,n===s&&c.run("UPDATE settings SET value = ? WHERE key = ?",["false","first_time_setup_complete"],d=>{if(d)return console.error("Error resetting first time setup flag:",d),c.run("ROLLBACK"),e(d);c.run("COMMIT",p=>{if(p)return console.error("Error committing factory reset:",p),e(p);console.log("Factory reset completed successfully"),i()})})})})})}),J=()=>new Promise(i=>{c?c.close(e=>{e?console.error("Error closing database:",e):console.log("Database connection closed"),c=null,i()}):i()}),z=Object.freeze(Object.defineProperty({__proto__:null,closeDatabase:J,factoryReset:P,getDatabasePath:D,initDatabase:M},Symbol.toStringTag,{value:"Module"})),h=(i,e,t=[])=>new Promise((a,n)=>{i.serialize(()=>{i.run(e,t,function(s){s?n(s):a({id:this.lastID,changes:this.changes})})})}),T=(i,e,t=[])=>new Promise((a,n)=>{i.get(e,t,(s,r)=>{s?n(s):a(r)})}),v=(i,e,t=[])=>new Promise((a,n)=>{i.all(e,t,(s,r)=>{s?n(s):a(r)})}),k=async i=>(await v(i,`
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    ORDER BY p.updated_at DESC
  `)).map(n=>({...n,tags:n.tags?JSON.parse(n.tags):[],is_favorite:!!n.is_favorite})),A=async(i,e)=>{const a=await T(i,`
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.id = ?
  `,[e]);return a?{...a,tags:a.tags?JSON.parse(a.tags):[],is_favorite:!!a.is_favorite}:null},S=async(i,e)=>{const{title:t,content:a,description:n,category_id:s,template_id:r,tags:l,is_favorite:d}=e,g=await h(i,`
    INSERT INTO prompts (title, content, description, category_id, template_id, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,[t,a,n||null,s||null,r||null,JSON.stringify(l||[]),d||!1]);await N(i,g.id,a);const u=await A(i,g.id);if(!u)throw new Error("Failed to create prompt");return u},K=async(i,e,t)=>{const{title:a,content:n,description:s,category_id:r,template_id:l,tags:d,is_favorite:p}=t,g=await A(i,e);if(!g)throw new Error("Prompt not found");const u=[],y=[];if(a!==void 0&&(u.push("title = ?"),y.push(a)),n!==void 0&&(u.push("content = ?"),y.push(n)),s!==void 0&&(u.push("description = ?"),y.push(s||null)),r!==void 0&&(u.push("category_id = ?"),y.push(r||null)),l!==void 0&&(u.push("template_id = ?"),y.push(l||null)),d!==void 0&&(u.push("tags = ?"),y.push(JSON.stringify(d||[]))),p!==void 0&&(u.push("is_favorite = ?"),y.push(p)),u.length===0)return g;u.push("updated_at = CURRENT_TIMESTAMP"),y.push(e);const _=`UPDATE prompts SET ${u.join(", ")} WHERE id = ?`;if(await h(i,_,y),n!==void 0&&g.content!==n){const R=await I(i,e);await N(i,e,n,R.length+1)}const b=await A(i,e);if(!b)throw new Error("Failed to update prompt");return b},X=async(i,e)=>(await h(i,"DELETE FROM prompts WHERE id = ?",[e]),{success:!0}),j=async(i,e)=>{const t=`
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.title LIKE ? OR p.content LIKE ? OR p.description LIKE ?
    ORDER BY p.updated_at DESC
  `,a=`%${e}%`;return(await v(i,t,[a,a,a])).map(s=>({...s,tags:s.tags?JSON.parse(s.tags):[],is_favorite:!!s.is_favorite}))},Y=async(i,e)=>(await v(i,`
    SELECT p.*, c.name as category_name, c.color as category_color,
           t.name as template_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN templates t ON p.template_id = t.id
    WHERE p.tags LIKE ?
    ORDER BY p.updated_at DESC
  `,[`%"${e}"%`])).map(n=>({...n,tags:n.tags?JSON.parse(n.tags):[],is_favorite:!!n.is_favorite})),V=async i=>{const t=await v(i,'SELECT DISTINCT tags FROM prompts WHERE tags IS NOT NULL AND tags != "[]"'),a=new Set;return t.forEach(n=>{try{JSON.parse(n.tags).forEach(r=>a.add(r))}catch{}}),Array.from(a).sort()},I=async(i,e)=>await v(i,`
    SELECT * FROM prompt_versions 
    WHERE prompt_id = ? 
    ORDER BY version_number DESC
  `,[e]),N=async(i,e,t,a)=>(a||(a=(await I(i,e)).length+1),{id:(await h(i,`
    INSERT INTO prompt_versions (prompt_id, content, version_number)
    VALUES (?, ?, ?)
  `,[e,t,a])).id,prompt_id:e,content:t,version_number:a,created_at:new Date().toISOString()}),Q=async i=>await v(i,"SELECT * FROM categories ORDER BY name"),$=async(i,e)=>{const{name:t,description:a,color:n}=e,r=await h(i,"INSERT INTO categories (name, description, color) VALUES (?, ?, ?)",[t,a||null,n||"#007acc"]),l=await T(i,"SELECT * FROM categories WHERE id = ?",[r.id]);if(!l)throw new Error("Failed to create category");return l},Z=async(i,e,t)=>{const{name:a,description:n,color:s}=t;await h(i,`
    UPDATE categories 
    SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,[a,n||null,s||"#007acc",e]);const l=await T(i,"SELECT * FROM categories WHERE id = ?",[e]);if(!l)throw new Error("Failed to update category");return l},ee=async(i,e)=>(await h(i,"UPDATE prompts SET category_id = NULL WHERE category_id = ?",[e]),await h(i,"DELETE FROM categories WHERE id = ?",[e]),{success:!0}),te=async i=>(await v(i,`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.name
  `)).map(a=>({...a,variables:a.variables?JSON.parse(a.variables):[]})),ae=async(i,e)=>{const{name:t,description:a,content:n,variables:s,category_id:r}=e,d=await h(i,`
    INSERT INTO templates (name, description, content, variables, category_id)
    VALUES (?, ?, ?, ?, ?)
  `,[t,a||null,n,JSON.stringify(s||[]),r||null]),p=await T(i,`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `,[d.id]);if(!p)throw new Error("Failed to create template");return{...p,variables:p.variables?JSON.parse(p.variables):[]}},ie=async(i,e,t)=>{const{name:a,description:n,content:s,variables:r,category_id:l}=t;await h(i,`
    UPDATE templates 
    SET name = ?, description = ?, content = ?, variables = ?, category_id = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,[a,n||null,s,JSON.stringify(r||[]),l||null,e]);const p=await T(i,`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM templates t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `,[e]);if(!p)throw new Error("Failed to update template");return{...p,variables:p.variables?JSON.parse(p.variables):[]}},ne=async(i,e)=>(await h(i,"UPDATE prompts SET template_id = NULL WHERE template_id = ?",[e]),await h(i,"DELETE FROM templates WHERE id = ?",[e]),{success:!0}),se=async(i,e,t)=>{const a=await T(i,"SELECT * FROM templates WHERE id = ?",[e]);if(!a)throw new Error("Template not found");let n=a.content;return Object.entries(t).forEach(([s,r])=>{const l=new RegExp(`{{${s}}}`,"g");n=n.replace(l,r)}),{title:`Generated from ${a.name}`,content:n,template_id:e,category_id:a.category_id}},C=async(i,e)=>{const t=await T(i,"SELECT value FROM settings WHERE key = ?",[e]);return t?t.value:null},L=async(i,e,t)=>(await h(i,`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `,[e,t]),{key:e,value:t}),oe=async(i,e,t="json")=>{const a=await k(i);if(t==="json"){const n={prompts:a,exported_at:new Date().toISOString(),version:"1.0.0"};f.writeFileSync(e,JSON.stringify(n,null,2))}else{let n=`Prompt Studio Export
`;n+=`==================

`,a.forEach((s,r)=>{n+=`${r+1}. ${s.title}
`,n+=`Category: ${s.category_name||"None"}
`,n+=`Tags: ${s.tags.join(", ")}
`,n+=`Created: ${s.created_at}

`,n+=`${s.content}

`,s.description&&(n+=`Description: ${s.description}
`),n+=`---

`}),f.writeFileSync(e,n)}},re=async(i,e)=>{try{const t=f.readFileSync(e,"utf8"),a=E.extname(e).toLowerCase();if(a===".json"){const n=JSON.parse(t),s=n.prompts||n;let r=0;for(const l of s)try{const{id:d,created_at:p,updated_at:g,...u}=l;await S(i,u),r++}catch(d){console.error("Error importing prompt:",d)}return{success:!0,imported:r,total:s.length}}else{const n=E.basename(e,a);return await S(i,{title:n,content:t,description:`Imported from ${e}`,tags:["imported"]}),{success:!0,imported:1,total:1}}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Unknown error"}}};class ce{constructor(){this.mainWindow=null,this.menuBarWindow=null,this.tray=null,this.db=null,this.currentMode="desktop",this.isDev=process.env.IS_DEV==="true",this.enableDevTools=process.env.ENABLE_DEV_TOOLS==="true",this.isQuitting=!1,this.setupEventHandlers()}setupEventHandlers(){o.app.whenReady().then(()=>{this.initialize()}),o.app.on("window-all-closed",()=>{process.platform!=="darwin"&&o.app.quit()}),o.app.on("activate",()=>{o.BrowserWindow.getAllWindows().length===0?this.createMainWindow():this.currentMode==="desktop"&&this.mainWindow&&this.mainWindow.show()}),o.app.on("before-quit",async()=>{if(this.isQuitting=!0,this.db)try{const{closeDatabase:e}=await Promise.resolve().then(()=>z);await e(),console.log("Database closed on app quit")}catch(e){console.error("Error closing database:",e)}})}async initialize(){try{this.db=await M();const e=await C(this.db,"appMode");this.currentMode=e||"desktop",this.setupIpcHandlers(),await this.createMainWindow(),await this.createMenuBarWindow(),this.createTray(),this.currentMode==="desktop"&&this.mainWindow&&(this.mainWindow.show(),this.mainWindow.focus())}catch(e){console.error("Failed to initialize app:",e),o.app.quit()}}async createMainWindow(){this.mainWindow=new o.BrowserWindow({width:1200,height:800,show:!1,webPreferences:{nodeIntegration:!1,contextIsolation:!0,preload:E.join(__dirname,"preload.js")},icon:this.getAppIcon(),titleBarStyle:process.platform==="darwin"?"hiddenInset":"default"}),this.isDev?(await this.mainWindow.loadURL("http://localhost:5173"),this.enableDevTools&&this.mainWindow.webContents.openDevTools()):await this.mainWindow.loadFile(E.join(__dirname,"../dist/index.html")),this.mainWindow.once("ready-to-show",()=>{this.currentMode==="desktop"&&this.mainWindow&&(this.mainWindow.show(),this.mainWindow.focus())}),this.mainWindow.on("close",e=>{this.isQuitting||(e.preventDefault(),this.mainWindow&&this.mainWindow.hide())}),this.isDev&&this.mainWindow.webContents.on("before-input-event",(e,t)=>{t.control&&t.shift&&t.key==="I"&&this.mainWindow.webContents.toggleDevTools(),(t.meta||t.control)&&t.key==="F12"&&this.mainWindow.webContents.toggleDevTools()})}async createMenuBarWindow(){this.menuBarWindow=new o.BrowserWindow({width:400,height:600,show:!1,frame:!1,resizable:!1,webPreferences:{nodeIntegration:!1,contextIsolation:!0,preload:E.join(__dirname,"preload.js")},skipTaskbar:!0,alwaysOnTop:!0}),this.isDev?await this.menuBarWindow.loadURL("http://localhost:5173/menubar"):await this.menuBarWindow.loadFile(E.join(__dirname,"../dist/menubar.html")),this.menuBarWindow.on("blur",()=>{this.currentMode==="menubar"&&this.menuBarWindow&&this.menuBarWindow.hide()})}createTray(){const e=this.createTrayIcon();this.tray=new o.Tray(e);const t=o.Menu.buildFromTemplate([{label:"Show Prompt Studio",click:async()=>await this.showApp()},{type:"separator"},{label:"Desktop Mode",type:"radio",checked:this.currentMode==="desktop",click:()=>this.switchMode("desktop")},{label:"Menu Bar Mode",type:"radio",checked:this.currentMode==="menubar",click:()=>this.switchMode("menubar")},{type:"separator"},{label:"Quit",click:()=>{this.isQuitting=!0,o.app.quit()}}]);this.tray.setToolTip("Prompt Studio"),this.tray.setContextMenu(t),this.tray.on("click",async()=>{process.platform!=="darwin"&&await this.toggleApp()}),process.platform==="darwin"&&this.tray.on("right-click",async()=>{this.currentMode==="menubar"&&await this.toggleMenuBarWindow()})}createTrayIcon(){const e=E.join(__dirname,"../assets/tray-icon.png");if(f.existsSync(e)){const n=o.nativeImage.createFromPath(e);return n.setTemplateImage(!0),n.resize({width:16,height:16})}const t=E.join(__dirname,"../assets/icon.png");if(f.existsSync(t)){const n=o.nativeImage.createFromPath(t);return n.setTemplateImage(!0),n.resize({width:16,height:16})}const a=o.nativeImage.createFromDataURL("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAI4SURBVDjLpZPLSyNBEMafJBpfGI0vfIKKD1YR30HFhQVZWFjwgSiIBy+CBx8H8eJBL4IX8eJBD4IXD3oRvHjQi+DFgx4ELx70InjxoAfBiwc9CF48eJEkZjKZt91O05lJJsaD/UF3VVd9X1V3dwvAuHEEeEnNK24HAEhpWjTqsEgUEUlHYgAAAAAAAAD4/nONAAAOFyLSdF3l0AvI7Gii0XDbfU7k9+g7mRn1AHhhNBCJRm+yYdoECUCcvAHxvuwT2g5bMJHsJR0UiSLSSRFJwC");return a.setTemplateImage(!0),a}getAppIcon(){const e=E.join(__dirname,"../assets/icon.png");return f.existsSync(e)?e:""}async showApp(){this.currentMode==="desktop"&&this.mainWindow?(this.mainWindow.show(),this.mainWindow.focus()):this.currentMode==="menubar"&&await this.toggleMenuBarWindow()}async toggleApp(){this.currentMode==="desktop"&&this.mainWindow?this.mainWindow.isVisible()?this.mainWindow.hide():(this.mainWindow.show(),this.mainWindow.focus()):await this.toggleMenuBarWindow()}async toggleMenuBarWindow(){if(!(!this.menuBarWindow||!this.tray))if(this.menuBarWindow.isVisible())this.menuBarWindow.hide();else{this.isDev?await this.menuBarWindow.loadURL("http://localhost:5173/menubar"):await this.menuBarWindow.loadFile(E.join(__dirname,"../dist/menubar.html"));const e=this.tray.getBounds(),t=Math.round(e.x+e.width/2-200),a=Math.round(e.y+e.height);this.menuBarWindow.setPosition(t,a,!1),this.menuBarWindow.show(),this.menuBarWindow.focus()}}async switchMode(e){this.currentMode=e,this.db&&await L(this.db,"appMode",e),e==="desktop"?(this.menuBarWindow&&this.menuBarWindow.hide(),this.mainWindow&&(this.isDev?await this.mainWindow.loadURL("http://localhost:5173"):await this.mainWindow.loadFile(E.join(__dirname,"../dist/index.html")),this.mainWindow.show(),this.mainWindow.focus())):(this.mainWindow&&this.mainWindow.hide(),this.menuBarWindow&&this.menuBarWindow.hide()),this.updateTrayMenu()}updateTrayMenu(){if(!this.tray)return;const e=o.Menu.buildFromTemplate([{label:"Show Prompt Studio",click:async()=>await this.showApp()},{type:"separator"},{label:"Desktop Mode",type:"radio",checked:this.currentMode==="desktop",click:()=>this.switchMode("desktop")},{label:"Menu Bar Mode",type:"radio",checked:this.currentMode==="menubar",click:()=>this.switchMode("menubar")},{type:"separator"},{label:"Quit",click:()=>{this.isQuitting=!0,o.app.quit()}}]);this.tray.setContextMenu(e)}setupIpcHandlers(){o.ipcMain.handle("copy-to-clipboard",async(e,t)=>{const{clipboard:a}=require("electron");return a.writeText(t),{success:!0}}),o.ipcMain.handle("switch-mode",async(e,t)=>{await this.switchMode(t)}),o.ipcMain.handle("get-current-mode",()=>this.currentMode),o.ipcMain.handle("factory-reset",async()=>{try{return await P(),this.db=await M(),{success:!0}}catch(e){return console.error("Factory reset failed:",e),{success:!1,error:e instanceof Error?e.message:"Unknown error"}}}),this.db&&(o.ipcMain.handle("get-all-prompts",async()=>await k(this.db)),o.ipcMain.handle("get-prompt",async(e,t)=>await A(this.db,t)),o.ipcMain.handle("create-prompt",async(e,t)=>await S(this.db,t)),o.ipcMain.handle("update-prompt",async(e,t,a)=>await K(this.db,t,a)),o.ipcMain.handle("delete-prompt",async(e,t)=>await X(this.db,t)),o.ipcMain.handle("search-prompts",async(e,t)=>await j(this.db,t)),o.ipcMain.handle("get-prompts-by-tag",async(e,t)=>await Y(this.db,t)),o.ipcMain.handle("get-all-categories",async()=>await Q(this.db)),o.ipcMain.handle("create-category",async(e,t)=>await $(this.db,t)),o.ipcMain.handle("update-category",async(e,t,a)=>await Z(this.db,t,a)),o.ipcMain.handle("delete-category",async(e,t)=>await ee(this.db,t)),o.ipcMain.handle("get-all-templates",async()=>await te(this.db)),o.ipcMain.handle("create-template",async(e,t)=>await ae(this.db,t)),o.ipcMain.handle("update-template",async(e,t,a)=>await ie(this.db,t,a)),o.ipcMain.handle("delete-template",async(e,t)=>await ne(this.db,t)),o.ipcMain.handle("generate-from-template",async(e,t,a)=>await se(this.db,t,a)),o.ipcMain.handle("get-all-tags",async()=>await V(this.db)),o.ipcMain.handle("get-prompt-versions",async(e,t)=>await I(this.db,t)),o.ipcMain.handle("create-prompt-version",async(e,t,a)=>await N(this.db,t,a)),o.ipcMain.handle("get-setting",async(e,t)=>await C(this.db,t)),o.ipcMain.handle("set-setting",async(e,t,a)=>await L(this.db,t,a)),o.ipcMain.handle("export-prompts",async(e,t)=>{const{filePath:a}=await o.dialog.showSaveDialog({filters:t==="json"?[{name:"JSON Files",extensions:["json"]}]:[{name:"Text Files",extensions:["txt"]}]});return a?(await oe(this.db,a,t),{success:!0,path:a}):{success:!1}}),o.ipcMain.handle("import-prompts",async()=>{const{filePaths:e}=await o.dialog.showOpenDialog({filters:[{name:"Supported Files",extensions:["json","txt"]},{name:"JSON Files",extensions:["json"]},{name:"Text Files",extensions:["txt"]}],properties:["openFile"]});return e&&e.length>0?await re(this.db,e[0]):{success:!1}}),o.ipcMain.handle("test-prompt",async(e,t)=>{var a;try{const{prompt:n,config:s}=t,r=s.apiEndpoint||"https://api.openai.com/v1/chat/completions",l=Date.now(),d=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s.apiKey}`},body:JSON.stringify({model:s.model,messages:[{role:"user",content:n}],temperature:s.temperature||.7,max_tokens:s.maxTokens})}),p=Date.now()-l,g=await d.json();if(!d.ok)throw new Error(((a=g.error)==null?void 0:a.message)||"API request failed");return{success:!0,response:g.choices[0].message.content,usage:g.usage,responseTime:p}}catch(n){return{success:!1,error:n instanceof Error?n.message:"Unknown error"}}}))}}new ce;
