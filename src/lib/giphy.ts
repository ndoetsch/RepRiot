const KEY = import.meta.env.VITE_GIPHY_API_KEY as string | undefined

export type Gif = {
  id: string
  title: string
  /** Small animated preview for grids. */
  previewUrl: string
  /** Larger animated version to play during a set. */
  url: string
  /** First frame, for places that should not animate. */
  stillUrl: string
}

export const giphyConfigured = Boolean(KEY)

type GiphyImage = { url?: string }
type GiphyItem = {
  id: string
  title: string
  images: Record<string, GiphyImage | undefined>
}

/** First size Giphy actually sent, from most to least preferred. */
function pick(images: GiphyItem['images'], sizes: string[]): string | null {
  for (const s of sizes) {
    const url = images[s]?.url
    if (url) return url
  }
  return null
}

/**
 * Search Giphy. Rating "r" lets everything through except NSFW content,
 * which Giphy never serves through its API.
 */
export async function searchGifs(query: string, signal?: AbortSignal): Promise<Gif[]> {
  if (!KEY) throw new Error('GIF search is not set up yet (missing Giphy key).')
  const q = query.trim()
  const endpoint = q ? 'search' : 'trending'
  const params = new URLSearchParams({ api_key: KEY, limit: '24', rating: 'r' })
  if (q) params.set('q', q)
  const res = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${params}`, { signal })
  if (!res.ok) throw new Error('Could not reach Giphy. Try again.')
  const body = (await res.json()) as { data: GiphyItem[] }
  return body.data.flatMap((g) => {
    const url = pick(g.images, ['downsized_medium', 'fixed_width', 'original'])
    const previewUrl = pick(g.images, ['fixed_width_downsampled', 'fixed_width', 'fixed_width_small', 'original'])
    if (!url || !previewUrl) return []
    return [{ id: g.id, title: g.title || 'GIF', url, previewUrl, stillUrl: pick(g.images, ['fixed_width_still', 'original_still']) ?? previewUrl }]
  })
}

const CHEER_KEY = 'fitluck.cheers'

/**
 * A celebration GIF for after a set. The beta Giphy key allows 100 calls an hour,
 * so one search per session is cached and reused.
 */
export async function cheerGif(): Promise<string | null> {
  if (!KEY) return null
  let urls: string[] = []
  try {
    urls = JSON.parse(sessionStorage.getItem(CHEER_KEY) ?? '[]') as string[]
  } catch {
    urls = []
  }
  if (!urls.length) {
    try {
      urls = (await searchGifs('you did it celebration')).map((g) => g.url)
      sessionStorage.setItem(CHEER_KEY, JSON.stringify(urls))
    } catch {
      return null
    }
  }
  return urls[Math.floor(Math.random() * urls.length)] ?? null
}
