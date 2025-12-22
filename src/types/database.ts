/**
 * Database Types
 *
 * TypeScript types generated from Supabase database schema.
 * These types should be kept in sync with the SQL schema files.
 *
 * Note: These types use camelCase to match the existing application convention,
 * but the actual database columns may use snake_case.
 */

export type DifficultyLevel = 'iniciante' | 'intermediario' | 'avancado'

export interface Module {
  id: string
  slug: string
  title: string
  description: string | null
  difficultyLevel: DifficultyLevel
  orderIndex: number
  iconUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  moduleId: string
  gestureName: string
  displayName: string
  videoRefUrl: string | null
  minConfidenceThreshold: number // 0.00 to 1.00
  xpReward: number
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[]
  totalLessons: number
  completedLessons: number // Would be calculated based on user progress
}

export interface LessonWithModule extends Lesson {
  module: Module
}

// Database schema type (mimicking Supabase generated types)
export interface Database {
  public: {
    Tables: {
      modules: {
        Row: Module
        Insert: Omit<Module, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>
      }
      lessons: {
        Row: Lesson
        Insert: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          total_xp: number
          current_streak: number
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Query result types
export type ModuleRow = Database['public']['Tables']['modules']['Row']
export type LessonRow = Database['public']['Tables']['lessons']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']

export type ModuleInsert = Database['public']['Tables']['modules']['Insert']
export type LessonInsert = Database['public']['Tables']['lessons']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type ModuleUpdate = Database['public']['Tables']['modules']['Update']
export type LessonUpdate = Database['public']['Tables']['lessons']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Helper types for the application
export interface ModuleProgress {
  moduleId: string
  completedLessons: number
  totalLessons: number
  isUnlocked: boolean
  isCompleted: boolean
}

export interface UserLessonProgress {
  lessonId: string
  moduleId: string
  bestScore: number // 0-100
  attempts: number
  lastAttemptAt: string | null
  isCompleted: boolean
}
