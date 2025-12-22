/**
 * LessonDetail Page
 *
 * Detailed view of a specific lesson with video reference, description,
 * and practice initiation. Bridge between content discovery and practice.
 *
 * @module pages/LessonDetail
 * @category Pages
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/lessons/:lessonId" element={<LessonDetail />} />
 * ```
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contentRepository } from '../repositories/contentRepository'
import type { LessonWithModule } from '../types/database'

/**
 * Loading skeleton for lesson detail page
 */
function LessonDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video skeleton */}
          <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>

          {/* Details skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Action skeleton */}
        <div className="mt-8 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  )
}

/**
 * Error state component
 */
function LessonDetailError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar lição
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
 * Video player component for lesson reference
 */
function VideoPlayer({ videoUrl, title }: { videoUrl: string | null; title: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
  }, [videoUrl])

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎥</span>
          </div>
          <p className="font-medium">Vídeo de referência</p>
          <p className="text-sm mt-1">não disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      {loading && !error && (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p className="font-medium">Erro ao carregar vídeo</p>
            <p className="text-sm mt-1 opacity-75">Tente atualizar a página</p>
          </div>
        </div>
      ) : (
        <video
          className="w-full h-full object-contain"
          controls
          preload="metadata"
          poster="/images/video-poster.png"
          onLoadStart={() => setLoading(true)}
          onLoadedData={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
          title={title}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          Seu navegador não suporta vídeos. Você pode
          <a href={videoUrl} className="text-blue-400 underline ml-1">
            baixar o vídeo
          </a>
          diretamente.
        </video>
      )}
    </div>
  )
}

/**
 * Lesson header with breadcrumb navigation
 */
function LessonDetailHeader({ lesson }: { lesson: LessonWithModule }) {
  const navigate = useNavigate()

  return (
    <div className="mb-8">
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
        <span className="text-gray-900 font-medium">{lesson.displayName}</span>
      </nav>

      {/* Title and meta */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {lesson.displayName}
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Sinal: <span className="font-medium text-gray-900">{lesson.gestureName}</span>
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Módulo: {lesson.module.title}</span>
            <span>•</span>
            <span>Dificuldade: {lesson.module.difficultyLevel}</span>
            <span>•</span>
            <span>Lição {lesson.orderIndex}</span>
          </div>
        </div>

        {/* XP Badge */}
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-sm font-medium text-yellow-800">Recompensa</div>
              <div className="text-lg font-bold text-yellow-900">{lesson.xpReward} XP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Lesson details section
 */
function LessonDetailsSection({ lesson }: { lesson: LessonWithModule }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sobre esta lição
        </h2>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Aprenda a fazer o sinal <strong>"{lesson.gestureName}"</strong> em Libras.
            Este sinal é parte do módulo <strong>{lesson.module.title}</strong> e
            representa um conceito fundamental da comunicação visual.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Observe atentamente o vídeo de referência e pratique a posição das mãos,
            a orientação dos dedos e a expressão facial que acompanham este sinal.
          </p>
        </div>
      </div>

      {/* Practice objectives */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          🎯 Objetivos da prática
        </h3>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </span>
            <span className="text-blue-800">
              Praticar a posição correta das mãos para o sinal "{lesson.gestureName}"
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </span>
            <span className="text-blue-800">
              Manter o sinal por pelo menos 30 segundos consecutivos
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </span>
            <span className="text-blue-800">
              Alcançar precisão de pelo menos {lesson.minConfidenceThreshold * 100}% na detecção
            </span>
          </li>
        </ul>
      </div>

      {/* Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          💡 Dicas para praticar
        </h3>

        <div className="space-y-3 text-green-800">
          <p>• Posicione-se em um local bem iluminado para melhor detecção</p>
          <p>• Mantenha as mãos visíveis na câmera durante toda a prática</p>
          <p>• Pratique lentamente no início, focando na precisão</p>
          <p>• Observe sua expressão facial - ela é parte importante do sinal</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Action section with start practice button
 */
function LessonActionSection({
  lesson,
  locked,
  onStartPractice
}: {
  lesson: LessonWithModule
  locked: boolean
  onStartPractice: () => void
}) {
  if (locked) {
    const requirements = [
      'Completar a lição anterior',
      'Alcançar pelo menos 70% de precisão nas lições anteriores',
      `Ter pelo menos ${lesson.xpReward * 2} XP acumulados`
    ]

    return (
      <div className="mt-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Esta lição está bloqueada
              </h3>
              <p className="text-yellow-700 mb-4">
                Você precisa completar os seguintes requisitos para desbloquear esta lição:
              </p>
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-center text-yellow-700 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Pronto para praticar?
            </h3>
            <p className="text-gray-600 text-sm">
              Ganhe {lesson.xpReward} XP ao completar esta lição com sucesso
            </p>
          </div>

          <button
            onClick={onStartPractice}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
          >
            Começar Prática
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              <span className="font-medium">Tempo estimado:</span> 5-10 minutos
            </span>
            <span>
              <span className="font-medium">Precisão necessária:</span> {Math.round(lesson.minConfidenceThreshold * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main LessonDetail page component
 */
export function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonWithModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      console.log('Loading lesson:', lessonId)
      const lessonData = await contentRepository.getLessonById(lessonId)

      if (!lessonData) {
        setError('Lição não encontrada')
        return
      }

      console.log('Loaded lesson:', lessonData.displayName)
      setLesson(lessonData)
    } catch (err) {
      console.error('Failed to load lesson:', err)
      setError('Erro ao carregar lição. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle start practice button click
   */
  const handleStartPractice = () => {
    if (!lesson) return

    // For now, show placeholder since practice page doesn't exist yet
    alert(`Funcionalidade em desenvolvimento!\n\n🎯 Iniciando prática da lição:\n"${lesson.displayName}"\n\n📹 Sinal: ${lesson.gestureName}\n⭐ Recompensa: ${lesson.xpReward} XP\n🎯 Precisão necessária: ${Math.round(lesson.minConfidenceThreshold * 100)}%\n\nEm breve você poderá praticar com a câmera!`)

    // Future navigation:
    // navigate(`/practice/${lessonId}`)
  }

  /**
   * Check if lesson is locked (placeholder logic)
   */
  const isLessonLocked = (): boolean => {
    if (!lesson) return false

    // Simple placeholder: lock lessons with orderIndex > 3
    // Future: Check actual user progress from database
    return lesson.orderIndex > 3
  }

  // Load lesson on mount and when lessonId changes
  useEffect(() => {
    loadLesson()
  }, [lessonId])

  // Show loading state
  if (loading) {
    return <LessonDetailSkeleton />
  }

  // Show error state
  if (error || !lesson) {
    return <LessonDetailError error={error || 'Lição não encontrada'} onRetry={loadLesson} />
  }

  const locked = isLessonLocked()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <LessonDetailHeader lesson={lesson} />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div>
            <VideoPlayer
              videoUrl={lesson.videoRefUrl}
              title={`Vídeo de referência: ${lesson.displayName}`}
            />
          </div>

          {/* Details Section */}
          <div>
            <LessonDetailsSection lesson={lesson} />
          </div>
        </div>

        {/* Action Section */}
        <LessonActionSection
          lesson={lesson}
          locked={locked}
          onStartPractice={handleStartPractice}
        />
      </div>
    </div>
  )
}

export default LessonDetail
