import { useEffect, useState } from 'react'
import type { Channel, ChannelViewProps } from './types'

type Item = { text: string; link?: string }

const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/** Today's world headlines from Wikipedia's "In the news" (free, no key needed). */
async function fetchNews(): Promise<Item[]> {
  const d = new Date()
  const ymd = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  const res = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${ymd}`)
  if (!res.ok) throw new Error(String(res.status))
  const body = (await res.json()) as { news?: { story: string; links?: { content_urls?: { mobile?: { page?: string } } }[] }[] }
  return (body.news ?? []).map((n) => ({ text: strip(n.story), link: n.links?.[0]?.content_urls?.mobile?.page }))
}

function NewsView({ say }: ChannelViewProps) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [i, setI] = useState(0)

  useEffect(() => {
    fetchNews().then(setItems).catch(() => setFailed(true))
  }, [])

  const item = items?.[i]
  useEffect(() => {
    if (item) say(item.text)
  }, [item, say])

  return (
    <div className="channel-card">
      <span className="eyebrow">🗞️ In the news{items ? ` · ${i + 1} of ${items.length}` : ''}</span>
      {failed && <p className="channel-body">The news wouldn't load. Check your connection, or switch channels.</p>}
      {!items && !failed && <div className="spinner" aria-label="Loading" />}
      {item && <p className="channel-body" aria-live="polite">{item.text}</p>}
      {item?.link && <a className="small" href={item.link} target="_blank" rel="noreferrer">Read more later</a>}
      {items && items.length > 1 && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 'auto', alignSelf: 'center' }} onClick={() => setI((i + 1) % items.length)}>Next headline</button>
      )}
    </div>
  )
}

export const news: Channel = {
  id: 'news',
  name: 'World news',
  emoji: '🗞️',
  blurb: "Today's headlines and political events",
  shelf: 'Stay current',
  View: NewsView,
}
