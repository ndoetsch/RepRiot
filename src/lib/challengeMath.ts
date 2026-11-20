// Challenge math with no database calls, so it is easy to test.
import type { Challenge, ChallengeParticipant, ChallengeVote, SetLog } from './types'

type LogLite = Pick<SetLog, 'user_id' | 'local_date'>

/** Sets per person between two days (inclusive). Pure, so it's easy to test. */
export function setsBetween(logs: LogLite[], from: string, to: string): Map<string, number> {
  const out = new Map<string, number>()
  for (const l of logs) if (l.local_date >= from && l.local_date <= to) out.set(l.user_id, (out.get(l.user_id) ?? 0) + 1)
  return out
}

/** Votes needed for a gauntlet to pass: more than half the squad. */
export function votesNeeded(memberCount: number): number {
  return Math.floor(memberCount / 2) + 1
}

export type Tally = { yes: number; no: number; needed: number }

export function tally(votes: Pick<ChallengeVote, 'vote'>[], memberCount: number): Tally {
  return {
    yes: votes.filter((v) => v.vote).length,
    no: votes.filter((v) => !v.vote).length,
    needed: votesNeeded(memberCount),
  }
}

/** Who's taking part: everyone for a gauntlet once it passes, opted-in people for a dare. */
export function takingPart(c: Challenge, memberIds: string[], participants: ChallengeParticipant[]): string[] {
  if (c.kind === 'open') return participants.filter((p) => p.challenge_id === c.id).map((p) => p.user_id)
  return memberIds
}
