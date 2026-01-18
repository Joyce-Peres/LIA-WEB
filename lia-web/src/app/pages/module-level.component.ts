import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserMenuComponent } from '../components/user-menu.component';
import { Subject, switchMap, takeUntil, firstValueFrom } from 'rxjs';
import { ContentService } from '../core/services/content.service';
import type { Lesson, Module } from '../core/models/database.types';
import { UserProgressService } from '../core/services/user-progress.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-module-level',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './module-level.component.html',
  styleUrl: './module-level.component.css'
})
export class ModuleLevelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected readonly isLoading = signal(true);
  protected readonly module = signal<Module | null>(null);
  protected readonly level = signal<number>(1);
  protected readonly lessons = signal<Lesson[]>([]);

  protected readonly completedMap = computed(() => {
    const m = new Map<string, boolean>();
    const userId = this.auth.currentSession?.user.id;
    if (!userId) return m;
    for (const les of this.lessons()) {
      const p = this.progress.getLesson(userId, les.id);
      m.set(les.id, !!p?.isCompleted);
    }
    return m;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private content: ContentService,
    private progress: UserProgressService,
    private auth: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const moduleIdOrSlug = params.get('moduleId') ?? '';
          const lvlStr = params.get('level') ?? '1';
          const lvl = Number(lvlStr) || 1;
          this.level.set(lvl);
          this.isLoading.set(true);
          // Try id first, fallback to slug
          return this.content.getModuleById(moduleIdOrSlug);
        })
      )
      .subscribe(async (maybeModule) => {
        let mod = maybeModule;
        if (!mod) {
          const slug = this.route.snapshot.paramMap.get('moduleId') ?? '';
          mod = await firstValueFrom(this.content.getModuleBySlug(slug));
        }
        if (!mod) {
          this.router.navigate(['/dashboard']);
          return;
        }
        this.module.set(mod);

        const list = await firstValueFrom(this.content.getLessonsByModuleAndLevel(mod.id, this.level()));
        this.lessons.set((list ?? []).sort((a, b) => a.orderIndex - b.orderIndex));
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    this.location.back();
  }

  openLesson(lessonId: string): void {
    // Direto para a prática para consistência com o Dashboard
    this.router.navigate(['/practice', lessonId]);
  }

  practice(lessonId: string): void {
    this.router.navigate(['/practice', lessonId]);
  }
}
