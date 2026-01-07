import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { Module, Lesson, ModuleWithLessons, LessonWithModule, DifficultyLevel } from '../models/database.types';
import { mockModules, mockLessons } from '../data/mock-content';

export interface ModuleWithStats extends Module {
  lessonCount: number;
}

export interface GetModulesOptions {
  difficultyLevel?: DifficultyLevel;
}

export interface GetLessonsOptions {
  limit?: number;
  offset?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private normalizeAssetUrl(url: string | null | undefined): string | null | undefined {
    if (!url) return url;
    if (url.startsWith('/assets/')) return url;
    if (url.startsWith('/')) return `/assets${url}`;
    return `/assets/${url}`;
  }

  private normalizeModule(module: Module): Module {
    return { ...module, iconUrl: this.normalizeAssetUrl(module.iconUrl) ?? module.iconUrl };
  }

  private normalizeLesson<T extends Lesson>(lesson: T): T {
    return { ...lesson, videoRefUrl: this.normalizeAssetUrl(lesson.videoRefUrl) ?? lesson.videoRefUrl } as T;
  }

  getModules(options: GetModulesOptions = {}): Observable<Module[]> {
    let modules = [...mockModules].map(m => this.normalizeModule(m));

    if (options.difficultyLevel) {
      modules = modules.filter(m => m.difficultyLevel === options.difficultyLevel);
    }

    return of(modules);
  }

  getModuleById(id: string): Observable<Module | null> {
    const module = (mockModules.find(m => m.id === id) || null);
    return of(module ? this.normalizeModule(module) : null);

  }

  getModuleBySlug(slug: string): Observable<Module | null> {
    const module = mockModules.find(m => m.slug === slug) || null;
    return of(module ? this.normalizeModule(module) : null);
  }

  getModuleWithLessons(moduleId: string): Observable<ModuleWithLessons | null> {
    const module = mockModules.find(m => m.id === moduleId);
    if (!module) return of(null);

    const lessons = mockLessons.filter(l => l.moduleId === moduleId).map(l => this.normalizeLesson(l));

    return of({
      ...this.normalizeModule(module),
      lessons,
      totalLessons: lessons.length,
      completedLessons: 0 // Will be calculated from user progress
    });
  }

  getLessonsByModule(moduleId: string, options: GetLessonsOptions = {}): Observable<Lesson[]> {
    let lessons = mockLessons.filter(l => l.moduleId === moduleId).map(l => this.normalizeLesson(l));

    if (options.offset) {
      lessons = lessons.slice(options.offset);
    }

    if (options.limit) {
      lessons = lessons.slice(0, options.limit);
    }

    return of(lessons);
  }

  getLessonsByModuleAndLevel(moduleId: string, level: number): Observable<Lesson[]> {
    const lessons = mockLessons.filter(l => l.moduleId === moduleId && l.level === level).map(l => this.normalizeLesson(l));
    return of(lessons);
  }

  getNextLessonInLevel(moduleId: string, level: number, currentOrderIndex: number): Observable<Lesson | null> {
    const list = mockLessons
      .filter(l => l.moduleId === moduleId && l.level === level)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const next = list.find(l => l.orderIndex > currentOrderIndex) || null;
    return of(next ? this.normalizeLesson(next) : null);
  }

  getLessonById(lessonId: string): Observable<LessonWithModule | null> {
    const lesson = mockLessons.find(l => l.id === lessonId);
    if (!lesson) return of(null);

    const module = mockModules.find(m => m.id === lesson.moduleId);
    if (!module) return of(null);

    return of({
      ...this.normalizeLesson(lesson),
      module: this.normalizeModule(module)
    });
  }

  getAllLessons(): Observable<Lesson[]> {
    return of(mockLessons.map(l => this.normalizeLesson(l)));
  }

  countLessonsByModule(moduleId: string): Observable<number> {
    const count = mockLessons.filter(l => l.moduleId === moduleId).length;
    return of(count);
  }

  countLessonsByModuleAndLevel(moduleId: string, level: number): Observable<number> {
    const count = mockLessons.filter(l => l.moduleId === moduleId && l.level === level).length;
    return of(count);
  }

  getModulesWithStats(): Observable<ModuleWithStats[]> {
    const modulesWithStats = mockModules.map(module => ({
      ...module,
      lessonCount: mockLessons.filter(l => l.moduleId === module.id).length
    }));
    return of(modulesWithStats);
  }

  getLevelsForModule(moduleId: string): Observable<number[]> {
    const moduleLessons = mockLessons.filter(l => l.moduleId === moduleId);
    const levels = [...new Set(moduleLessons.map(l => l.level))].sort((a, b) => a - b);
    return of(levels);
  }

  searchLessons(query: string): Observable<Lesson[]> {
    const lowerQuery = query.toLowerCase();
    const results = mockLessons.filter(l =>
      l.gestureName.toLowerCase().includes(lowerQuery) ||
      l.displayName.toLowerCase().includes(lowerQuery)
    );
    return of(results);
  }
}
