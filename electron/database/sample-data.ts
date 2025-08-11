import type { CreateCategoryData, CreateTemplateData, CreatePromptData } from '../../src/types'

export const sampleCategories: CreateCategoryData[] = [
  { name: 'General', description: 'General purpose prompts for various tasks', color: '#6366f1' },
  { name: 'Creative Writing', description: 'Prompts for creative writing, storytelling, and content creation', color: '#ec4899' },
  { name: 'Code Generation', description: 'Programming, debugging, and code-related prompts', color: '#10b981' },
  { name: 'Analysis', description: 'Data analysis, research, and analytical thinking prompts', color: '#f59e0b' },
  { name: 'Business', description: 'Business strategy, marketing, and professional communication', color: '#8b5cf6' },
  { name: 'Education', description: 'Learning, teaching, and educational content prompts', color: '#06b6d4' },
  { name: 'Personal', description: 'Personal development, productivity, and lifestyle prompts', color: '#ef4444' },
]

export const sampleTemplates: CreateTemplateData[] = [
  {
    name: 'Code Review Template',
    description: 'Comprehensive code review with focus areas',
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
    variables: ['language', 'code'],
    category_id: 3
  },
  {
    name: 'Blog Post Outline',
    description: 'Structure for creating engaging blog posts',
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
    variables: ['title', 'audience', 'tone', 'wordCount'],
    category_id: 2
  },
  {
    name: 'Data Analysis Framework',
    description: 'Structured approach for data analysis tasks',
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
    variables: ['dataType', 'dataDescription', 'analysisType'],
    category_id: 4
  },
  {
    name: 'Learning Plan Creator',
    description: 'Personalized learning roadmap template',
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
    variables: ['subject', 'currentLevel', 'timeCommitment', 'learningStyle', 'goal'],
    category_id: 6
  },
  {
    name: 'Meeting Summary Template',
    description: 'Professional meeting notes and action items',
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
    variables: ['meetingTitle', 'date', 'participants', 'meetingNotes'],
    category_id: 5
  }
]

export const samplePrompts: CreatePromptData[] = [
  // Creative Writing Prompts
  {
    title: 'Character Development Helper',
    content: `Help me create a compelling character for my story. Ask me questions about their background, motivations, fears, and goals. Then provide a detailed character profile including:

- Physical description
- Personality traits and quirks
- Backstory and formative experiences
- Internal conflicts and growth arc
- Relationships with other characters
- Dialogue style and speech patterns

Make the character feel authentic and three-dimensional.`,
    description: 'Interactive character creation for fiction writing',
    category_id: 2,
    tags: ['writing', 'characters', 'fiction', 'creativity'],
    is_favorite: true
  },
  {
    title: 'Story Twist Generator',
    content: `I'm writing a {{genre}} story and need help creating an unexpected plot twist. Here's my current plot:

{{plotSummary}}

The twist should:
- Be surprising but logical in hindsight
- Connect to earlier story elements
- Raise the stakes for the protagonist
- Feel organic to the story world

Please suggest 3 different twist options with brief explanations of how to foreshadow them earlier in the story.`,
    description: 'Generate surprising plot twists for stories',
    category_id: 2,
    template_id: null,
    tags: ['writing', 'plot', 'storytelling', 'creativity', 'fiction'],
    is_favorite: false
  },

  // Code Generation Prompts
  {
    title: 'API Endpoint Creator',
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
    description: 'Generate complete API endpoints with tests and documentation',
    category_id: 3,
    tags: ['api', 'backend', 'rest', 'database', 'authentication'],
    is_favorite: true
  },
  {
    title: 'Algorithm Optimization',
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
    description: 'Analyze and improve algorithm performance',
    category_id: 3,
    tags: ['algorithms', 'optimization', 'performance', 'python', 'complexity'],
    is_favorite: false
  },

  // Analysis Prompts
  {
    title: 'Market Research Analyzer',
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
    description: 'Comprehensive market research and competitive analysis',
    category_id: 4,
    tags: ['market-research', 'analysis', 'business', 'strategy', 'competitors'],
    is_favorite: true
  },
  {
    title: 'Data Visualization Consultant',
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
    description: 'Expert advice on data visualization and dashboard design',
    category_id: 4,
    tags: ['data-viz', 'charts', 'dashboard', 'analytics', 'insights'],
    is_favorite: false
  },

  // Business Prompts
  {
    title: 'Email Campaign Writer',
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
    description: 'Professional email marketing campaign creation',
    category_id: 5,
    tags: ['email', 'marketing', 'copywriting', 'campaigns', 'business'],
    is_favorite: true
  },
  {
    title: 'Business Plan Reviewer',
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
    description: 'Comprehensive business plan analysis and feedback',
    category_id: 5,
    tags: ['business-plan', 'strategy', 'analysis', 'feedback', 'entrepreneurship'],
    is_favorite: false
  },

  // Education Prompts
  {
    title: 'Lesson Plan Creator',
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
    description: 'Comprehensive lesson plan with activities and assessments',
    category_id: 6,
    tags: ['education', 'lesson-plan', 'teaching', 'learning', 'curriculum'],
    is_favorite: true
  },
  {
    title: 'Study Guide Generator',
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
    description: 'Personalized study guides for exam preparation',
    category_id: 6,
    tags: ['study-guide', 'exam-prep', 'learning', 'education', 'memory'],
    is_favorite: false
  },

  // Personal Development Prompts
  {
    title: 'Goal Setting Coach',
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
    description: 'Personal goal setting and achievement planning',
    category_id: 7,
    tags: ['goals', 'planning', 'productivity', 'personal-development', 'motivation'],
    is_favorite: true
  },
  {
    title: 'Habit Formation Guide',
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
    description: 'Science-based habit formation and maintenance strategies',
    category_id: 7,
    tags: ['habits', 'behavior', 'personal-development', 'routine', 'psychology'],
    is_favorite: false
  },

  // General Purpose Prompts
  {
    title: 'Decision Making Framework',
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
    description: 'Structured approach to important decision making',
    category_id: 1,
    tags: ['decision-making', 'analysis', 'strategy', 'planning', 'framework'],
    is_favorite: true
  },
  {
    title: 'Problem Solving Assistant',
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
    description: 'Systematic problem-solving using proven methodologies',
    category_id: 1,
    tags: ['problem-solving', 'analysis', 'creativity', 'planning', 'methodology'],
    is_favorite: false
  }
]

// Map category names to IDs for template and prompt assignments
export function assignCategoryIds(categories: any[], templates: CreateTemplateData[], prompts: CreatePromptData[]) {
  const categoryMap = new Map(categories.map((cat, index) => [cat.name, index + 1]))
  
  // Update templates
  templates.forEach(template => {
    if (template.category_id && template.category_id <= categories.length) {
      template.category_id = categoryMap.get(categories[template.category_id - 1].name) || template.category_id
    }
  })
  
  // Update prompts
  prompts.forEach(prompt => {
    if (prompt.category_id && prompt.category_id <= categories.length) {
      prompt.category_id = categoryMap.get(categories[prompt.category_id - 1].name) || prompt.category_id
    }
  })
}