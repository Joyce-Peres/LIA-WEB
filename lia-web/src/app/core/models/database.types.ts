/**
 * Database Types
 *
 * TypeScript types for the application database schema.
 * These types define the data structures for modules, lessons, and user profiles.
 */

export type DifficultyLevel = 'iniciante' | 'intermediario' | 'avancado';

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficultyLevel: DifficultyLevel;
  orderIndex: number;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  gestureName: string;
  displayName: string;
  videoRefUrl: string | null;
  minConfidenceThreshold: number; // 0.00 to 1.00
  xpReward: number;
  orderIndex: number;
  level: number; // Level within the module (1, 2, 3, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
  totalLessons: number;
  completedLessons: number;
}

export interface LessonWithModule extends Lesson {
  module: Module;
}

export interface ModuleProgress {
  moduleId: string;
  completedLessons: number;
  totalLessons: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface UserLessonProgress {
  lessonId: string;
  moduleId: string;
  bestScore: number; // 0-100
  attempts: number;
  lastAttemptAt: string | null;
  isCompleted: boolean;
}

/**
 * Level metadata within a module/section
 */
export interface Level {
  number: number;
  moduleId: string;
  gestures: string[];
  isUnlocked: boolean;
  isCompleted: boolean;
  totalLessons: number;
  completedLessons: number;
}

/**
 * Section icon mapping type
 */
export interface SectionIcon {
  emoji: string;
  label: string;
}
