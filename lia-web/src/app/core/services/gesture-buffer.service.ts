/**
 * Gesture Buffer Service
 *
 * Serviço para gerenciamento de buffer circular de landmarks,
 * mantendo exatamente os últimos 30 frames para alimentação do modelo LSTM.
 */
import { Injectable, signal, computed } from '@angular/core';
import { LandmarkNormalizerService, type Landmark } from './landmark-normalizer.service';

export interface GestureBufferConfig {
  /** Tamanho do buffer (padrão: 30 frames) */
  bufferSize: number;
  /** Máximo de frames consecutivos sem mãos antes de limpar buffer (padrão: 10) */
  maxConsecutiveNulls: number;
}

const DEFAULT_CONFIG: GestureBufferConfig = {
  bufferSize: 30,
  maxConsecutiveNulls: 10,
};

@Injectable({ providedIn: 'root' })
export class GestureBufferService {
  private config = DEFAULT_CONFIG;

  // Buffer circular de frames (cada frame = 126 features)
  private buffer: number[][] = [];
  private videoDimensions = { width: 640, height: 480 };

  // Signals para estado reativo
  private readonly _frameCount = signal(0);
  private readonly _consecutiveNulls = signal(0);

  /** Número atual de frames no buffer */
  readonly frameCount = this._frameCount.asReadonly();

  /** Número de frames consecutivos sem mãos detectadas */
  readonly consecutiveNulls = this._consecutiveNulls.asReadonly();

  /** Buffer está pronto para inferência (tem bufferSize frames) */
  readonly isReady = computed(() => this._frameCount() >= this.config.bufferSize);

  constructor(private normalizer: LandmarkNormalizerService) {}

  /** Retorna o limite atual de frames consecutivos sem mãos antes de limpar o buffer. */
  getMaxConsecutiveNulls(): number {
    return this.config.maxConsecutiveNulls;
  }

  /**
   * Configura o buffer
   */
  configure(config: Partial<GestureBufferConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Atualiza dimensões do vídeo para normalização
   */
  updateVideoDimensions(width: number, height: number): void {
    if (width > 0 && height > 0) {
      this.videoDimensions = { width, height };
    }
  }

  /**
   * Adiciona um novo frame ao buffer
   *
   * @param multiHandLandmarks - Landmarks do MediaPipe (pode ser null/undefined)
   * @param videoWidth - Largura do vídeo (opcional, usa dimensões salvas)
   * @param videoHeight - Altura do vídeo (opcional, usa dimensões salvas)
   */
  addFrame(
    multiHandLandmarks: Landmark[][] | null | undefined,
    videoWidth?: number,
    videoHeight?: number
  ): void {
    const width = videoWidth || this.videoDimensions.width;
    const height = videoHeight || this.videoDimensions.height;

    // Verificar se há mãos detectadas
    const hasHands = multiHandLandmarks && multiHandLandmarks.length > 0;

    if (!hasHands) {
      // Incrementar contador de nulls consecutivos
      this._consecutiveNulls.update(n => n + 1);

      // Se exceder limite, limpar buffer
      if (this._consecutiveNulls() > this.config.maxConsecutiveNulls) {
        this.clear();
      }
      return;
    }

    // Resetar contador de nulls
    this._consecutiveNulls.set(0);

    // Normalizar landmarks
    const normalized = this.normalizer.normalize(multiHandLandmarks, width, height);

    // Adicionar ao buffer circular
    this.buffer.push(normalized.features);

    // Manter apenas os últimos bufferSize frames
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift();
    }

    // Atualizar contador
    this._frameCount.set(this.buffer.length);
  }

  /**
   * Limpa o buffer completamente
   */
  clear(): void {
    this.buffer = [];
    this._frameCount.set(0);
    this._consecutiveNulls.set(0);
  }

  /**
   * Retorna dados formatados para inferência
   *
   * @returns Tensor shape [1, 30, 126] ou null se buffer não está pronto
   */
  getInferenceData(): number[][][] | null {
    if (!this.isReady()) {
      return null;
    }

    // Retornar cópia do buffer no formato [batch, timesteps, features]
    // batch = 1, timesteps = 30, features = 126
    return [this.buffer.slice(-this.config.bufferSize)];
  }

  /**
   * Retorna o buffer atual (para debug)
   */
  getBuffer(): readonly number[][] {
    return this.buffer;
  }
}
