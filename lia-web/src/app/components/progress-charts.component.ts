import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProgressService, type StoredLessonProgress } from '../core/services/user-progress.service';
import { ProfileService } from '../core/services/profile.service';
import { AuthService } from '../core/services/auth.service';
import type { UserProfile } from '../core/models/auth.types';
import { mockLessons, mockModules } from '../core/data/mock-content';

interface ChartDataPoint {
  date: string;
  xp: number;
}

interface ModuleStats {
  moduleTitle: string;
  completed: number;
  total: number;
  percentage: number;
}

@Component({
  standalone: true,
  selector: 'app-progress-charts',
  imports: [CommonModule],
  templateUrl: './progress-charts.component.html',
  styleUrls: ['./progress-charts.component.css']
})
export class ProgressChartsComponent implements OnInit {
  private readonly progressService = inject(UserProgressService);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);

  // Signals
  readonly progress = signal<Record<string, StoredLessonProgress>>({});
  readonly profile = signal<UserProfile | null>(null);

  // Expose Object.values for template
  readonly Object = Object;

  // Computed - XP over time chart data
  readonly xpChartData = computed<ChartDataPoint[]>(() => {
    const prof = this.profile();
    const currentDate = new Date().toISOString().split('T')[0];

    if (!prof) {
      return [{ date: currentDate, xp: 0 }];
    }

    // For now, show current XP as single data point
    // TODO: Track XP history properly in database
    return [
      { date: currentDate, xp: prof.totalXp }
    ];
  });

  // Computed - Module completion stats
  readonly moduleStats = computed<ModuleStats[]>(() => {
    // Calcular a partir do catálogo completo + flags de conclusão
    // (mesma fonte que o dashboard: lia.completed.lesson.{lessonId})
    return mockModules
      .map((m) => {
        const lessons = mockLessons.filter((l) => l.moduleId === m.id);
        const total = lessons.length;
        const completed = lessons.filter((l) => this.isLessonCompleted(l.id)).length;
        return {
          moduleTitle: m.title,
          completed,
          total,
          percentage: total > 0 ? (completed / total) * 100 : 0,
        };
      })
      .filter((x) => x.total > 0);
  });

  // Computed - Overall accuracy rate
  readonly accuracyRate = computed<number>(() => {
    // Coerente com a plataforma: sucesso = lições concluídas (flags lia.completed.lesson.*)
    // tentativa = lições com ao menos 1 tentativa registrada
    const prog = this.progress();
    const entries = Object.values(prog);
    const attempted = entries.filter((e) => e.attempts > 0);
    if (attempted.length === 0) return 0;

    const successful = attempted.filter((e) => this.isLessonCompleted(e.lessonId)).length;
    return (successful / attempted.length) * 100;
  });

  // Computed - Total practice time (in minutes)
  readonly totalPracticeTime = computed<number>(() => {
    const prog = this.progress();
    const entries = Object.values(prog);

    // Estimate 3 minutes per attempt
    const totalAttempts = entries.reduce((sum, entry) => sum + entry.attempts, 0);
    return totalAttempts * 3;
  });

  // Computed - Completed lessons count
  readonly completedLessonsCount = computed<number>(() => {
    return mockLessons.filter((l) => this.isLessonCompleted(l.id)).length;
  });

  private isLessonCompleted(lessonId: string): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      return localStorage.getItem(`lia.completed.lesson.${lessonId}`) === '1';
    } catch {
      return false;
    }
  }

  // Chart helpers
  getXpChartPath(): string {
    const data = this.xpChartData();
    if (data.length === 0) return '';

    const width = 400;
    const height = 200;
    const padding = 40;

    const maxXp = Math.max(...data.map(d => d.xp), 100);
    const xStep = (width - 2 * padding) / Math.max(data.length - 1, 1);

    const points = data.map((d, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((d.xp / maxXp) * (height - 2 * padding));
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  getXpChartPoints(): Array<{ x: number; y: number; xp: number; date: string }> {
    const data = this.xpChartData();
    if (data.length === 0) return [];

    const width = 400;
    const height = 200;
    const padding = 40;

    const maxXp = Math.max(...data.map(d => d.xp), 100);
    const xStep = (width - 2 * padding) / Math.max(data.length - 1, 1);

    return data.map((d, i) => ({
      x: padding + i * xStep,
      y: height - padding - ((d.xp / maxXp) * (height - 2 * padding)),
      xp: d.xp,
      date: this.formatDate(d.date)
    }));
  }

  getMaxXp(): number {
    const data = this.xpChartData();
    return Math.max(...data.map(d => d.xp), 100);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', day: 'numeric' }).format(date);
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  }

  ngOnInit(): void {
    // Get current session
    const session = this.authService.getSession();
    if (!session?.user?.id) return;

    // Load profile
    const prof = this.profileService.getProfile(session.user.id);
    this.profile.set(prof);

    // Load progress for current user
    const prog = this.progressService.getAll(session.user.id);
    this.progress.set(prog);
  }
}
