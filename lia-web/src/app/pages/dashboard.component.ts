import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ProfileService } from '../core/services/profile.service';
import { ContentService, type ModuleWithStats } from '../core/services/content.service';
import type { AuthSession, UserProfile } from '../core/models/auth.types';
import { sectionIcons, mockLessons } from '../core/data/mock-content';
import type { Lesson } from '../core/models/database.types';
import { ProgressChartsComponent } from '../components/progress-charts.component';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, ProgressChartsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected readonly session = signal<AuthSession | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly modules = signal<ModuleWithStats[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly activeGroupIndex = signal<Record<string, number>>({});

  protected readonly overallStats = computed(() => {
    const mods = this.modules();
    let totalLessons = 0;
    let completedLessons = 0;

    for (const mod of mods) {
      const lessons = this.getLessonsForModule(mod.id);
      totalLessons += lessons.length;
      completedLessons += this.getCompletedCountForLessons(lessons);
    }

    const progress = totalLessons === 0 ? 0 : completedLessons / totalLessons;
    return { totalLessons, completedLessons, progress };
  });

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private contentService: ContentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        this.session.set(session);
        if (session) {
          this.profile.set(this.profileService.ensureProfile(session.user.id));
          this.loadModules();
        } else {
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadModules(): void {
    this.contentService.getModulesWithStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modules) => {
          this.modules.set(modules);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load modules:', err);
          this.isLoading.set(false);
        }
      });
  }

  async handleLogout(): Promise<void> {
    await this.authService.signOut();
  }

  handleModuleClick(moduleSlug: string): void {
    this.router.navigate(['/modules', moduleSlug]);
  }

  handleLessonClick(moduleId: string, lessonId: string): void {
    // Direciona direto para a atividade (prática) da lição
    this.router.navigate(['/practice', lessonId]);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  handleAddXp(): void {
    const sess = this.session();
    if (!sess) return;
    const updated = this.profileService.updateProfile(sess.user.id, p => ({
      ...p,
      totalXp: p.totalXp + 1
    }));
    this.profile.set(updated);
  }

  private isLessonCompleted(lessonId: string): boolean {
    try {
      return localStorage.getItem(`lia.completed.lesson.${lessonId}`) === '1';
    } catch {
      return false;
    }
  }

  private getCompletedCountForLessons(lessons: Lesson[]): number {
    let count = 0;
    for (const l of lessons) {
      if (this.isLessonCompleted(l.id)) count++;
    }
    return count;
  }

  getTotalLessonsForModule(moduleId: string): number {
    return this.getLessonsForModule(moduleId).length;
  }

  getCompletedLessonsForModule(moduleId: string): number {
    return this.getCompletedCountForLessons(this.getLessonsForModule(moduleId));
  }

  getModuleProgressPercent(moduleId: string): number {
    const total = this.getTotalLessonsForModule(moduleId);
    const completed = this.getCompletedLessonsForModule(moduleId);
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  getGroupProgressPercent(moduleId: string, groupIndex: number): number {
    const groups = this.getModuleGroups(moduleId);
    const group = groups[groupIndex];
    if (!group || group.lessons.length === 0) return 0;
    const completed = this.getCompletedCountForLessons(group.lessons);
    return Math.round((completed / group.lessons.length) * 100);
  }


  /**
   * Retorna todas as lições de um módulo, ordenadas
   */
  getLessonsForModule(moduleId: string): Lesson[] {
    return mockLessons
      .filter((l) => l.moduleId === moduleId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  isAlphabet(module: ModuleWithStats): boolean { return module.id === 'mod-alfabeto'; }
  isNumbers(module: ModuleWithStats): boolean { return module.id === 'mod-numeros'; }

  /**
   * Agrupa lições por módulo para exibição em abas.
   * - Alfabeto: por nível (Vogais/Consoantes 1/2/3)
   * - Números: por faixa (0–5, 6–10)
   * - Outros: único grupo "Lições"
   */
  getModuleGroups(moduleId: string): Array<{ label: string; lessons: Lesson[] }>{
    const lessons = this.getLessonsForModule(moduleId);
    if (moduleId === 'mod-alfabeto') {
      const g1 = lessons.filter(l => l.level === 1);
      const g2 = lessons.filter(l => l.level === 2);
      const g3 = lessons.filter(l => l.level === 3);
      const g4 = lessons.filter(l => (l.level ?? 0) >= 4);
      const out: Array<{ label: string; lessons: Lesson[] }> = [];
      if (g1.length) out.push({ label: 'Vogais', lessons: g1 });
      if (g2.length) out.push({ label: 'Consoantes 1', lessons: g2 });
      if (g3.length) out.push({ label: 'Consoantes 2', lessons: g3 });
      if (g4.length) out.push({ label: 'Consoantes 3', lessons: g4 });
      return out;
    }
    if (moduleId === 'mod-numeros') {
      const parseNum = (l: Lesson) => {
        const n1 = Number(l.gestureName);
        if (!Number.isNaN(n1)) return n1;
        const m = l.displayName.match(/\d+/);
        return m ? Number(m[0]) : NaN;
      };
      const a: Lesson[] = [], b: Lesson[] = [];
      for (const l of lessons) {
        const n = parseNum(l);
        if (!Number.isNaN(n) && n <= 5) a.push(l); else b.push(l);
      }
      const out: Array<{ label: string; lessons: Lesson[] }> = [];
      if (a.length) out.push({ label: '0–5', lessons: a.sort((x,y)=> (parseNum(x) - parseNum(y))) });
      if (b.length) out.push({ label: '6–10', lessons: b.sort((x,y)=> (parseNum(x) - parseNum(y))) });
      return out.length ? out : [{ label: 'Lições', lessons }];
    }
    if (moduleId === 'mod-dias-semana') {
      const isUtil = (name: string) => {
        const n = name.toLowerCase();
        return n.includes('segunda') || n.includes('terca') || n.includes('terça') || n.includes('quarta') || n.includes('quinta') || n.includes('sexta');
      };
      const uteis = lessons.filter(l => isUtil(l.displayName));
      const finais = lessons.filter(l => !isUtil(l.displayName));
      const out: Array<{ label: string; lessons: Lesson[] }> = [];
      if (uteis.length) out.push({ label: 'Úteis', lessons: uteis });
      if (finais.length) out.push({ label: 'Finais', lessons: finais });
      return out.length ? out : [{ label: 'Lições', lessons }];
    }
    if (moduleId === 'mod-saudacoes') {
      const isFormal = (name: string) => {
        const n = name.toLowerCase();
        return n.includes('por favor') || n.includes('obrigado') || n.includes('obrigada') || n.includes('desculpa');
      };
      const formais = lessons.filter(l => isFormal(l.displayName));
      const informais = lessons.filter(l => !isFormal(l.displayName));
      const out: Array<{ label: string; lessons: Lesson[] }> = [];
      if (formais.length) out.push({ label: 'Formais', lessons: formais });
      if (informais.length) out.push({ label: 'Informais', lessons: informais });
      return out.length ? out : [{ label: 'Lições', lessons }];
    }
    return [{ label: 'Lições', lessons }];
  }

  /** Base index acumulado até o grupo informado (para numeração/lock sequencial) */
  getModuleGroupBaseIndex(moduleId: string, groupIndex: number): number {
    const groups = this.getModuleGroups(moduleId);
    let sum = 0;
    for (let i = 0; i < groupIndex; i++) sum += groups[i]?.lessons.length ?? 0;
    return sum;
  }

  getActiveGroup(moduleId: string): number {
    const map = this.activeGroupIndex();
    const desired = map[moduleId] ?? 0;
    const groups = this.getModuleGroups(moduleId);
    if (!groups.length) return 0;

    const clamped = Math.max(0, Math.min(desired, groups.length - 1));
    const lastUnlocked = this.getLastUnlockedGroupIndex(moduleId);
    return Math.min(clamped, lastUnlocked);
  }
  setActiveGroup(moduleId: string, index: number): void {
    if (!this.isGroupUnlocked(moduleId, index)) return;
    const map = { ...this.activeGroupIndex() };
    map[moduleId] = index;
    this.activeGroupIndex.set(map);
  }

  /**
   * Desbloqueio por grupos/níveis (conceito do app Python):
   * só libera o grupo N quando todos os grupos anteriores foram concluídos.
   */
  isGroupUnlocked(moduleId: string, groupIndex: number): boolean {
    const groups = this.getModuleGroups(moduleId);
    if (groupIndex <= 0) return true;
    if (groupIndex >= groups.length) return false;
    const baseIndex = this.getModuleGroupBaseIndex(moduleId, groupIndex);
    return this.getModuleProgress(moduleId) >= baseIndex;
  }

  getGroupLockReason(moduleId: string, groupIndex: number): string {
    if (this.isGroupUnlocked(moduleId, groupIndex)) return '';
    const groups = this.getModuleGroups(moduleId);
    const previous = groups[groupIndex - 1];
    return previous ? `Complete "${previous.label}" para desbloquear` : 'Complete o grupo anterior para desbloquear';
  }

  private getLastUnlockedGroupIndex(moduleId: string): number {
    const groups = this.getModuleGroups(moduleId);
    if (!groups.length) return 0;
    const progress = this.getModuleProgress(moduleId);

    let base = 0;
    let lastUnlocked = 0;
    for (let i = 0; i < groups.length; i++) {
      if (i === 0) {
        lastUnlocked = 0;
        base += groups[i]?.lessons.length ?? 0;
        continue;
      }
      if (progress >= base) {
        lastUnlocked = i;
      } else {
        break;
      }
      base += groups[i]?.lessons.length ?? 0;
    }
    return lastUnlocked;
  }

  isLessonUnlocked(moduleId: string, absoluteIndex: number): boolean {
    return this.getModuleProgress(moduleId) >= absoluteIndex && this.getModuleProgress(moduleId) >= 0;
  }

  // Preview removido a pedido do usuário

  /**
   * Retorna o progresso do usuário em um módulo (número de lições concluídas).
   * Fonte de verdade: localStorage lia.completed.lesson.{lessonId}
   */
  getModuleProgress(moduleId: string): number {
    return this.getCompletedLessonsForModule(moduleId);
  }

  /**
   * Desbloqueio sequencial (igual ao projeto Python):
   * - Alfabeto começa liberado
   * - Cada módulo só libera quando o módulo anterior estiver 100% concluído
   */
  isModuleLocked(module: ModuleWithStats): boolean {
    if (module.orderIndex <= 1) return false;

    const mods = this.modules();
    const previous = mods
      .filter(m => m.orderIndex < module.orderIndex)
      .sort((a, b) => b.orderIndex - a.orderIndex)[0];

    if (!previous) return false;
    const totalPrev = this.getTotalLessonsForModule(previous.id);
    const completedPrev = this.getCompletedLessonsForModule(previous.id);
    return totalPrev > 0 && completedPrev < totalPrev;
  }

  getModuleLockReason(module: ModuleWithStats): string {
    if (!this.isModuleLocked(module)) return 'Escolha uma lição para praticar';

    const mods = this.modules();
    const previous = mods
      .filter(m => m.orderIndex < module.orderIndex)
      .sort((a, b) => b.orderIndex - a.orderIndex)[0];

    if (!previous) return 'Complete a seção anterior para desbloquear';
    return `Complete a seção "${previous.title}" para desbloquear`;
  }

  getModuleIcon(moduleId: string): { emoji: string; label: string } {
    return sectionIcons[moduleId] || { emoji: '📚', label: 'Módulo' };
  }

  getModuleColor(moduleId: string): string {
    const colors: Record<string, string> = {
      'alfabeto': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      'numeros': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      'dias-semana': 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
      'tempo': 'linear-gradient(135deg, #facc15 0%, #fde047 100%)',
      'perguntas': 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
      'saudacoes': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      'familia': 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
      'alimentos': 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
      'cores': 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
      'animais': 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
      'adjetivos': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    };
    return colors[moduleId] || 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)';
  }
}
