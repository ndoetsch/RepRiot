import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Loading } from '../components/Loading'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { useCrew } from '../lib/crew'
import { timeAgo } from '../lib/dates'
import { giphyConfigured, searchGifs, type Gif } from '../lib/giphy'
import { errorText, supabase } from '../lib/supabase'
import type { ChatMessage } from '../lib/types'

const LIMIT = 100

function GifSheet({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('workout hype')
  const [gifs, setGifs] = useState<Gif[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchGifs(query, ctrl.signal)
        .then((g) => {
          setGifs(g)
          setError(null)
        })
        .catch((e) => !ctrl.signal.aborted && setError(errorText(e)))
    }, 600)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  return (
    <div className="overlay sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="gif-h" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet stack" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="row between">
          <h2 id="gif-h" style={{ fontSize: 18, margin: 0 }}>Send a GIF</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <label htmlFor="chat-gif-q" className="sr-only">Search GIFs</label>
        <input id="chat-gif-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <div className="gif-grid">
          {gifs.map((g) => (
            <button key={g.id} type="button" className="gif-tile" aria-label={g.title} onClick={() => onPick(g.url)}>
              <img src={g.previewUrl} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="giphy-credit">Powered by GIPHY</p>
      </div>
    </div>
  )
}

export function Chat() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const { data } = useCrew(crewId)
  const [msgs, setMsgs] = useState<ChatMessage[] | null>(null)
  const [text, setText] = useState('')
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const { data: rows, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('crew_id', crewId)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
    if (err) return setError(errorText(err))
    setMsgs(((rows ?? []) as ChatMessage[]).reverse())
  }, [crewId])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel(`chat-${crewId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `crew_id=eq.${crewId}` }, (p) => {
        const m = p.new as ChatMessage
        setMsgs((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m].slice(-LIMIT) : prev))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [crewId, load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [msgs?.length])

  async function send(body: string, gif: string | null) {
    if (!profile) return
    setBusy(true)
    setError(null)
    const { data: row, error: err } = await supabase
      .from('messages')
      .insert({ crew_id: crewId, user_id: profile.id, body, gif_url: gif })
      .select()
      .single()
    setBusy(false)
    if (err) return setError(errorText(err))
    if (!gif) setText('')
    const m = row as ChatMessage
    setMsgs((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (body) void send(body, null)
  }

  if (!profile) return <Loading />
  const nameOf = (id: string) => data?.members.find((m) => m.id === id)?.display_name ?? 'Former member'

  return (
    <>
      <main className="screen with-tabs" style={{ paddingBottom: 'calc(150px + env(safe-area-inset-bottom))' }}>
        <div className="top"><h1 style={{ fontSize: 26 }}>Squad chat</h1></div>
        {!msgs && !error && <div className="spinner" aria-label="Loading" />}
        {msgs && msgs.length === 0 && <p className="muted small">No messages yet. Talk some trash, or hype someone up.</p>}
        <div className="msgs" aria-live="polite">
          {msgs?.map((m, i) => {
            const mine = m.user_id === profile.id
            const showName = !mine && msgs[i - 1]?.user_id !== m.user_id
            return (
              <div key={m.id} className={`msg ${mine ? 'me' : ''}`} title={timeAgo(m.created_at)}>
                {showName && <div className="from">{nameOf(m.user_id)}</div>}
                {m.body && <div>{m.body}</div>}
                {m.gif_url && <img src={m.gif_url} alt="GIF" loading="lazy" />}
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      </main>
      <div className="composer">
        {error && <p className="error" role="alert" style={{ maxWidth: 440, margin: '0 auto 6px' }}>{error}</p>}
        <form onSubmit={submit}>
          {giphyConfigured && (
            <button type="button" className="gif-btn" onClick={() => setPicking(true)} aria-label="Send a GIF">GIF</button>
          )}
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input id="chat-input" type="text" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the squad" autoComplete="off" />
          <button type="submit" className="send" disabled={busy || !text.trim()}>Send</button>
        </form>
      </div>
      {picking && (
        <GifSheet
          onClose={() => setPicking(false)}
          onPick={(url) => {
            setPicking(false)
            void send('', url)
          }}
        />
      )}
      <TabBar crewId={crewId} />
    </>
  )
}
