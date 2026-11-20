import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setsBetween, tally, takingPart, votesNeeded } from '../src/lib/challengeMath'
import type { Challenge } from '../src/lib/types'

test('a gauntlet needs more than half the squad', () => {
  assert.equal(votesNeeded(1), 1)
  assert.equal(votesNeeded(2), 2)
  assert.equal(votesNeeded(3), 2)
  assert.equal(votesNeeded(8), 5)
  assert.equal(votesNeeded(20), 11)
})

test('tally counts yes and no votes', () => {
  assert.deepEqual(tally([{ vote: true }, { vote: false }, { vote: true }], 5), { yes: 2, no: 1, needed: 3 })
})

test('sets are counted per person inside the window only', () => {
  const logs = [
    { user_id: 'a', local_date: '2026-11-19' },
    { user_id: 'a', local_date: '2026-11-20' },
    { user_id: 'a', local_date: '2026-11-21' },
    { user_id: 'b', local_date: '2026-11-21' },
    { user_id: 'b', local_date: '2026-11-25' },
  ]
  const s = setsBetween(logs, '2026-11-20', '2026-11-24')
  assert.equal(s.get('a'), 2)
  assert.equal(s.get('b'), 1)
})

test('dares only include people who opted in; gauntlets include everyone', () => {
  const base = { id: 'c1', crew_id: 'x', created_by: 'a', title: 't', goal: 5, start_date: '', end_date: '', stakes: '', created_at: '', status: 'active', length_days: 7, details: '' } as const
  const dare: Challenge = { ...base, kind: 'open' }
  const gauntlet: Challenge = { ...base, kind: 'gauntlet' }
  const parts = [{ challenge_id: 'c1', user_id: 'b' }, { challenge_id: 'other', user_id: 'c' }]
  assert.deepEqual(takingPart(dare, ['a', 'b', 'c'], parts), ['b'])
  assert.deepEqual(takingPart(gauntlet, ['a', 'b', 'c'], parts), ['a', 'b', 'c'])
})
