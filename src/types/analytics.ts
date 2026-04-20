export type WorkoutRetentionCohortOut = {
  cohort_week: string
  users_count: number
  d7_rate: number
  d30_rate: number
}

export type WorkoutCycleFunnelStepOut = {
  step_key: string
  title: string
  users_count: number
  conversion_from_prev: number
}

export type WorkoutAnalyticsAlertOut = {
  code: string
  severity: 'warning' | 'critical' | string
  title: string
  description: string
}

export type WorkoutAnalyticsSummaryOut = {
  users_total: number
  users_with_profile: number
  users_with_2_cycles: number
  d7_retention_rate: number
  d30_retention_rate: number
  avg_cycle_completion_rate: number
  avg_adherence_score: number
  avg_novelty_ratio: number
  plans_generated_last_30_days: number
  workouts_completed_last_7_days: number
  plans_generated_this_week: number
  plans_generated_prev_week: number
  workouts_completed_this_week: number
  workouts_completed_prev_week: number
  retention_cohorts: WorkoutRetentionCohortOut[]
  cycle_funnel: WorkoutCycleFunnelStepOut[]
  alerts: WorkoutAnalyticsAlertOut[]
}

