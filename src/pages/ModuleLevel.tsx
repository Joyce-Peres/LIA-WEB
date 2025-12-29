import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { AuthSession } from '@/lib/auth'
import { getSession } from '@/lib/auth'
import { mockModules, sectionIcons } from '@/data/mockContent'
import { MockContentUtils } from '@/data/mockContent'
import type { Lesson, Module } from '@/types/database'

export function ModuleLevelPage() {
  const navigate = useNavigate()
  const { moduleId, level } = useParams<{ moduleId: string; level: string }>()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const current = getSession()
      setSession(current)

      if (!current) {
        navigate('/login', { replace: true })
        return
      }

      if (!moduleId || !level) {
        navigate('/dashboard', { replace: true })
        return
      }

      const levelNumber = parseInt(level, 10)
      if (isNaN(levelNumber)) {
        navigate('/dashboard', { replace: true })
        return
      }

      const foundModule = mockModules.find(m => m.id === moduleId)
      if (!foundModule) {
        navigate('/dashboard', { replace: true })
        return
      }

      const levelLessons = MockContentUtils.getLessonsForModuleAndLevel(moduleId, levelNumber)
      if (!levelLessons.length) {
        navigate('/dashboard', { replace: true })
        return
      }

      setModule(foundModule)
      setLessons(levelLessons)
      setIsLoading(false)
    }

    void load()
  }, [navigate, moduleId, level])

  const handleStartPractice = () => {
    if (lessons.length > 0) {
      // Navigate to practice with the first lesson of this level
      navigate(`/practice/${lessons[0].id}`)
    }
  }

  const handlePracticeLesson = (lessonId: string) => {
    navigate(`/practice/${lessonId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-sm text-gray-600">Carregando nível...</div>
        </div>
      </div>
    )
  }

  if (!session || !module) {
    return null
  }

  const icon = sectionIcons[module.id] || { emoji: '📚', label: module.title }
  const levelNumber = parseInt(level || '1', 10)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(`/modules/${module.slug}`)}
            className="text-purple-600 hover:text-purple-800 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Voltar aos Níveis
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">{icon.emoji}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-purple-700">{module.title}</h1>
              <p className="text-gray-600">Nível {level} • {lessons.length} gestos</p>
            </div>
          </div>
        </div>

        {/* Gestures in this level */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Gestos deste Nível
          </h2>

          <div className="flex flex-wrap gap-3 mb-6">
            {lessons.map((lesson) => (
              <span
                key={lesson.id}
                className="inline-flex items-center px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-purple-700 font-medium"
              >
                {lesson.gestureName}
              </span>
            ))}
          </div>

          {/* Start Practice Button */}
          <button
            type="button"
            onClick={handleStartPractice}
            className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            🎯 Começar Prática
          </button>
        </div>

        {/* Lessons Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lições Individuais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600">{lesson.gestureName}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lesson.displayName}</h3>
                      <p className="text-xs text-gray-500">{lesson.xpReward} XP</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    📖 Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePracticeLesson(lesson.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    🎯 Praticar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation between levels */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <button
            type="button"
            disabled={levelNumber <= 1}
            onClick={() => navigate(`/modules/${moduleId}/level/${levelNumber - 1}`)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              levelNumber <= 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            ← Nível Anterior
          </button>

          <span className="text-gray-600 font-medium">
            Nível {levelNumber}
          </span>

          <button
            type="button"
            onClick={() => navigate(`/modules/${moduleId}/level/${levelNumber + 1}`)}
            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors"
          >
            Próximo Nível →
          </button>
        </div>

        {lessons.length === 0 && (
          <div className="text-center text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg py-10">
            Nenhuma lição disponível neste nível.
          </div>
        )}
      </div>
    </div>
  )
}