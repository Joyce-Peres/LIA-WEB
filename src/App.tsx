import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthCallbackPage } from '@/pages/AuthCallback'
import { DashboardPage } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login'
import { ProfilePage } from '@/pages/Profile'
import { ModuleLevelPage } from '@/pages/ModuleLevel'
import { ModuleLevelsPage } from '@/pages/ModuleLevels'
import { LessonDetail } from '@/pages/LessonDetail'
import { Practice } from '@/pages/Practice'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Module navigation - section levels overview */}
        <Route path="/modules/:moduleSlug" element={<ModuleLevelsPage />} />
        {/* Level within a module - shows lessons for that level */}
        <Route path="/modules/:moduleId/level/:level" element={<ModuleLevelPage />} />
        {/* Lesson detail page */}
        <Route path="/lessons/:lessonId" element={<LessonDetail />} />
        {/* Practice page */}
        <Route path="/practice/:lessonId" element={<Practice />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

