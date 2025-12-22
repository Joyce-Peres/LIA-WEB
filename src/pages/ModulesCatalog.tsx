/**
 * ModulesCatalog Page
 *
 * Main catalog page displaying all available learning modules.
 * Shows modules as interactive cards with progress indicators.
 *
 * @module pages/ModulesCatalog
 * @category Pages
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/modules" element={<ModulesCatalog />} />
 * ```
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Module } from '../types/database'
import { contentRepository } from '../repositories/contentRepository'
import { ModuleCard } from '../components/modules/ModuleCard'

/**
 * Loading skeleton component for modules grid
 */
function ModulesLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Error state component with retry functionality
 */
function ModulesErrorState({
  error,
  onRetry
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>

          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Erro ao carregar módulos
          </h2>

          <p className="text-red-600 mb-6 text-sm">
            {error}
          </p>

          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state component when no modules are available
 */
function ModulesEmptyState() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Nenhum módulo disponível
          </h2>

          <p className="text-gray-600 text-sm">
            No momento não há módulos de aprendizado disponíveis.
            Volte mais tarde para encontrar novos conteúdos.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Main ModulesCatalog page component
 */
export function ModulesCatalog() {
  const navigate = useNavigate()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load modules from repository
   */
  const loadModules = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Loading modules from repository...')
      const data = await contentRepository.getModules()

      console.log(`Loaded ${data.length} modules:`, data.map(m => m.title))
      setModules(data)
    } catch (err) {
      const errorMessage = 'Erro ao carregar módulos. Verifique sua conexão com a internet.'
      setError(errorMessage)
      console.error('Failed to load modules:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle module card click - navigate to module details
   */
  const handleModuleClick = (module: Module) => {
    console.log('Module clicked:', module.title, 'Navigating to:', `/modules/${module.slug}`)

    // For now, show an alert since we don't have the module lessons page yet
    // In the future, this will navigate to the module's lesson list
    alert(`Funcionalidade em desenvolvimento!\n\nMódulo: ${module.title}\nSlug: ${module.slug}\n\nEm breve você poderá ver todas as lições deste módulo.`)

    // Future navigation:
    // navigate(`/modules/${module.slug}`, {
    //   state: { module }
    // })
  }

  // Load modules on component mount
  useEffect(() => {
    loadModules()
  }, [])

  // Show loading state
  if (loading) {
    return <ModulesLoadingSkeleton />
  }

  // Show error state
  if (error) {
    return <ModulesErrorState error={error} onRetry={loadModules} />
  }

  // Show empty state
  if (modules.length === 0) {
    return <ModulesEmptyState />
  }

  // Show modules catalog
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Catálogo de Módulos
          </h1>
          <p className="text-gray-600 text-lg">
            Escolha um módulo para começar sua jornada de aprendizado em Libras
          </p>
        </div>

        {/* Modules Statistics */}
        <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
          <span>{modules.length} módulos disponíveis</span>
          <span>•</span>
          <span>
            {modules.filter(m => m.difficultyLevel === 'iniciante').length} iniciante,
            {modules.filter(m => m.difficultyLevel === 'intermediario').length} intermediário,
            {modules.filter(m => m.difficultyLevel === 'avancado').length} avançado
          </span>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={handleModuleClick}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Continue praticando para desbloquear novos módulos e conteúdos!
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModulesCatalog
