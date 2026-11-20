import { useCallback, useEffect, useState } from 'react'
import { JOKES } from './content/jokes'
import type { Channel, ChannelViewProps } from './types'

async function fetchJoke(): Promise<string> {
  try {
    const res = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    const body = (await res.json()) as { joke?: string }
    if (body.joke) return body.joke
  } catch {
    /* fall back to the built-in list */
  }
  return JOKES[Math.floor(Math.random() * JOKES.length)]
}

function JokesView({ say }: ChannelViewProps) {
  const [joke, setJoke] = useState<string | null>(null)
  const next = useCallback(() => {
    setJoke(null)
    void fetchJoke().then(setJoke)
  }, [])

  useEffect(next, [next])
  useEffect(() => {
    if (joke) say(joke)
  }, [joke, say])

  return (
    <div className="channel-card">
      <span className="eyebrow">😂 Rep & groan</span>
      <p className="channel-body big-quote" aria-live="polite">{joke ?? '…'}</p>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 'auto', alignSelf: 'center' }} onClick={next}>Another one</button>
    </div>
  )
}

export const jokes: Channel = {
  id: 'jokes',
  name: 'Dad jokes',
  emoji: '😂',
  blurb: 'Groan-worthy jokes between reps',
  shelf: 'Laugh',
  View: JokesView,
}
