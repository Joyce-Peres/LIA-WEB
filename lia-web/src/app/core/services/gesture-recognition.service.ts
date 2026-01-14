/**
 * Gesture Recognition Service
 *
 * Serviço de alto nível que orquestra o pipeline completo de reconhecimento:
 * HandPose → Buffer → Normalização → Inferência → Resultado
 */
import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { Subject, Subscription, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HandPoseService } from './handpose.service';
import { GestureBufferService } from './gesture-buffer.service';
import { ModelInferenceService, type InferenceResult } from './model-inference.service';
import { gestureNamesMatch } from '../utils/gesture-name';

export interface RecognitionState {
  /** Pipeline está ativo */
  isActive: boolean;
  /** Modelo está pronto */
  modelReady: boolean;
  /** Buffer está pronto para inferência */
  bufferReady: boolean;
  /** Número de frames no buffer */
  frameCount: number;
  /** Número de frames consecutivos sem mãos detectadas */
  consecutiveNulls: number;
  /** Limite de frames sem mãos antes de limpar o buffer */
  maxConsecutiveNulls: number;
  /** Último gesto reconhecido */
  lastGesture: string | null;
  /** Confiança do último reconhecimento */
  lastConfidence: number;
  /** FPS de inferência */
  fps: number;

  /** Contador de reconhecimentos aceitos (incrementa a cada decisão estável) */
  acceptedCount: number;
}

