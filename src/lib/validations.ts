import { z } from 'zod'

// Prompt validation schemas
export const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category_id: z.number().optional(),
  template_id: z.number().optional(),
  tags: z.array(z.string()).default([]),
  is_favorite: z.boolean().default(false),
})

export const updatePromptSchema = createPromptSchema.partial().extend({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
})

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(300, 'Description must be less than 300 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#007acc'),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
})

// Template validation schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(300, 'Description must be less than 300 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  variables: z.array(z.string()).default([]),
  category_id: z.number().optional(),
})

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
})

// API test validation schema
export const apiTestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  config: z.object({
    apiEndpoint: z.string().url('Invalid API endpoint URL'),
    apiKey: z.string().min(1, 'API key is required'),
    model: z.string().min(1, 'Model is required'),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(4000),
  }),
})

// Export types
export type CreatePromptFormData = z.infer<typeof createPromptSchema>
export type UpdatePromptFormData = z.infer<typeof updatePromptSchema>
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>
export type CreateTemplateFormData = z.infer<typeof createTemplateSchema>
export type UpdateTemplateFormData = z.infer<typeof updateTemplateSchema>
export type ApiTestFormData = z.infer<typeof apiTestSchema>