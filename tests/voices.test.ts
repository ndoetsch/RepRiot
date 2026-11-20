import { test } from 'node:test'
import assert from 'node:assert/strict'
import { languageName, pickVoice } from '../src/channels/voices'

const v = (lang: string, name: string, extra: object = {}) => ({ lang, name, ...extra })

test('picks a voice for the exact language and region first', () => {
  const voices = [v('en-US', 'Samantha'), v('de-AT', 'Austrian'), v('de-DE', 'Anna'), v('fr-FR', 'Thomas')]
  assert.equal(pickVoice(voices, 'de-DE')?.name, 'Anna')
  assert.equal(pickVoice(voices, 'fr-FR')?.name, 'Thomas')
})

test('falls back to the same language in another region', () => {
  const voices = [v('en-US', 'Samantha'), v('es-MX', 'Paulina')]
  assert.equal(pickVoice(voices, 'es-ES')?.name, 'Paulina')
})

test('handles Android style language codes', () => {
  assert.equal(pickVoice([v('de_DE', 'Deutsch')], 'de-DE')?.name, 'Deutsch')
})

test('prefers higher quality voices', () => {
  const voices = [v('de-DE', 'Anna'), v('de-DE', 'Anna (Enhanced)'), v('de-DE', 'Google Deutsch')]
  assert.equal(pickVoice(voices, 'de-DE')?.name, 'Anna (Enhanced)')
})

test('never reads German with an English voice', () => {
  assert.equal(pickVoice([v('en-US', 'Samantha', { default: true })], 'de-DE'), null)
  assert.equal(pickVoice([], 'de-DE'), null)
})

test('language names for messages', () => {
  assert.equal(languageName('de-DE'), 'German')
  assert.equal(languageName('es_ES'), 'Spanish')
})
