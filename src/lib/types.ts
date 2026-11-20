export type Profile = {
  id: string
  display_name: string
  bio: string
  bio_public: boolean
  goals: string[]
  goals_public: boolean
  gif_themes: string[]
  avatar_url: string | null
  onboarded: boolean
}

export type Crew = {
  id: string
  name: string
  invite_code: string
  created_by: string
}

export type Exercise = {
  id: string
  crew_id: string
  user_id: string
  name: string
  mode: 'reps' | 'seconds'
  amount: number
  tutorial: string
  modifier: string
  media_type: 'giphy' | 'upload'
  media_url: string
  media_still_url: string | null
  media_title: string
  active: boolean
  created_at: string
}

export type SetLog = {
  id: string
  crew_id: string
  exercise_id: string
  user_id: string
  local_date: string
  quick_log: boolean
  logged_at: string
}

export type Reaction = {
  log_id: string
  user_id: string
  emoji: string
}

export const REACTIONS = ['🔥', '💪', '😂', '👏'] as const
export const SETS_PER_DAY = 3
export const MAX_CREW = 5

export type Challenge = {
  id: string
  crew_id: string
  created_by: string
  title: string
  kind: 'points' | 'crew_goal'
  goal: number | null
  start_date: string
  end_date: string
  stakes: string
  created_at: string
}

export type ChatMessage = {
  id: string
  crew_id: string
  user_id: string
  body: string
  gif_url: string | null
  created_at: string
}

export const POINTS_PER_SET = 10
export const POTLUCK_BONUS = 25
export const FREEZES_PER_MONTH = 3
