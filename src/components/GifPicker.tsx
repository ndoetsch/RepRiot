import { useEffect, useRef, useState } from 'react'
import { giphyConfigured, searchGifs, type Gif } from '../lib/giphy'
import { errorText, supabase } from '../lib/supabase'
import type { Exercise } from '../lib/types'

export type ChosenMedia = Pick<Exercise, 'media_type' | 'media_url' | 'media_still_url' | 'media_title'>

type Props = {
  userId: string
  initialQuery: string
  value: ChosenMedia | null
  onChange: (m: ChosenMedia | null) => void
}

const MAX_CLIP_SECONDS = 15
const MAX_CLIP_BYTES = 20 * 1024 * 1024

function clipDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src)
      resolve(v.duration)
    }
    v.onerror = () => resolve(0)
    v.src = URL.createObjectURL(file)
  })
}

export function GifPicker({ userId, initialQuery, value, onChange }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!giphyConfigured) return
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        setGifs(await searchGifs(query, ctrl.signal))
        setError(null)
      } catch (e) {
        if (!ctrl.signal.aborted) setError(errorText(e))
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 700)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  async function upload(file: File) {
    setError(null)
    if (file.size > MAX_CLIP_BYTES) return setError('That clip is over 20 MB. Try a shorter one.')
    if (file.type.startsWith('video/')) {
      const secs = await clipDuration(file)
      if (secs > MAX_CLIP_SECONDS + 0.5) return setError(`Clips can be up to ${MAX_CLIP_SECONDS} seconds. That one is ${Math.round(secs)}.`)
    }
    setUploading(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('clips').upload(path, file, { contentType: file.type })
    setUploading(false)
    if (upErr) return setError(errorText(upErr))
    const url = supabase.storage.from('clips').getPublicUrl(path).data.publicUrl
    onChange({ media_type: 'upload', media_url: url, media_still_url: null, media_title: file.name })
  }

  const uploaded = value?.media_type === 'upload'

  return (
    <div className="stack">
      {giphyConfigured ? (
        <>
          <label htmlFor="gif-q" className="sr-only">Search GIFs</label>
          <input id="gif-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search GIFs, like “superhero squats”" />
          <div className="gif-grid" aria-busy={loading}>
            {gifs.map((g) => {
              const selected = value?.media_type === 'giphy' && value.media_url === g.url
              return (
                <button
                  key={g.id}
                  type="button"
                  className="gif-tile"
                  aria-pressed={selected}
                  aria-label={g.title}
                  onClick={() => onChange(selected ? null : { media_type: 'giphy', media_url: g.url, media_still_url: g.stillUrl, media_title: g.title })}
                >
                  <img src={g.previewUrl} alt="" loading="lazy" />
                </button>
              )
            })}
          </div>
          {!loading && gifs.length === 0 && !error && <p className="small muted">No GIFs found. Try other words.</p>}
          <p className="giphy-credit">Powered by GIPHY</p>
        </>
      ) : (
        <p className="small muted">GIF search turns on once the Giphy key is added. You can upload your own clip for now.</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
          e.target.value = ''
        }}
      />
      <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? 'Uploading…' : uploaded ? `Clip ready: ${value?.media_title}` : 'Upload your own clip instead'}
      </button>
      <p className="small muted" style={{ margin: 0 }}>Clips: up to {MAX_CLIP_SECONDS} seconds.</p>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
