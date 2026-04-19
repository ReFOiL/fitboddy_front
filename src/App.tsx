import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { SuperuserRoute } from './components/SuperuserRoute'
import { MainLayout } from './components/layout/MainLayout'
import { DashboardPage } from './pages/Dashboard.tsx'
import { LoginPage } from './pages/Login.tsx'
import { QuestionCreatePage, QuestionEditPage, QuestionsPage } from './pages/Questions/index.ts'
import { UserDetailPage, UsersPage } from './pages/Users'
import { ExerciseCreatePage, ExerciseEditPage, ExercisesPage } from './pages/Exercises'
import { AdminAccountsPage } from './pages/AdminAccounts'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/questions/new" element={<QuestionCreatePage />} />
        <Route path="/questions/:id/edit" element={<QuestionEditPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/new" element={<ExerciseCreatePage />} />
        <Route path="/exercises/:id/edit" element={<ExerciseEditPage />} />
        <Route
          path="/admin-accounts"
          element={
            <SuperuserRoute>
              <AdminAccountsPage />
            </SuperuserRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

