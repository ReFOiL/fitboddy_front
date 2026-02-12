import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'
import { DashboardPage } from './pages/Dashboard.tsx'
import { LoginPage } from './pages/Login.tsx'
import { QuestionCreatePage, QuestionEditPage, QuestionsPage } from './pages/Questions/index.ts'
import { UserDetailPage, UsersPage } from './pages/Users'
import { WorkoutCreatePage, WorkoutEditPage, WorkoutsPage } from './pages/Workouts'
import { ExerciseCreatePage, ExerciseEditPage, ExercisesPage } from './pages/Exercises'

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
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/workouts/new" element={<WorkoutCreatePage />} />
        <Route path="/workouts/:id/edit" element={<WorkoutEditPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/new" element={<ExerciseCreatePage />} />
        <Route path="/exercises/:id/edit" element={<ExerciseEditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

