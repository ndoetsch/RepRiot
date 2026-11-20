/**
 * The numbers that shape the game. Change them here, and match any that the
 * database also checks in supabase/migrations/0005_reprascal.sql.
 */
export const RULES = {
  /** Biggest a private squad can be. */
  maxPrivateSquad: 8,
  /** Biggest a public squad can be. The organizer picks a cap up to this. */
  maxPublicSquad: 20,
  /** How many moves a solo player can bring (squads bring one each). */
  maxSoloMoves: 5,
  setsPerDay: 3,
  pointsPerSet: 10,
  /** Bonus for doing every move in the lineup in one day. */
  lineupBonus: 25,
  freezesPerMonth: 3,
  /** Gauntlet lengths to choose from, in days. */
  challengeLengths: [3, 7, 14, 30],
} as const
