/**
 * Model Inference Service
 *
 * Serviço para carregamento e execução do modelo TensorFlow.js
 * para reconhecimento de gestos em tempo real.
 */
import { Injectable, signal, computed } from '@angular/core';
import { GESTURE_LABELS } from '../data/gesture-labels';

// TensorFlow.js é carregado em runtime via CDN para evitar bundling de polyfills Node
type TensorLike = {
  data: () => PromiseLike<ArrayLike<number>>;
  dispose: () => void;
};

type LayersModel = {
  predict: (input: TensorLike) => TensorLike | TensorLike[];
  dispose: () => void;
};

type TF = {
  loadLayersModel: (path: string) => Promise<LayersModel>;
  tensor3d: (data: number[][][]) => TensorLike;
  zeros: (shape: [number, number, number]) => TensorLike;
};

/**
 * Resultado de uma inferência do modelo
 */
export interface InferenceResult {
  /** Array com probabilidades (uma para cada classe) */
  predictions: number[];
  /** Índice da classe predita */
  predictedClassIndex: number;
  /** Nome da classe predita */
  predictedClass: string;
  /** Confiança da predição (0-1) */
  confidence: number;
  /** Tempo de inferência em milissegundos */
  inferenceTime: number;
}

/**
 * Metadata do modelo
 */
export interface ModelMetadata {
  modelVersion: string;
  status: string;
  inputShape: number[];
  outputShape: number[];
  classes: string[];
  numClasses: number;
  minConfidenceThreshold: number;
  bufferSize: number;
}

@Injectable({ providedIn: 'root' })
export class ModelInferenceService {
  private tf: TF | null = null;
  private model: LayersModel | null = null;
  private metadata: ModelMetadata | null = null;

  private tfLoadPromise: Promise<TF> | null = null;

  // Signals para estado reativo
  private readonly _isLoading = signal(false);
  private readonly _isReady = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastInferenceTime = signal(0);

  /** Modelo está carregando */
  readonly isLoading = this._isLoading.asReadonly();

  /** Modelo está pronto para inferência */
  readonly isReady = this._isReady.asReadonly();

  /** Mensagem de erro */
  readonly error = this._error.asReadonly();

  /** Tempo da última inferência em ms */
  readonly lastInferenceTime = this._lastInferenceTime.asReadonly();

  /** Confiança mínima para aceitar predição */
  readonly minConfidence = computed(() => this.metadata?.minConfidenceThreshold ?? 0.7);

  /** Lista de classes disponíveis */
  readonly classes = computed(() => this.metadata?.classes ?? [...GESTURE_LABELS]);

