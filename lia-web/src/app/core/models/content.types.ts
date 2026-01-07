/**
 * Content Types
 *
 * TypeScript interfaces for the content management system (modules and lessons).
 */

import type { DifficultyLevel, Module as DatabaseModule, Lesson as DatabaseLesson } from './database.types';

export type { DifficultyLevel };

export type Module = DatabaseModule;

export interface Lesson extends DatabaseLesson {
  module?: Module;
}

export type ProgressStatus = 'not-started' | 'in-progress' | 'completed';

export interface ModuleProgress {
  moduleId: string;
  status: ProgressStatus;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  bestScore?: number;
  lastAccessedAt?: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  bestConfidence?: number;
  attempts: number;
  xpEarned: number;
  completedAt?: string;
  lastAttemptAt?: string;
}

export interface UserProgress {
  modules: Record<string, ModuleProgress>;
  lessons: Record<string, LessonProgress>;
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
}

export interface ContentQueryOptions {
  difficultyLevel?: DifficultyLevel;
  moduleId?: string;
  includeRelated?: boolean;
  limit?: number;
  offset?: number;
}
