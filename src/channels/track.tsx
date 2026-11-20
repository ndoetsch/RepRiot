import { useEffect, useState } from 'react'
import type { Channel, ChannelViewProps } from './types'
import { load, save } from './store'

export type Card = {
  title: string
  body: string
  /** Text to read out loud, if different from title + body. */
  say?: string
  /** Language for reading out loud, e.g. 'es-ES'. */
  lang?: string
  /** A small extra line, like a pronunciation hint. */
  hint?: string
}

type TrackSpec = Omit<Channel, 'View' | 'onSetLogged'> & { cards: Card[] }

/**
 * A learning track: a series of bite-size cards, one per set.
 * Each logged set moves you to the next card, so you learn a little over time.
 */
export function trackChannel(spec: TrackSpec): Channel {
  const key = `track.${spec.id}`
  const count = spec.cards.length

  function View({ say }: ChannelViewProps) {
    const [index, setIndex] = useState(() => load<number>(key, 0) % count)
    const card = spec.cards[index]

    useEffect(() => {
      say(card.say ?? `${card.title}. ${card.body}`, card.lang)
    }, [card, say])

    function go(step: number) {
      const next = (index + step + count) % count
      setIndex(next)
      save(key, next)
    }

    return (
      <div className="channel-card">
        <span className="eyebrow">{spec.emoji} {spec.name} · {index + 1} of {count}</span>
        <h2 className="channel-title">{card.title}</h2>
        <p className="channel-body">{card.body}</p>
        {card.hint && <p className="small muted" style={{ margin: 0 }}>{card.hint}</p>}
        <div className="row between" style={{ marginTop: 'auto' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => go(-1)}>Back</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => say(card.say ?? `${card.title}. ${card.body}`, card.lang)} aria-label="Read it again">🔊</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => go(1)}>Next</button>
        </div>
      </div>
    )
  }

  return {
    ...spec,
    View,
    onSetLogged: () => save(key, (load<number>(key, 0) + 1) % count),
  }
}
