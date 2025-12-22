/**
 * useModelInference Hook
 *
 * Custom React hook para carregamento e execução do modelo TensorFlow.js
 * para reconhecimento de gestos em tempo real.
 *
 * @module hooks/useModelInference
 * @category AI Pipeline
 *
 * @example
 * ```tsx
 * function GestureRecognitionPipeline() {
 *   const { isReady: bufferReady, getInferenceData } = useGestureBuffer()
 *   const { isReady: modelReady, runInference } = useModelInference()
 *
 *   useEffect(() => {
 *     if (bufferReady && modelReady) {
 *       const buffer = getInferenceData()
 *       if (buffer) {
 *         runInference(buffer).then(result => {
 *           if (result) {
 *             console.log('Predicted gesture:', result.predictedClass)
 *           }
 *         })
 *       }
 *     }
 *   }, [bufferReady, modelReady, getInferenceData, runInference])
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'

/**
 * Resultado de uma inferência do modelo
 */
export interface InferenceResult {
  /** Array com 61 probabilidades (uma para cada classe) */
  predictions: number[]
  /** Índice da classe predita (0-60) */
  predictedClass: number
  /** Confiança da predição (0-1) */
  confidence: number
  /** Tempo de inferência em milissegundos */
  inferenceTime: number
}

/**
 * Configuração do hook useModelInference
 */
export interface ModelInferenceConfig {
  /** Caminho para o arquivo model.json (padrão: '/models/model.json') */
  modelPath?: string
  /** Executar warmup na inicialização (padrão: true) */
  warmup?: boolean
}

/**
 * Estado do hook useModelInference
 */
export interface UseModelInferenceState {
  /** Modelo está carregando */
  isLoading: boolean
  /** Modelo está pronto para inferência */
  isReady: boolean
  /** Mensagem de erro (ou null) */
  error: string | null
  /** Tempo da última inferência em ms */
  lastInferenceTime: number
  /** Modelo foi carregado */
  modelLoaded: boolean
}

/**
 * Controles do hook useModelInference
 */
export interface UseModelInferenceControls {
  /** Carrega o modelo manualmente */
  loadModel: () => Promise<void>
  /** Executa inferência com buffer de dados */
  runInference: (buffer: number[][][]) => Promise<InferenceResult | null>
  /** Executa warmup do modelo */
  warmup: () => Promise<void>
}

export type UseModelInferenceReturn = UseModelInferenceState & UseModelInferenceControls

const DEFAULT_CONFIG: Required<ModelInferenceConfig> = {
  modelPath: '/models/model.json',
  warmup: true,
}

/**
 * Hook customizado para inferência com modelo TensorFlow.js
 *
 * @param config - Configuração opcional do hook
 * @returns Estado e controles de inferência
 */
