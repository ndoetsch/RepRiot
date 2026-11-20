import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayPoints, pointsBetween, streakInfo, weeklyPoints, badges } from '../src/lib/score'

const log = (user: string, ex: string, day: string, hour = 12) => ({
  user_id: user,
  exercise_id: ex,
  local_date: day,
  logged_at: new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).toISOString(),
})

test('points: 10 a set, +25 for every potluck exercise in a day', () => {
  assert.equal(dayPoints([log('a', 'x', '2026-11-16')], 2), 10)
  assert.equal(dayPoints([log('a', 'x', '2026-11-16'), log('a', 'y', '2026-11-16')], 2), 45)
  assert.equal(dayPoints([], 2), 0)
})

test('points between dates per person', () => {
  const logs = [log('a', 'x', '2026-11-16'), log('a', 'x', '2026-11-10'), log('b', 'x', '2026-11-16'), log('b', 'y', '2026-11-16')]
  const t = pointsBetween(logs, 2, '2026-11-16', '2026-11-22')
  assert.equal(t.get('a'), 10)
  assert.equal(t.get('b'), 45)
})

test('streak counts days in a row; today missing does not break it', () => {
  const days = new Set(['2026-11-13', '2026-11-14', '2026-11-15'])
  assert.equal(streakInfo(days, '2026-11-16').streak, 3)
  assert.equal(streakInfo(days, '2026-11-16').freezesLeft, 3)
})

test('a missed day uses a freeze and keeps the streak', () => {
  const days = new Set(['2026-11-12', '2026-11-13', '2026-11-15', '2026-11-16'])
  const s = streakInfo(days, '2026-11-16')
  assert.equal(s.streak, 4)
  assert.equal(s.freezesLeft, 2)
  assert.deepEqual(s.frozenDays, ['2026-11-14'])
})

test('more than 3 missed days in a month ends the streak', () => {
  const days = new Set(['2026-11-01', '2026-11-06', '2026-11-07'])
  const s = streakInfo(days, '2026-11-07')
  assert.equal(s.streak, 2)
  assert.equal(s.freezesLeft, 3, 'freezes spent on a streak that broke are not counted')
})

test('freezes reset each month', () => {
  // Oct 29-31 missed (3 Oct freezes), Nov 2 missed (1 Nov freeze)
  const days = new Set(['2026-10-28', '2026-11-01', '2026-11-03'])
  const s = streakInfo(days, '2026-11-03')
  assert.equal(s.streak, 3)
  assert.equal(s.freezesLeft, 2)
})

test('no logs means no streak', () => {
  assert.equal(streakInfo(new Set(), '2026-11-16').streak, 0)
})

test('weekly points run oldest to newest, ending this week', () => {
  const logs = [log('a', 'x', '2026-11-16'), log('a', 'x', '2026-11-09'), log('a', 'x', '2026-11-10')]
  const w = weeklyPoints(logs, 1, '2026-11-18', 3)
  assert.deepEqual(w.map((x) => x.week), ['2026-11-02', '2026-11-09', '2026-11-16'])
  assert.deepEqual(w.map((x) => x.points), [0, 70, 35])
})

test('badges', () => {
  const myLogs = [log('a', 'x', '2026-11-09', 6), log('a', 'y', '2026-11-09', 22)]
  const crewLogs = [...myLogs, log('b', 'x', '2026-11-09')]
  const b = badges('a', { myLogs, crewLogs, exerciseCount: 2, streak: 1, reactionsGiven: 0, today: '2026-11-16' })
  const earned = b.filter((x) => x.earned).map((x) => x.id)
  assert.deepEqual(earned.sort(), ['champ', 'early', 'first', 'owl', 'perfect'].sort())
})

test('a member joining later does not take away bonuses already earned', () => {
  const size = (day: string) => (day < '2026-11-16' ? 1 : 2)
  const logs = [
    { user_id: 'a', exercise_id: 'x', local_date: '2026-11-15', logged_at: '2026-11-15T12:00:00Z' },
    { user_id: 'a', exercise_id: 'x', local_date: '2026-11-16', logged_at: '2026-11-16T12:00:00Z' },
  ]
  const pts = pointsBetween(logs, size, '2026-11-15', '2026-11-16')
  assert.equal(pts.get('a'), 10 + 25 + 10)
})
