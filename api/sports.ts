// Sports updates for the "Your team" channel: recent games and headlines from
// ESPN's public site feed. Runs on the server so the browser isn't blocked.

const PATHS: Record<string, string> = {
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  mlb: 'baseball/mlb',
  nhl: 'hockey/nhl',
  wnba: 'basketball/wnba',
  mls: 'soccer/usa.1',
  epl: 'soccer/eng.1',
  ncaaf: 'football/college-football',
  ncaab: 'basketball/mens-college-basketball',
}

type Competitor = { team?: { displayName?: string }; score?: string }
type Event = { name?: string; status?: { type?: { shortDetail?: string } }; competitions?: { competitors?: Competitor[] }[] }
type Article = { headline?: string; description?: string; categories?: { description?: string }[] }

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = PATHS[url.searchParams.get('league') ?? '']
  if (!path) return Response.json({ error: 'unknown league' }, { status: 400 })
  const team = (url.searchParams.get('team') ?? '').trim().toLowerCase().slice(0, 40)
  const base = `https://site.api.espn.com/apis/site/v2/sports/${path}`

  try {
    const [board, news] = await Promise.all([
      fetch(`${base}/scoreboard`).then((r) => (r.ok ? r.json() : { events: [] })) as Promise<{ events?: Event[] }>,
      fetch(`${base}/news?limit=50`).then((r) => (r.ok ? r.json() : { articles: [] })) as Promise<{ articles?: Article[] }>,
    ])
    const matches = (text: string) => !team || text.toLowerCase().includes(team)

    const games = (board.events ?? [])
      .filter((e) => matches(e.name ?? ''))
      .slice(0, 5)
      .map((e) => {
        const sides = (e.competitions?.[0]?.competitors ?? []).map((c) => `${c.team?.displayName ?? ''} ${c.score ?? ''}`.trim())
        return `${sides.join(', ')} (${e.status?.type?.shortDetail ?? ''})`
      })

    const headlines = (news.articles ?? [])
      .filter((a) => matches(`${a.headline ?? ''} ${a.description ?? ''} ${(a.categories ?? []).map((c) => c.description ?? '').join(' ')}`))
      .slice(0, 10)
      .map((a) => ({ headline: a.headline ?? '', description: a.description ?? '' }))

    return Response.json({ games, headlines }, { headers: { 'cache-control': 'public, max-age=300' } })
  } catch {
    return Response.json({ error: 'sports feed unavailable' }, { status: 502 })
  }
}
