import { RULES } from '../config/rules'

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
  /** Just one person playing on their own. */
  solo: boolean
  /** Anyone can find and join it. Private unless the organizer opens it up. */
  is_public: boolean
  /** The organizer's cap: up to 8 when private, up to 20 when public. */
  max_members: number
  description: string
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
export const SETS_PER_DAY = RULES.setsPerDay

export type Challenge = {
  id: string
  crew_id: string
  created_by: string
  title: string
  /**
   * points   : most points wins
   * crew_goal: the squad works toward a number of sets together
   * gauntlet : proposed, debated and voted on by the squad; everyone's in once it passes
   * open     : a dare anyone in the squad can opt into
   */
  kind: 'points' | 'crew_goal' | 'gauntlet' | 'open'
  /** Sets together (crew_goal) or sets each (gauntlet, open). */
  goal: number | null
  status: 'voting' | 'active' | 'rejected'
  length_days: number
  details: string
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

export type ChallengeVote = { challenge_id: string; user_id: string; vote: boolean }
export type ChallengeParticipant = { challenge_id: string; user_id: string }
export type ChallengeComment = { id: string; challenge_id: string; user_id: string; body: string; created_at: string }

export const POINTS_PER_SET = RULES.pointsPerSet
export const POTLUCK_BONUS = RULES.lineupBonus
export const FREEZES_PER_MONTH = RULES.freezesPerMonth
