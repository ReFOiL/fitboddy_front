export const queryKeys = {
  questions: {
    all: ['questions'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (userId: number) => ['users', 'detail', userId] as const,
  },
}