@Injectable({ providedIn: 'root' })
export class GestureRecognitionService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private recognitionSub?: Subscription;
  private landmarksSub?: Subscription;

  // Pós-processamento inspirado no script Python (suavização por votação)
  private readonly predictionHistory: string[] = [];
  private readonly predictionHistorySize = 15;

  // Signals para estado
  private readonly _isActive = signal(false);
  private readonly _lastGesture = signal<string | null>(null);
  private readonly _lastConfidence = signal(0);
  private readonly _fps = signal(0);
  private readonly _lastResult = signal<InferenceResult | null>(null);
  private readonly _acceptedCount = signal(0);

  /** Pipeline está ativo */
  readonly isActive = this._isActive.asReadonly();

  /** Último gesto reconhecido */
  readonly lastGesture = this._lastGesture.asReadonly();

  /** Confiança do último reconhecimento (0-100) */
  readonly lastConfidence = this._lastConfidence.asReadonly();

  /** FPS de inferência */
  readonly fps = this._fps.asReadonly();

  /** Último resultado completo de inferência */
  readonly lastResult = this._lastResult.asReadonly();

  /** Contador de reconhecimentos aceitos */
  readonly acceptedCount = this._acceptedCount.asReadonly();

  /** Modelo está pronto */
  readonly modelReady;

  /** Buffer está pronto para inferência */
  readonly bufferReady;

  /** Número de frames no buffer */
  readonly frameCount;

  /** Estado completo */
  readonly state;

  constructor(
    private handPoseService: HandPoseService,
    private bufferService: GestureBufferService,
    private modelService: ModelInferenceService
  ) {
    // Inicializar computed properties no construtor para evitar erros de inicialização
    this.modelReady = this.modelService.isReady;
    this.bufferReady = this.bufferService.isReady;
    this.frameCount = this.bufferService.frameCount;
    this.state = computed<RecognitionState>(() => ({
      isActive: this._isActive(),
      modelReady: this.modelService.isReady(),
      bufferReady: this.bufferService.isReady(),
      frameCount: this.bufferService.frameCount(),
      consecutiveNulls: this.bufferService.consecutiveNulls(),
      maxConsecutiveNulls: this.bufferService.getMaxConsecutiveNulls(),
      lastGesture: this._lastGesture(),
      lastConfidence: this._lastConfidence(),
      fps: this._fps(),
      acceptedCount: this._acceptedCount(),
    }));
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa o pipeline de reconhecimento
   *
   * @param video - Elemento de vídeo com stream da câmera
   */
  async start(video: HTMLVideoElement): Promise<void> {
    if (this._isActive()) return;

    console.log('[GestureRecognition] Starting pipeline...');

    // Atualizar dimensões do vídeo no buffer
    this.bufferService.updateVideoDimensions(video.videoWidth || 640, video.videoHeight || 480);

    // Carregar modelo se ainda não carregado
    if (!this.modelService.isReady()) {
      await this.modelService.loadModel();
    }

    // Iniciar HandPose se ainda não iniciado
    await this.handPoseService.start(video);

    // Subscrever aos resultados de landmarks
    this.subscribeToLandmarks(video);

    // Iniciar loop de inferência
    this.startInferenceLoop();

    this._isActive.set(true);
    console.log('[GestureRecognition] Pipeline started');
  }

  /**
   * Para o pipeline de reconhecimento
   */
  stop(): void {
    this.recognitionSub?.unsubscribe();
    this.recognitionSub = undefined;

    this.landmarksSub?.unsubscribe();
    this.landmarksSub = undefined;

    this.bufferService.clear();
    this._isActive.set(false);
    this._lastGesture.set(null);
    this._lastConfidence.set(0);
    this._lastResult.set(null);
    this._acceptedCount.set(0);
    this.predictionHistory.length = 0;

    console.log('[GestureRecognition] Pipeline stopped');
  }

  /**
   * Limpa o buffer e estado atual
   */
  reset(): void {
    this.bufferService.clear();
    this._lastGesture.set(null);
    this._lastConfidence.set(0);
    this._lastResult.set(null);
    this._acceptedCount.set(0);
    this.predictionHistory.length = 0;
  }

  /**
   * Subscreve aos resultados do HandPose e alimenta o buffer
   */
  private subscribeToLandmarks(video: HTMLVideoElement): void {
    this.landmarksSub?.unsubscribe();

    this.landmarksSub = this.handPoseService.results$
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (!res) return;

        const prevFrameCount = this.bufferService.frameCount();

        const landmarks = res.multiHandLandmarks as Array<Array<{ x: number; y: number; z: number }>> | undefined;

        // Adicionar frame ao buffer
        this.bufferService.addFrame(
          landmarks,
          video.videoWidth || 640,
          video.videoHeight || 480
        );

        // Se o buffer foi limpo (ex.: muitos frames sem mãos), limpar também estado/pós-processamento.
        // Isso evita manter um gesto antigo e marcar como correto quando não há mãos no vídeo.
        if (prevFrameCount > 0 && this.bufferService.frameCount() === 0) {
          this._lastGesture.set(null);
          this._lastConfidence.set(0);
          this._lastResult.set(null);
          this._acceptedCount.set(0);
          this.predictionHistory.length = 0;
        }
      });
  }

  /**
   * Inicia loop de inferência (a cada ~100ms quando buffer está pronto)
   */
  private startInferenceLoop(): void {
    this.recognitionSub?.unsubscribe();

    let lastInferenceTime = 0;
    const fpsWindow: number[] = [];

    this.recognitionSub = interval(100)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        // Só executar se buffer estiver pronto
        if (!this.bufferService.isReady()) return;

        // Obter dados do buffer
        const data = this.bufferService.getInferenceData();
        if (!data) return;

        // Executar inferência
        const result = await this.modelService.runInference(data);
        if (!result) return;

        // Atualizar resultado
        this._lastResult.set(result);

        // Verificar confiança mínima e aplicar suavização por votação (histórico)
        if (this.modelService.isConfident(result)) {
          this.predictionHistory.push(result.predictedClass);
          if (this.predictionHistory.length > this.predictionHistorySize) {
            this.predictionHistory.shift();
          }

          // Votação majoritária (igual ao script Python)
          const counts = new Map<string, number>();
          for (const gesture of this.predictionHistory) {
            counts.set(gesture, (counts.get(gesture) ?? 0) + 1);
          }

          let stableGesture: string | null = null;
          let stableCount = 0;
          for (const [gesture, count] of counts.entries()) {
            if (count > stableCount) {
              stableGesture = gesture;
              stableCount = count;
            }
          }

          // Só atualiza se for um gesto novo (evita "spam" do mesmo resultado)
          if (stableGesture) {
            if (stableGesture !== this._lastGesture()) {
              this._lastGesture.set(stableGesture);
            }
            this._lastConfidence.set(Math.round(result.confidence * 100));
            this._acceptedCount.update(n => n + 1);

            // Reset após reconhecimento, como no script Python
            this.bufferService.clear();
          }
        }

        // Calcular FPS
        const now = performance.now();
        if (lastInferenceTime > 0) {
          const elapsed = now - lastInferenceTime;
          fpsWindow.push(1000 / elapsed);
          if (fpsWindow.length > 10) fpsWindow.shift();
          const avgFps = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length;
          this._fps.set(Math.round(avgFps));
        }
        lastInferenceTime = now;
      });
  }

  /**
   * Verifica se o gesto atual corresponde ao esperado
   */
  matchesGesture(expectedGesture: string): boolean {
    return gestureNamesMatch(this._lastGesture(), expectedGesture);
  }

  /**
   * Verifica se a confiança atual está acima do threshold
   */
  meetsConfidenceThreshold(threshold: number): boolean {
    return this._lastConfidence() >= threshold;
  }
}
