/**
 * useCamera Hook
 * 
 * Custom React hook para gerenciar acesso à webcam com controles de start/stop,
 * tratamento de erros e cleanup automático.
 * 
 * @module hooks/useCamera
 * @category AI Pipeline
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { videoRef, isActive, error, startCamera, stopCamera } = useCamera();
 *   
 *   return (
 *     <div>
 *       <video ref={videoRef} autoPlay playsInline muted />
 *       {!isActive && <button onClick={startCamera}>Iniciar</button>}
 *       {isActive && <button onClick={stopCamera}>Parar</button>}
 *       {error && <p className="error">{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Configuração opcional do hook useCamera
 */
export interface CameraConfig {
  /** Frame rate desejado (padrão: 30 FPS para MediaPipe) */
  fps?: number
  /** Largura do vídeo (padrão: 640) */
  width?: number
  /** Altura do vídeo (padrão: 480) */
  height?: number
  /** Câmera frontal ('user') ou traseira ('environment'). Padrão: 'user' */
  facingMode?: 'user' | 'environment'
}

/**
 * Estado da câmera retornado pelo hook
 */
export interface CameraState {
  /** Referência ao elemento <video> do DOM */
  videoRef: React.RefObject<HTMLVideoElement>
  /** Stream de vídeo ativo (ou null se inativo) */
  stream: MediaStream | null
  /** Indica se a câmera está ativa */
  isActive: boolean
  /** Indica se está carregando/inicializando */
  isLoading: boolean
  /** Mensagem de erro (ou null se sem erro) */
  error: string | null
}

/**
 * Controles da câmera retornados pelo hook
 */
export interface CameraControls {
  /** Inicia a captura de vídeo */
  startCamera: () => Promise<void>
  /** Para a captura de vídeo */
  stopCamera: () => void
}

export type UseCameraReturn = CameraState & CameraControls

const DEFAULT_CONFIG: Required<CameraConfig> = {
  fps: 30,
  width: 640,
  height: 480,
  facingMode: 'user',
}

/**
 * Hook customizado para gerenciar acesso à webcam
 * 
 * @param config - Configuração opcional (fps, resolução, facingMode)
 * @returns Estado da câmera e controles (startCamera, stopCamera)
 */
export function useCamera(config?: CameraConfig): UseCameraReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Para a câmera e libera recursos
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
      })
      setStream(null)
    }
    setIsActive(false)
    setError(null)
  }, [stream])

  /**
   * Inicia a câmera com as configurações especificadas
   */
  const startCamera = useCallback(async () => {
    console.log('[useCamera] Starting camera...')
    setIsLoading(true)
    setError(null)

    try {
      // Verifica se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('UNSUPPORTED_BROWSER')
      }

      // Solicita acesso à câmera
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: finalConfig.facingMode,
          frameRate: { ideal: finalConfig.fps },
          width: { ideal: finalConfig.width },
          height: { ideal: finalConfig.height },
        },
        audio: false,
      }

      console.log('[useCamera] Requesting camera access with constraints:', constraints)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('[useCamera] Camera access granted!')

      // Anexa stream ao elemento de vídeo
      if (videoRef.current) {
        console.log('[useCamera] Attaching stream to video element...')
        videoRef.current.srcObject = mediaStream
        
        // Aguarda até que o vídeo esteja pronto
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current
          if (!video) {
            reject(new Error('Video element not found'))
            return
          }

          // Timeout para evitar espera infinita
          const timeout = setTimeout(() => {
            console.warn('[useCamera] Metadata load timeout, proceeding anyway...')
            video.play().catch(() => {})
            resolve()
          }, 5000)

          // Se já tiver metadata, resolve imediatamente
          if (video.readyState >= 1) {
            console.log('[useCamera] Video already has metadata')
            clearTimeout(timeout)
            video.play().catch(() => {})
            resolve()
            return
          }

          video.onloadedmetadata = () => {
            console.log('[useCamera] Video metadata loaded, playing...')
            clearTimeout(timeout)
            video.play().catch(() => {})
            resolve()
          }

          video.onerror = () => {
            console.error('[useCamera] Video error')
            clearTimeout(timeout)
            reject(new Error('Video loading error'))
          }
        })
        console.log('[useCamera] Video ready!')
      }

      setStream(mediaStream)
      setIsActive(true)
      setError(null)
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)

      // Traduz erros para mensagens amigáveis
      let errorMessage = 'Erro ao acessar câmera'

      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera.'
            break
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage = 'Nenhuma câmera encontrada no dispositivo.'
            break
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage = 'Câmera já está em uso por outro aplicativo.'
            break
          case 'OverconstrainedError':
            errorMessage = 'Configurações de câmera não suportadas pelo dispositivo.'
            break
          default:
            if (err.message === 'UNSUPPORTED_BROWSER') {
              errorMessage = 'Navegador não suporta acesso à câmera. Use Chrome, Firefox ou Edge.'
            }
        }
      }

      setError(errorMessage)
      setIsActive(false)
      setStream(null)
    } finally {
      setIsLoading(false)
    }
  }, [finalConfig.facingMode, finalConfig.fps, finalConfig.width, finalConfig.height])

  /**
   * Cleanup: para a câmera ao desmontar o componente
   */
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [stream])

  return {
    videoRef,
    stream,
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera,
  }
}

