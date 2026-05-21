const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
}

interface BoletinItem {
  id: string
  titulo: string
  dependencia: string
  seccion: string
  fecha: string
  url: string
}

const cache = new Map<string, { data: BoletinItem[]; ts: number }>()
const CACHE_MS = 15 * 60 * 1000

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/html, */*;q=0.9",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  "Referer": "https://www.boletinoficial.gob.ar/",
  "X-Requested-With": "XMLHttpRequest",
}

function today(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
}
function weekAgo(): string {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
}

function mapPublicaciones(pubs: Record<string, string>[]): BoletinItem[] {
  return pubs.slice(0, 20).map(p => ({
    id: String(p.id ?? p.nroAviso ?? p.identificador ?? Math.random()),
    titulo: (p.titulo ?? p.denominacion ?? p.nombre ?? "").trim(),
    dependencia: (p.dependencia ?? p.organismo ?? p.emisor ?? "").trim(),
    seccion: p.seccion ?? p.nombreSeccion ?? "Primera Sección",
    fecha: p.fecha ?? p.fechaPublicacion ?? "",
    url: p.urlDetalle
      ? `https://www.boletinoficial.gob.ar${p.urlDetalle}`
      : `https://www.boletinoficial.gob.ar/busquedaAvanzada/index`,
  })).filter(i => i.titulo)
}

async function tryBoletinAPI(query: string): Promise<BoletinItem[]> {
  // Approach 1: GET with query params
  const params = new URLSearchParams()
  params.set("textoBusqueda", query)
  params.set("pageOffset", "1")
  params.set("desde", weekAgo())
  params.set("hasta", today())

  // BO uses seccion as a repeated param or array notation — try both
  const url1 = `https://www.boletinoficial.gob.ar/busqueda/publicaciones?${params}&seccion%5B%5D=1&seccion%5B%5D=2&seccion%5B%5D=3`

  const r1 = await fetch(url1, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(8000),
  })

  console.log("BO GET status:", r1.status, "content-type:", r1.headers.get("content-type"))

  if (r1.ok) {
    const ct = r1.headers.get("content-type") ?? ""
    if (ct.includes("json")) {
      const json = await r1.json()
      console.log("BO JSON keys:", Object.keys(json))
      const pubs = json.publicaciones ?? json.data ?? json.results ?? json.items ?? json
      if (Array.isArray(pubs) && pubs.length > 0) return mapPublicaciones(pubs)
    }
  }

  // Approach 2: POST with form-encoded body
  const body = new URLSearchParams()
  body.set("textoBusqueda", query)
  body.set("pageOffset", "1")
  body.set("desde", weekAgo())
  body.set("hasta", today())
  body.append("seccion[]", "1")
  body.append("seccion[]", "2")
  body.append("seccion[]", "3")

  const r2 = await fetch("https://www.boletinoficial.gob.ar/busqueda/publicaciones", {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(8000),
  })

  console.log("BO POST status:", r2.status, "content-type:", r2.headers.get("content-type"))

  if (r2.ok) {
    const ct = r2.headers.get("content-type") ?? ""
    if (ct.includes("json")) {
      const json = await r2.json()
      console.log("BO POST JSON keys:", Object.keys(json))
      const pubs = json.publicaciones ?? json.data ?? json.results ?? json.items ?? json
      if (Array.isArray(pubs) && pubs.length > 0) return mapPublicaciones(pubs)
    }
    // If HTML came back, log a snippet
    if (ct.includes("html")) {
      const html = await r2.text()
      console.log("BO HTML snippet:", html.slice(0, 500))
    }
  }

  return []
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const cacheKey = query.toLowerCase()

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return Response.json(cached.data, { headers: CORS })
  }

  try {
    const items = await tryBoletinAPI(query)
    cache.set(cacheKey, { data: items, ts: Date.now() })
    return Response.json(items, { headers: CORS })
  } catch (err) {
    console.error("boletin-proxy error:", err)
    return Response.json([], { headers: CORS })
  }
})