  /**
   * Carrega o modelo TensorFlow.js e metadata
   *
   * @param modelPath - Caminho para model.json (padrão: /assets/models/model.json)
   * @param metadataPath - Caminho para metadata.json (padrão: /assets/models/metadata.json)
   */
  async loadModel(
    modelPath = '/assets/models/model.json',
    metadataPath = '/assets/models/metadata.json'
  ): Promise<void> {
    if (this.model) {
      console.log('[ModelInference] Model already loaded');
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Carregar metadata primeiro
      const metaResponse = await fetch(metadataPath);
      if (!metaResponse.ok) {
        throw new Error(`Failed to load metadata: ${metaResponse.status}`);
      }
      this.metadata = await metaResponse.json();
      console.log('[ModelInference] Metadata loaded:', this.metadata?.modelVersion);

      // Carregar TensorFlow.js em runtime (browser)
      this.tf = await this.loadTfjs();
      console.log('[ModelInference] TensorFlow.js ready');

      // Carregar modelo
      this.model = await this.tf.loadLayersModel(modelPath);
      console.log('[ModelInference] Model loaded successfully');

      // Warmup: executar uma inferência dummy
      await this.warmup();

      this._isReady.set(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading model';
      console.error('[ModelInference] Load error:', message);
      this._error.set(message);

      // Se o modelo não foi convertido, ainda permitir uso mock
      if (this.metadata?.status === 'mock') {
        console.warn('[ModelInference] Using mock mode - model weights not converted');
        this._isReady.set(true);
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Executa warmup do modelo
   */
  private async warmup(): Promise<void> {
    if (!this.model || !this.tf) return;

    const dummyInput = this.tf.zeros([1, 30, 126]);
    try {
      const result = this.model.predict(dummyInput);
      if (Array.isArray(result)) {
        result.forEach(t => t.dispose());
      } else {
        result.dispose();
      }
      console.log('[ModelInference] Warmup complete');
    } finally {
      dummyInput.dispose();
    }
  }

  /**
   * Executa inferência com buffer de dados
   *
   * @param buffer - Dados no formato [1, 30, 126]
   * @returns Resultado da inferência ou null se modelo não pronto
   */
  async runInference(buffer: number[][][]): Promise<InferenceResult | null> {
    if (!this.metadata) {
      return null;
    }

    // Se modelo não carregado, retornar mock
    if (!this.model || !this.tf) {
      return this.mockInference();
    }

    const startTime = performance.now();

    try {
      // Criar tensor de entrada
      const inputTensor = this.tf.tensor3d(buffer);

      // Executar predição
      const outputTensor = this.model.predict(inputTensor) as TensorLike;

      // Extrair predições
      const predictions = await outputTensor.data();

      // Cleanup tensors
      inputTensor.dispose();
      outputTensor.dispose();

      // Encontrar classe com maior probabilidade
      let maxIndex = 0;
      let maxProb = predictions[0];
      for (let i = 1; i < predictions.length; i++) {
        if (predictions[i] > maxProb) {
          maxProb = predictions[i];
          maxIndex = i;
        }
      }

      const inferenceTime = performance.now() - startTime;
      this._lastInferenceTime.set(inferenceTime);

      return {
        predictions: Array.from(predictions as ArrayLike<number>),
        predictedClassIndex: maxIndex,
        predictedClass: this.metadata.classes[maxIndex] || 'UNKNOWN',
        confidence: maxProb,
        inferenceTime,
      };
    } catch (err) {
      console.error('[ModelInference] Inference error:', err);
      return null;
    }
  }

  /**
   * Inferência mock para quando modelo não está disponível
   */
  private mockInference(): InferenceResult {
    const classes = [...GESTURE_LABELS];
    const randomIndex = Math.floor(Math.random() * classes.length);
    const confidence = 0.5 + Math.random() * 0.4; // 50-90%

    return {
      predictions: classes.map((_, i) => (i === randomIndex ? confidence : (1 - confidence) / (classes.length - 1))),
      predictedClassIndex: randomIndex,
      predictedClass: classes[randomIndex] || 'MOCK',
      confidence,
      inferenceTime: 5 + Math.random() * 10,
    };
  }

  /**
   * Verifica se o resultado passa no threshold de confiança
   */
  isConfident(result: InferenceResult): boolean {
    return result.confidence >= this.minConfidence();
  }

  private loadTfjs(): Promise<TF> {
    if (this.tf) return Promise.resolve(this.tf);
    if (this.tfLoadPromise) return this.tfLoadPromise;

    this.tfLoadPromise = new Promise<TF>((resolve, reject) => {
      const existing = (globalThis as Record<string, unknown>)['tf'];
      if (this.isTf(existing)) {
        this.tf = existing;
        resolve(existing);
        return;
      }

      // SSR / ambientes sem DOM
      if (typeof document === 'undefined') {
        reject(new Error('TensorFlow.js requires a browser environment'));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
      script.async = true;
      script.onload = () => {
        const tfCandidate = (globalThis as Record<string, unknown>)['tf'];
        if (!this.isTf(tfCandidate)) {
          reject(new Error('TensorFlow.js loaded but global tf was not found'));
          return;
        }
        this.tf = tfCandidate;
        resolve(tfCandidate);
      };
      script.onerror = () => reject(new Error('Failed to load TensorFlow.js from CDN'));
      document.head.appendChild(script);
    }).catch(err => {
      // permitir novo retry caso falhe
      this.tfLoadPromise = null;
      throw err;
    });

    return this.tfLoadPromise;
  }

  private isTf(value: unknown): value is TF {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v['loadLayersModel'] === 'function' &&
      typeof v['tensor3d'] === 'function' &&
      typeof v['zeros'] === 'function'
    );
  }

  /**
   * Libera recursos do modelo
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this._isReady.set(false);
  }
}
