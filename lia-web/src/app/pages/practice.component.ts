import { Component, OnDestroy, OnInit, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, interval, switchMap, takeUntil } from 'rxjs';
import { ContentService } from '../core/services/content.service';
import type { LessonWithModule } from '../core/models/database.types';
import { CameraService } from '../core/services/camera.service';
import { HandPoseService } from '../core/services/handpose.service';
import { UserProgressService } from '../core/services/user-progress.service';
import { ProfileService } from '../core/services/profile.service';
import { AuthService } from '../core/services/auth.service';
import { GestureRecognitionService } from '../core/services/gesture-recognition.service';
import { GestureBufferService } from '../core/services/gesture-buffer.service';
import { GestureVideoPlayerComponent } from '../components/gesture-video-player.component';

@Component({
  standalone: true,
  selector: 'app-practice',
  imports: [CommonModule, FormsModule, GestureVideoPlayerComponent],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css'
})
export class PracticeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected readonly isLoading = signal(true);
  protected readonly lesson = signal<LessonWithModule | null>(null);
  protected readonly cameraReady = signal(false);
  protected readonly availableCameras = signal<{ deviceId: string; label: string }[]>([]);
  protected cameraSelectValue = 'facing:user';
  protected readonly isSessionActive = signal(false);
  protected readonly confidence = signal(0); // 0-100
  protected readonly practiceProgress = signal(0); // 0-100
  protected readonly practiceStatus = signal('Pronto para praticar');
  protected readonly nextLessonId = signal<string | null>(null);
  protected readonly recognizedGesture = signal<string | null>(null);
  protected readonly recognitionFps = signal(0);
  protected readonly bufferProgress = signal(0); // 0-30 frames
  protected readonly handsMissingCount = signal(0);
  protected readonly handsMissingMax = signal(0);
  protected readonly handsMissingVisible = signal(false);
  protected readonly handsMissingDisplayCount = signal(0);

  private handsMissingHideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly HANDS_MISSING_HIDE_DELAY_MS = 450;

  @ViewChild('videoEl') private videoRef?: ElementRef<HTMLVideoElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private content: ContentService,
    private camera: CameraService,
    private handpose: HandPoseService,
    private progressService: UserProgressService,
    private profileService: ProfileService,
    private authService: AuthService,
    private gestureRecognition: GestureRecognitionService,
    private gestureBuffer: GestureBufferService
  ) {
    // Efeito para sincronizar estado do reconhecimento
    effect(() => {
      const state = this.gestureRecognition.state();
      this.recognizedGesture.set(state.lastGesture);
      this.recognitionFps.set(state.fps);
      this.bufferProgress.set(state.frameCount);

      // Atualizar confiança se reconhecimento ativo
      if (this.isSessionActive() && state.lastConfidence > 0) {
        this.confidence.set(state.lastConfidence);
      }
    });
  }

  ngOnInit(): void {
    // restore camera preference
    this.cameraSelectValue = this.loadCameraPref();

    // Limite de "frames sem mãos" (mesmo valor usado no buffer do pipeline)
    this.handsMissingMax.set(this.gestureBuffer.getMaxConsecutiveNulls());

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
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.handsMissingHideTimer) {
      clearTimeout(this.handsMissingHideTimer);
      this.handsMissingHideTimer = null;
    }

    // Best-effort stop on destroy
    void this.camera.stop();
    this.handpose.stop();
    this.gestureRecognition.stop();
  }

  backToLesson(): void {
    const l = this.lesson();
    if (!l) return;
    // Tela de níveis obsoleta: voltar ao dashboard
    this.router.navigate(['/dashboard']);
  }

  backToModule(): void {
    const l = this.lesson();
    if (!l) return;
    this.router.navigate(['/dashboard']);
  }

  // Placeholder hook for camera initialization
  async initCamera(): Promise<void> {
    const el = this.videoRef?.nativeElement;
    if (!el) return;
    try {
      const value = this.cameraSelectValue;
      if (value.startsWith('device:')) {
        const deviceId = value.slice('device:'.length);
        await this.camera.startWithDeviceId(el, deviceId);
      } else if (value === 'facing:environment') {
        await this.camera.startFacing(el, 'environment');
      } else {
        await this.camera.startFacing(el, 'user');
      }
      this.cameraReady.set(this.camera.isActive());
      // Populate device list (labels available after permission)
      const devices = await this.camera.listVideoInputs();
      this.availableCameras.set(devices.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })));
      this.saveCameraPref(this.cameraSelectValue);

      // Start handpose processing
      await this.handpose.start(el);
      this.subscribeToLandmarks();
    } catch (err) {
      console.error('Failed to init camera:', err);
      this.cameraReady.set(false);
    }
  }

  async changeCamera(): Promise<void> {
    const el = this.videoRef?.nativeElement;
    if (!el) return;
    try {
      await this.camera.stop();
      const value = this.cameraSelectValue;
      if (value.startsWith('device:')) {
        const deviceId = value.slice('device:'.length);
        await this.camera.startWithDeviceId(el, deviceId);
      } else if (value === 'facing:environment') {
        await this.camera.startFacing(el, 'environment');
      } else {
        await this.camera.startFacing(el, 'user');
      }
      this.cameraReady.set(this.camera.isActive());

      // Restart handpose on new stream
      this.handpose.stop();
      await this.handpose.start(el);
    } catch (err) {
      console.error('Failed to change camera:', err);
      this.cameraReady.set(false);
    }
  }

  async stopCamera(): Promise<void> {
    try {
      // Parar sessão antes de desligar a câmera (evita pipeline rodando sem vídeo)
      if (this.isSessionActive()) {
        this.stopSession();
      }

      await this.camera.stop();
      this.handpose.stop();
      this.gestureRecognition.stop();
    } catch (err) {
      console.error('Failed to stop camera:', err);
    } finally {
      this.cameraReady.set(false);

      if (this.handsMissingHideTimer) {
        clearTimeout(this.handsMissingHideTimer);
        this.handsMissingHideTimer = null;
      }
      this.handsMissingVisible.set(false);
      this.handsMissingDisplayCount.set(0);
    }
  }

  async onCameraSelectionChange(): Promise<void> {
    this.saveCameraPref(this.cameraSelectValue);
    if (this.cameraReady()) {
      await this.changeCamera();
    }
  }

  // --- Practice session with real recognition ---
  private sessionSub?: Subscription;
  private correctGestureStreak = 0;
  private readonly STREAK_TARGET = 5; // Acertar 5 vezes seguidas para completar
  private lastHandledAcceptedCount = 0;

  async startSession(): Promise<void> {
    if (!this.cameraReady()) {
      await this.initCamera();
      if (!this.cameraReady()) return;
    }

    const video = this.videoRef?.nativeElement;
    if (!video) return;

    this.isSessionActive.set(true);
    this.practiceStatus.set('Praticando…');
    // reset values
    this.practiceProgress.set(0);
    this.confidence.set(0);
    this.correctGestureStreak = 0;
    this.lastHandledAcceptedCount = 0;

    // Iniciar pipeline de reconhecimento
    await this.gestureRecognition.start(video);

    // Começa a partir do contador atual para não reprocessar eventos antigos
    this.lastHandledAcceptedCount = this.gestureRecognition.acceptedCount();

    // Loop de verificação do gesto
    this.sessionSub?.unsubscribe();
    this.sessionSub = interval(200).pipe(takeUntil(this.destroy$)).subscribe(() => {
      const lesson = this.lesson();
      if (!lesson) return;

      // Só processar quando houver um novo reconhecimento aceito
      const accepted = this.gestureRecognition.acceptedCount();
      if (accepted === this.lastHandledAcceptedCount) return;
      this.lastHandledAcceptedCount = accepted;

      const expectedGesture = lesson.gestureName;
      const recognized = this.recognizedGesture();
      const conf = this.confidence();
      const minConf = (lesson.minConfidenceThreshold ?? 0.7) * 100;

      // Verificar se o gesto correto foi reconhecido com confiança suficiente
      if (recognized && recognized.toUpperCase() === expectedGesture.toUpperCase() && conf >= minConf) {
        this.correctGestureStreak++;
        this.practiceStatus.set(`Correto! ${this.correctGestureStreak}/${this.STREAK_TARGET}`);

        // Atualizar progresso baseado na streak
        const progress = Math.min(100, (this.correctGestureStreak / this.STREAK_TARGET) * 100);
        this.practiceProgress.set(Math.round(progress));

        if (this.correctGestureStreak >= this.STREAK_TARGET) {
          this.practiceStatus.set('Concluído!');
          this.stopSession();
          this.handleCompletion();
        }
      } else if (recognized && recognized.toUpperCase() !== expectedGesture.toUpperCase()) {
        // Gesto errado detectado - resetar streak parcialmente
        this.correctGestureStreak = Math.max(0, this.correctGestureStreak - 1);
        this.practiceStatus.set(`Tente o gesto "${expectedGesture}"`);
      }
    });
  }

  stopSession(): void {
    this.sessionSub?.unsubscribe();
    this.sessionSub = undefined;
    this.isSessionActive.set(false);

    if (this.handsMissingHideTimer) {
      clearTimeout(this.handsMissingHideTimer);
      this.handsMissingHideTimer = null;
    }
    this.handsMissingVisible.set(false);
    this.handsMissingDisplayCount.set(0);
    this.gestureRecognition.reset();
    if (this.practiceProgress() < 100) {
      this.practiceStatus.set('Pausado');
    }
  }

  // --- Preference persistence ---
  private readonly PREF_KEY = 'lia.camera.pref.v1';
  private loadCameraPref(): string {
    try {
      if (typeof localStorage === 'undefined') return 'facing:user';
      return localStorage.getItem(this.PREF_KEY) || 'facing:user';
    } catch {
      return 'facing:user';
    }
  }
  private saveCameraPref(value: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(this.PREF_KEY, value);
    } catch { /* ignore */ }
  }

  // --- Landmarks subscription and drawing ---
  @ViewChild('overlayEl') private overlayRef?: ElementRef<HTMLCanvasElement>;
  private landmarksSub?: Subscription;

  private updateHandsMissing(nextCount: number): void {
    this.handsMissingCount.set(nextCount);

    if (nextCount > 0) {
      this.handsMissingDisplayCount.set(nextCount);
      this.handsMissingVisible.set(true);
      if (this.handsMissingHideTimer) {
        clearTimeout(this.handsMissingHideTimer);
        this.handsMissingHideTimer = null;
      }
      return;
    }

    if (this.handsMissingVisible() && !this.handsMissingHideTimer) {
      this.handsMissingHideTimer = setTimeout(() => {
        this.handsMissingVisible.set(false);
        this.handsMissingDisplayCount.set(0);
        this.handsMissingHideTimer = null;
      }, this.HANDS_MISSING_HIDE_DELAY_MS);
    }
  }

  private subscribeToLandmarks(): void {
    this.landmarksSub?.unsubscribe();
    this.landmarksSub = this.handpose.results$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      const hands = res?.multiHandLandmarks as Array<Array<{ x: number; y: number }>> | undefined;
      const hasHands = !!hands && hands.length > 0;

      if (!hasHands) {
        const max = this.handsMissingMax() || this.gestureBuffer.getMaxConsecutiveNulls();
        const next = Math.min(max + 1, this.handsMissingCount() + 1);
        this.updateHandsMissing(next);
        // Limpa o overlay para evitar “fantasmas” quando as mãos somem
        this.drawLandmarks(res ?? { multiHandLandmarks: [] });
        return;
      }

      this.updateHandsMissing(0);
      this.drawLandmarks(res);
    });
  }

  private drawLandmarks(res: any): void {
    const canvas = this.overlayRef?.nativeElement;
    const video = this.videoRef?.nativeElement;
    if (!canvas || !video) return;

    // Dimensões reais do vídeo (resolução da câmera)
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    // Dimensões visíveis do container (CSS)
    const containerWidth = canvas.clientWidth || videoWidth;
    const containerHeight = canvas.clientHeight || videoHeight;

    // Ajustar canvas para o tamanho do container
    if (canvas.width !== containerWidth) canvas.width = containerWidth;
    if (canvas.height !== containerHeight) canvas.height = containerHeight;

    // Calcular escala e offsets para object-fit: contain
    // Contain: escala para caber inteiro no container (pode ter barras)
    const scale = Math.min(containerWidth / videoWidth, containerHeight / videoHeight);
    const drawWidth = videoWidth * scale;
    const drawHeight = videoHeight * scale;
    const offsetX = (containerWidth - drawWidth) / 2;
    const offsetY = (containerHeight - drawHeight) / 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hands = res.multiHandLandmarks as Array<Array<{ x: number; y: number }>> | undefined;
    if (!hands || hands.length === 0) return;

    // Conexões padrão do MediaPipe Hands (igual à implementação original do LIA)
    const HAND_CONNECTIONS: Array<[number, number]> = [
      // Polegar
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Indicador
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Médio
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Anelar
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Mindinho
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Arco da palma
      [5, 9], [9, 13], [13, 17],
    ];

    // Usar roxo (paleta do app) para todos os landmarks
    const getLandmarkColor = (_index: number): string => {
      return '#7c3aed';
    };

    // Função para converter coordenadas normalizadas para pixels do canvas
    const toCanvasX = (normX: number) => offsetX + normX * drawWidth;
    const toCanvasY = (normY: number) => offsetY + normY * drawHeight;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const lm of hands) {
      // Desenhar conexões primeiro (atrás dos pontos)
      ctx.strokeStyle = '#7c3aed';
      ctx.globalAlpha = 0.7;

      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        if (startIdx >= lm.length || endIdx >= lm.length) continue;
        const start = lm[startIdx];
        const end = lm[endIdx];
        ctx.beginPath();
        ctx.moveTo(toCanvasX(start.x), toCanvasY(start.y));
        ctx.lineTo(toCanvasX(end.x), toCanvasY(end.y));
        ctx.stroke();
      }

      // Desenhar pontos (keypoints)
      ctx.globalAlpha = 1.0;
      lm.forEach((landmark, index) => {
        const x = toCanvasX(landmark.x);
        const y = toCanvasY(landmark.y);

        // Círculo externo colorido
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = getLandmarkColor(index);
        ctx.fill();

        // Círculo interno branco
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
    }
  }

  // --- Completion integration ---
  private handleCompletion(): void {
    const l = this.lesson();
    const sess = this.authService.currentSession;
    if (!l || !sess) return;

    const finalScore = this.confidence();
    this.progressService.markCompleted(sess.user.id, l, finalScore);

    // Award XP using project palette via existing styles (no new colors)
    this.profileService.updateProfile(sess.user.id, (p) => ({
      ...p,
      totalXp: p.totalXp + l.xpReward
    }));

    // Persistência simples de progresso por módulo + marcação por lição (evita contagem duplicada)
    try {
      const lessonKey = `lia.completed.lesson.${l.id}`;
      const moduleKey = `lia.progress.${l.moduleId}`;
      const already = localStorage.getItem(lessonKey) === '1';
      if (!already) {
        localStorage.setItem(lessonKey, '1');
        const current = Number(localStorage.getItem(moduleKey) || '0');
        const next = current + 1;
        localStorage.setItem(moduleKey, String(next));
      }
    } catch {
      /* ignore storage errors */
    }

    // Resolve next lesson within the same level
    this.content
      .getNextLessonInLevel(l.moduleId, l.level, l.orderIndex)
      .pipe(takeUntil(this.destroy$))
      .subscribe(next => {
        this.nextLessonId.set(next?.id ?? null);
      });
  }

  goToNextLesson(): void {
    const id = this.nextLessonId();
    if (!id) return;
    this.router.navigate(['/practice', id]);
  }
}
