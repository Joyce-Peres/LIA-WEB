import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthCallbackPage } from '@/pages/AuthCallback'
import { DashboardPage } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

