export const queryKeys = {
  questions: {
    all: ['questions'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (userId: number) => ['users', 'detail', userId] as const,
  },
  workoutTemplates: {
    all: ['workoutTemplates'] as const,
    detail: (id: number) => ['workoutTemplates', 'detail', id] as const,
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

