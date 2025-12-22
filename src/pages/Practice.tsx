/**
 * Practice Page
 *
 * Main practice screen where users perform gesture recognition exercises.
 * Features camera feed, reference video, controls, and real-time feedback.
 *
 * @module pages/Practice
 * @category Pages
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/practice/:lessonId" element={<Practice />} />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contentRepository } from '../repositories/contentRepository'
import { CameraFrame, HandLandmark } from '../components/practice/CameraFrame'
import type { LessonWithModule } from '../types/database'

/**
 * Practice state management
 */
type PracticeState = 'ready' | 'active' | 'paused' | 'completed'

/**
 * Prediction result from gesture recognition
 */
interface PredictionResult {
  gesture: string
  confidence: number
  timestamp: number
  isCorrect: boolean
}

/**
 * Video dimensions interface
 */
interface VideoDimensions {
  width: number
  height: number
}

/**
 * Loading skeleton for practice page
 */
function PracticeSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="aspect-video bg-gray-200 rounded-lg"></div>
          </div>

          {/* Reference skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Controls skeleton */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error state component
 */
function PracticeError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar prática
          </h2>

          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tentar novamente
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Practice header with navigation and lesson info
 */
function PracticeHeader({ lesson }: { lesson: LessonWithModule | null }) {
  const navigate = useNavigate()

  if (!lesson) return null

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-4">
          <button
            onClick={() => navigate('/')}
            className="hover:text-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <span className="mx-2">›</span>
          <button
            onClick={() => navigate('/modules')}
            className="hover:text-blue-600 transition-colors"
          >
            Módulos
          </button>
          <span className="mx-2">›</span>
          <button
            onClick={() => navigate(`/modules/${lesson.module.slug}`)}
            className="hover:text-blue-600 transition-colors"
          >
            {lesson.module.title}
          </button>
          <span className="mx-2">›</span>
          <button
            onClick={() => navigate(`/lessons/${lesson.id}`)}
            className="hover:text-blue-600 transition-colors"
          >
            {lesson.displayName}
          </button>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Prática</span>
        </nav>

        {/* Lesson info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Praticando: {lesson.displayName}
            </h1>
            <p className="text-gray-600">
              Sinal: <span className="font-medium">{lesson.gestureName}</span>
              {' • '}
              Módulo: <span className="font-medium">{lesson.module.title}</span>
            </p>
          </div>

          {/* XP reward badge */}
          <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="text-sm font-medium text-yellow-800">Recompensa</div>
                <div className="text-xl font-bold text-yellow-900">{lesson.xpReward} XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Camera section with practice instructions
 */
function CameraSection({
  lesson,
  practiceState,
  onLandmarksDetected
}: {
  lesson: LessonWithModule | null
  practiceState: PracticeState
  onLandmarksDetected: (landmarks: HandLandmark[][], dimensions: VideoDimensions) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Sua Prática
        </h2>
        <p className="text-gray-600 text-sm">
          Posicione sua mão na câmera e pratique o sinal "{lesson?.gestureName}".
          Mantenha a mão visível e bem iluminada.
        </p>
      </div>

      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <CameraFrame
          className="w-full h-full"
          onLandmarksDetected={onLandmarksDetected}
        />

        {/* Practice state overlay */}
        {practiceState === 'ready' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">👋</div>
              <p className="text-lg font-medium mb-2">Pronto para começar?</p>
              <p className="text-sm opacity-90">Clique em "Começar Prática" quando estiver preparado</p>
            </div>
          </div>
        )}

        {practiceState === 'paused' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-3xl mb-2">⏸️</div>
              <p className="font-medium">Prática pausada</p>
            </div>
          </div>
        )}

        {practiceState === 'completed' && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-medium">Prática concluída!</p>
            </div>
          </div>
        )}

        {/* Active practice indicator */}
        {practiceState === 'active' && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            🎥 Ativo
          </div>
        )}
      </div>

      {/* Practice tips */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Dicas para praticar:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Mantenha a mão relaxada e natural</li>
          <li>• Foque na precisão dos movimentos</li>
          <li>• Pratique lentamente no início</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Reference section with video and current prediction
 */
function ReferenceSection({
  lesson,
  currentPrediction
}: {
  lesson: LessonWithModule | null
  currentPrediction: PredictionResult | null
}) {
  return (
    <div className="space-y-6">
      {/* Reference Video */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vídeo de Referência
        </h3>

        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {lesson?.videoRefUrl ? (
            <video
              src={lesson.videoRefUrl}
              controls
              className="w-full h-full object-contain"
              poster="/images/video-poster.png"
            >
              <source src={lesson.videoRefUrl} type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🎥</div>
                <p className="font-medium">Vídeo não disponível</p>
                <p className="text-sm">Consulte as instruções da lição</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Prediction Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Reconhecimento Atual
        </h3>

        <div className="text-center">
          {currentPrediction ? (
            <div className={`p-4 rounded-lg ${
              currentPrediction.isCorrect
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-2xl mb-2 ${
                currentPrediction.isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentPrediction.isCorrect ? '✅' : '❌'}
              </div>

              <div className={`text-lg font-medium mb-1 ${
                currentPrediction.isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {currentPrediction.gesture}
              </div>

              <div className="text-sm text-gray-600">
                Confiança: {Math.round(currentPrediction.confidence * 100)}%
              </div>

              {currentPrediction.isCorrect && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Correto! Continue praticando.
                </div>
              )}
            </div>
          ) : (
            <div className="py-8">
              <div className="text-3xl mb-2 text-gray-400">🤔</div>
              <p className="text-gray-600">Aguardando detecção de gestos...</p>
              <p className="text-sm text-gray-500 mt-1">
                Posicione sua mão na câmera para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Controls section with practice management buttons
 */
function ControlsSection({
  practiceState,
  onStart,
  onStop,
  onReset
}: {
  practiceState: PracticeState
  onStart: () => void
  onStop: () => void
  onReset: () => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Controles da Prática
      </h3>

      <div className="flex flex-wrap gap-3">
        {practiceState === 'ready' && (
          <button
            onClick={onStart}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg hover:shadow-xl"
          >
            ▶️ Começar Prática
          </button>
        )}

        {practiceState === 'active' && (
          <button
            onClick={onStop}
            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 active:bg-yellow-800 transition-colors"
          >
            ⏸️ Pausar
          </button>
        )}

        {practiceState === 'paused' && (
          <>
            <button
              onClick={onStart}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              ▶️ Continuar
            </button>

            <button
              onClick={onReset}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors"
            >
              🔄 Reiniciar
            </button>
          </>
        )}

        {practiceState === 'completed' && (
          <div className="w-full text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-green-600 font-medium text-lg mb-2">
              Parabéns! Você concluiu a prática!
            </p>
            <p className="text-gray-600 mb-4">
              Você ganhou {10} XP por completar esta lição.
            </p>
            <button
              onClick={onReset}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              🔄 Praticar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Practice stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">30</div>
            <div className="text-sm text-gray-600">Segundos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-600">Tentativas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-gray-600">Corretas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">75%</div>
            <div className="text-sm text-gray-600">Precisão</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Practice page component
 */
export function Practice() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()

  // State management
  const [lesson, setLesson] = useState<LessonWithModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [practiceState, setPracticeState] = useState<PracticeState>('ready')
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null)

  /**
   * Load lesson data
   */
  const loadLesson = async () => {
    if (!lessonId) {
      setError('ID da lição não fornecido')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Loading lesson for practice:', lessonId)
      const lessonData = await contentRepository.getLessonById(lessonId)

      if (!lessonData) {
        setError('Lição não encontrada')
        return
      }

      console.log('Loaded lesson for practice:', lessonData.displayName)
      setLesson(lessonData)
    } catch (err) {
      console.error('Failed to load lesson for practice:', err)
      setError('Erro ao carregar lição. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle landmarks detected from camera
   */
  const handleLandmarksDetected = useCallback((
    landmarks: HandLandmark[][],
    dimensions: VideoDimensions
  ) => {
    if (practiceState !== 'active' || !lesson) return

    // Placeholder gesture recognition logic
    // In a real implementation, this would use the ML model
    const hasHand = landmarks.length > 0 && landmarks[0].length > 0

    if (hasHand) {
      // Simulate gesture recognition with some randomness
      const isCorrect = Math.random() > 0.7 // 30% chance of correct recognition
      const confidence = Math.random() * 0.5 + 0.5 // 50-100% confidence

      setCurrentPrediction({
        gesture: isCorrect ? lesson.gestureName : 'Outro sinal',
        confidence,
        timestamp: Date.now(),
        isCorrect,
      })

      // Check for practice completion (5 correct gestures)
      // This is simplified - in reality, you'd track over time
      if (isCorrect && Math.random() > 0.8) {
        setPracticeState('completed')
      }
    } else {
      setCurrentPrediction(null)
    }
  }, [practiceState, lesson])

  /**
   * Practice control handlers
   */
  const handleStartPractice = () => {
    setPracticeState('active')
    setCurrentPrediction(null)
  }

  const handleStopPractice = () => {
    setPracticeState('paused')
  }

  const handleResetPractice = () => {
    setPracticeState('ready')
    setCurrentPrediction(null)
  }

  // Load lesson on mount and when lessonId changes
  useEffect(() => {
    loadLesson()
  }, [lessonId])

  // Show loading state
  if (loading) {
    return <PracticeSkeleton />
  }

  // Show error state
  if (error || !lesson) {
    return <PracticeError error={error || 'Lição não encontrada'} onRetry={loadLesson} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PracticeHeader lesson={lesson} />

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="order-1 lg:order-1">
            <CameraSection
              lesson={lesson}
              practiceState={practiceState}
              onLandmarksDetected={handleLandmarksDetected}
            />
          </div>

          {/* Reference Section */}
          <div className="order-2 lg:order-2">
            <ReferenceSection
              lesson={lesson}
              currentPrediction={currentPrediction}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="order-3 lg:col-span-2 lg:order-3 mt-8">
          <ControlsSection
            practiceState={practiceState}
            onStart={handleStartPractice}
            onStop={handleStopPractice}
            onReset={handleResetPractice}
          />
        </div>
      </div>
    </div>
  )
}

export default Practice
