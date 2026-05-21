const SOURCES: Record<string, string> = {
  infobae:  "https://www.infobae.com/argentina-footer/infobae/rss/",
  lanacion: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml",
  clarin:   "https://www.clarin.com/rss/",
  perfil:   "https://www.perfil.com/feed",
  pagina12: "https://www.pagina12.com.ar/rss/portada",
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
}

interface NewsItem { title: string; link: string; source: string }

const cache = new Map<string, { data: NewsItem[]; ts: number }>()
const CACHE_MS = 30 * 60 * 1000

function parseItems(xml: string, source: string, query: string): NewsItem[] {
  const results: NewsItem[] = []
  // Split on closing item tag, handles any order of child elements
  for (const chunk of xml.split(/<\/item>/i)) {
    const start = chunk.search(/<item[\s>]/i)
    if (start === -1) continue
    const item = chunk.slice(start)

    const titleM = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
    if (!titleM) continue
    const title = titleM[1].trim()
    if (!title) continue

    // Try <link>url</link>, then <link href="url"/>, then <guid isPermaLink>
    let link = ""
    const linkM = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
    if (linkM) link = linkM[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()

    if (!link || !link.startsWith("http")) {
      const hrefM = item.match(/<link[^>]+href=["']([^"']+)["']/i)
      if (hrefM) link = hrefM[1]
    }
    if (!link || !link.startsWith("http")) {
      const guidM = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)
      if (guidM) {
        const g = guidM[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()
        if (g.startsWith("http")) link = g
      }
    }
    if (!link) continue

    if (!query || title.toLowerCase().includes(query)) {
      results.push({ title, link, source })
    }
  }
  return results
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.toLowerCase() ?? ""

  const cached = cache.get(query)
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return Response.json(cached.data, { headers: CORS })
  }

  const results: NewsItem[] = []

  for (const [source, url] of Object.entries(SOURCES)) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TermometroPolitico/1.0)" },
        signal: AbortSignal.timeout(5000),
      })
      const xml = await res.text()
      results.push(...parseItems(xml, source, query))
    } catch {
      // fuente no disponible
    }
  }

  const top = results.slice(0, 15)
  cache.set(query, { data: top, ts: Date.now() })

  return Response.json(top, { headers: CORS })
})
