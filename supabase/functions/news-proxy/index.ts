import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SOURCES: Record<string, string> = {
  infobae: "https://www.infobae.com/argentina-footer/infobae/rss/",
  lanacion: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml",
  clarin:   "https://www.clarin.com/rss/",
  perfil:   "https://www.perfil.com/feed",
};

const cache = new Map<string, { data: NewsItem[]; ts: number }>();
const CACHE_MS = 30 * 60 * 1000;

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  const cached = cache.get(query);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return Response.json(cached.data, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const results: NewsItem[] = [];

  for (const [source, url] of Object.entries(SOURCES)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/g)];
      for (const [, title, link] of items) {
        if (!query || title.toLowerCase().includes(query)) {
          results.push({
            title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
            link: link.trim(),
            source,
          });
        }
      }
    } catch {
      // fuente no disponible, continuar
    }
  }

  const top = results.slice(0, 8);
  cache.set(query, { data: top, ts: Date.now() });

  return Response.json(top, { headers: { "Access-Control-Allow-Origin": "*" } });
});
