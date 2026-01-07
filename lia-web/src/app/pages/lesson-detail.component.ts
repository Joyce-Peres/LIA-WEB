import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { ContentService } from '../core/services/content.service';
import type { Lesson, LessonWithModule } from '../core/models/database.types';
import { GestureVideoPlayerComponent } from '../components/gesture-video-player.component';

@Component({
  standalone: true,
  selector: 'app-lesson-detail',
  imports: [CommonModule, GestureVideoPlayerComponent],
  templateUrl: './lesson-detail.component.html',
  styleUrl: './lesson-detail.component.css'
})
export class LessonDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected readonly isLoading = signal(true);
  protected readonly lesson = signal<LessonWithModule | null>(null);
  protected readonly nextLesson = signal<Lesson | null>(null);

  protected readonly hasVideo = computed(() => !!this.lesson()?.videoRefUrl);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private content: ContentService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('lessonId') ?? '';
          this.isLoading.set(true);
          return this.content.getLessonById(id);
        })
      )
      .subscribe(lesson => {
        if (!lesson) {
          this.router.navigate(['/dashboard']);
          return;
        }
        this.lesson.set(lesson);
        // Resolve next lesson within the same level
        this.content
          .getNextLessonInLevel(lesson.moduleId, lesson.level, lesson.orderIndex)
          .subscribe(next => this.nextLesson.set(next));
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  backToModule(): void {
    const l = this.lesson();
    if (!l) return;
    this.router.navigate(['/modules', l.module.slug]);
  }

  practice(): void {
    const l = this.lesson();
    if (!l) return;
    this.router.navigate(['/practice', l.id]);
  }

  goToNextLesson(): void {
    const next = this.nextLesson();
    if (!next) return;
    this.router.navigate(['/lessons', next.id]);
  }
}
