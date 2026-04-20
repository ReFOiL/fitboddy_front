export const queryKeys = {
  adminAccounts: {
    all: ['adminAccounts'] as const,
  },
  questions: {
    all: ['questions'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (userId: number) => ['users', 'detail', userId] as const,
    trainingPlanActive: (userId: number) => ['users', userId, 'training-plan', 'active'] as const,
    trainingPlansList: (userId: number) => ['users', userId, 'training-plans'] as const,
    trainingPlanDetail: (userId: number, planId: number) => ['users', userId, 'training-plan', planId] as const,
  },
  analytics: {
    workoutSummary: (filters: {
      goal?: string
      level?: string
      workout_location?: string
      equipment?: string
    }) => ['analytics', 'workout-summary', filters] as const,
  },
  exercises: {
    all: ['exercises'] as const,
    detail: (id: number) => ['exercises', 'detail', id] as const,
  },
  muscles: {
    all: ['muscles'] as const,
  },
  contraindications: {
    all: ['contraindications'] as const,
  },
}