export function useModelInference(config?: ModelInferenceConfig): UseModelInferenceReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastInferenceTime, setLastInferenceTime] = useState(0)
  const [modelLoaded, setModelLoaded] = useState(false)

  // Referência para o modelo carregado
  const modelRef = useRef<tf.LayersModel | null>(null)


  /**
   * Carrega o modelo TensorFlow.js
   */
  const loadModel = useCallback(async (): Promise<void> => {
    if (modelRef.current) {
      // Modelo já carregado
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Carregar modelo de /public/models
      const model = await tf.loadLayersModel(finalConfig.modelPath)

      // Verificar se o modelo tem a arquitetura esperada
      if (!model.inputs || model.inputs.length === 0) {
        throw new Error('Modelo não tem entradas definidas')
      }

      if (!model.outputs || model.outputs.length === 0) {
        throw new Error('Modelo não tem saídas definidas')
      }

      // Cache do modelo
      modelRef.current = model
      setModelLoaded(true)
      setIsReady(true)

      // Cache do modelo
      modelRef.current = model
      setModelLoaded(true)
      setIsReady(true)

      // Executar warmup se configurado
      if (finalConfig.warmup) {
        // Não aguardar warmup para não bloquear
        warmup().catch(err => console.warn('Warmup failed:', err))
      }
    } catch (err) {
      console.error('Erro ao carregar modelo TensorFlow.js:', err)

      let errorMessage = 'Falha ao carregar modelo de gestos'

      if (err instanceof Error) {
        if (err.message.includes('404')) {
          errorMessage = 'Arquivo do modelo não encontrado. Verifique se o modelo foi convertido.'
        } else if (err.message.includes('network')) {
          errorMessage = 'Erro de rede ao carregar modelo. Verifique sua conexão.'
        } else if (err.message.includes('WebGL')) {
          errorMessage = 'WebGL não disponível. Atualize seu navegador.'
        } else {
          errorMessage = `Erro no modelo: ${err.message}`
        }
      }

      setError(errorMessage)
      setIsReady(false)
    } finally {
      setIsLoading(false)
    }
  }, [finalConfig.modelPath, finalConfig.warmup])

  /**
   * Executa warmup do modelo com dados dummy
   */
  const warmup = useCallback(async (): Promise<void> => {
    if (!modelRef.current) {
      return
    }

    try {
      // Criar tensor dummy com shape [1, 30, 126]
      const dummyInput = tf.zeros([1, 30, 126], 'float32')

      // Executar inferência dummy
      const warmupStart = performance.now()
      const dummyOutput = modelRef.current.predict(dummyInput) as tf.Tensor
      await dummyOutput.data() // Forçar avaliação

      const warmupTime = performance.now() - warmupStart
      console.log(`Model warmup completed in ${warmupTime.toFixed(2)}ms`)

      // Cleanup
      dummyInput.dispose()
      dummyOutput.dispose()
    } catch (err) {
      console.warn('Model warmup failed:', err)
      // Não é erro crítico, continuar
    }
  }, [])

  /**
   * Executa inferência com dados do buffer
   *
   * @param buffer - Buffer com shape [1, 30, 126]
   * @returns Resultado da inferência ou null se erro
   */
  const runInference = useCallback(async (buffer: number[][][]): Promise<InferenceResult | null> => {
    if (!modelRef.current) {
      // Carregar modelo se ainda não foi carregado
      await loadModel()
    }

    if (!modelRef.current || !isReady) {
      console.warn('Modelo não está pronto para inferência')
      return null
    }

    try {
      // Validar shape do buffer
      if (!Array.isArray(buffer) || buffer.length !== 1) {
        throw new Error('Buffer deve ter shape [1, 30, 126] - batch size deve ser 1')
      }

      if (!Array.isArray(buffer[0]) || buffer[0].length !== 30) {
        throw new Error('Buffer deve ter shape [1, 30, 126] - deve ter 30 timesteps')
      }

      if (!Array.isArray(buffer[0][0]) || buffer[0][0].length !== 126) {
        throw new Error('Buffer deve ter shape [1, 30, 126] - deve ter 126 features')
      }

      // Converter buffer para tensor TensorFlow
      const inputTensor = tf.tensor(buffer, [1, 30, 126], 'float32')

      // Executar inferência
      const inferenceStart = performance.now()
      const outputTensor = modelRef.current.predict(inputTensor) as tf.Tensor
      const predictions = await outputTensor.data()
      const inferenceTime = performance.now() - inferenceStart

      // Converter para array regular
      const predictionsArray = Array.from(predictions)

      // Encontrar classe com maior probabilidade
      let maxProb = -1
      let predictedClass = -1

      for (let i = 0; i < predictionsArray.length; i++) {
        if (predictionsArray[i] > maxProb) {
          maxProb = predictionsArray[i]
          predictedClass = i
        }
      }

      // Atualizar métricas
      setLastInferenceTime(inferenceTime)

      // Avisar se inferência está lenta
      if (inferenceTime > 50) {
        console.warn(`Inferência lenta: ${inferenceTime.toFixed(2)}ms (meta: <50ms)`)
      }

      // Cleanup de tensores
      inputTensor.dispose()
      outputTensor.dispose()

      return {
        predictions: predictionsArray,
        predictedClass,
        confidence: maxProb,
        inferenceTime,
      }
    } catch (err) {
      console.error('Erro durante inferência:', err)

      let errorMessage = 'Erro durante reconhecimento de gestos'

      if (err instanceof Error) {
        if (err.message.includes('shape')) {
          errorMessage = 'Formato de dados inválido para o modelo'
        } else if (err.message.includes('memory')) {
          errorMessage = 'Memória insuficiente para executar modelo'
        } else {
          errorMessage = `Erro de inferência: ${err.message}`
        }
      }

      setError(errorMessage)
      return null
    }
  }, [isReady, loadModel])

  return {
    isLoading,
    isReady,
    error,
    lastInferenceTime,
    modelLoaded,
    loadModel,
    runInference,
    warmup,
  }
}

