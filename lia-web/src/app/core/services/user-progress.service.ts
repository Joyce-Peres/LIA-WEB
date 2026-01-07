import { Injectable } from '@angular/core';
import type { Lesson } from '../models/database.types';

export interface StoredLessonProgress {
  lessonId: string;
  moduleId: string;
  bestScore: number; // 0-100
  attempts: number;
  lastAttemptAt: number | null; // epoch ms
  isCompleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserProgressService {
  private key(userId: string): string {
    return `lia.progress.v1.${userId}`;
  }

  getAll(userId: string): Record<string, StoredLessonProgress> {
    try {
      const raw = localStorage.getItem(this.key(userId));
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed as Record<string, StoredLessonProgress>;
    } catch {
      return {};
    }
  }

  saveAll(userId: string, data: Record<string, StoredLessonProgress>): void {
    try {
      localStorage.setItem(this.key(userId), JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }

  getLesson(userId: string, lessonId: string): StoredLessonProgress | null {
    const all = this.getAll(userId);
    return all[lessonId] ?? null;
  }

  recordAttempt(userId: string, lesson: Lesson, score: number): StoredLessonProgress {
    const all = this.getAll(userId);
    const now = Date.now();
    const existing = all[lesson.id] ?? {
      lessonId: lesson.id,
      moduleId: lesson.moduleId,
      bestScore: 0,
      attempts: 0,
      lastAttemptAt: null,
      isCompleted: false,
    } satisfies StoredLessonProgress;

    const next: StoredLessonProgress = {
      ...existing,
      attempts: existing.attempts + 1,
      lastAttemptAt: now,
      bestScore: Math.max(existing.bestScore, Math.round(score)),
    };
    all[lesson.id] = next;
    this.saveAll(userId, all);
    return next;
  }

  markCompleted(userId: string, lesson: Lesson, score: number): StoredLessonProgress {
    const attempt = this.recordAttempt(userId, lesson, score);
    const all = this.getAll(userId);
    const next: StoredLessonProgress = { ...attempt, isCompleted: true };
    all[lesson.id] = next;
    this.saveAll(userId, all);
    return next;
  }

  countModule(userId: string, moduleId: string): { completed: number; total: number } {
    const all = this.getAll(userId);
    const values = Object.values(all).filter(v => v.moduleId === moduleId);
    const completed = values.filter(v => v.isCompleted).length;
    const total = values.length; // note: only counts lessons attempted/stored
    return { completed, total };
  }

  countLevel(userId: string, moduleId: string, lessonLevelMap: Array<{ lessonId: string; level: number }>, level: number): { completed: number; total: number } {
    const all = this.getAll(userId);
    const ids = lessonLevelMap.filter(x => x.level === level).map(x => x.lessonId);
    const values = ids.map(id => all[id]).filter(Boolean) as StoredLessonProgress[];
    const completed = values.filter(v => v.isCompleted).length;
    const total = ids.length;
    return { completed, total };
  }
}
