import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserMenuComponent } from '../components/user-menu.component';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { ContentService } from '../core/services/content.service';
import type { Module } from '../core/models/database.types';
import { UserProgressService } from '../core/services/user-progress.service';
import { AuthService } from '../core/services/auth.service';

interface LevelInfo {
  level: number;
  count: number;
  completed: number;
}

@Component({
  standalone: true,
  selector: 'app-module-levels',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './module-levels.component.html',
  styleUrl: './module-levels.component.css'
})
export class ModuleLevelsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected readonly module = signal<Module | null>(null);
  protected readonly levels = signal<LevelInfo[]>([]);
  protected readonly isLoading = signal(true);

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
          const slug = params.get('moduleSlug') ?? '';
          this.isLoading.set(true);
          return this.content.getModuleBySlug(slug);
        })
      )
      .subscribe(async (mod) => {
        if (!mod) {
          this.router.navigate(['/dashboard']);
          return;
        }
        this.module.set(mod);
        // Load levels and counts
        const levels = await this.content.getLevelsForModule(mod.id).toPromise();
        const items: LevelInfo[] = [];
        if (levels) {
          for (const lvl of levels) {
            const lessons = await this.content.getLessonsByModuleAndLevel(mod.id, lvl).toPromise();
            const total = lessons?.length ?? 0;
            let completed = 0;
            const userId = this.auth.currentSession?.user.id;
            if (userId && lessons) {
              for (const les of lessons) {
                const p = this.progress.getLesson(userId, les.id);
                if (p?.isCompleted) completed++;
              }
            }
            items.push({ level: lvl, count: total, completed });
          }
        }
        this.levels.set(items);
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openLevel(level: number): void {
    const mod = this.module();
    if (!mod) return;
    this.router.navigate(['/modules', mod.id, 'level', level]);
  }

  back(): void {
    this.location.back();
  }
}
