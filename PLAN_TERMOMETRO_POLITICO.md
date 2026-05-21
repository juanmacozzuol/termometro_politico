# Plan de Desarrollo — Termómetro Político Argentino
> Última actualización: Mayo 2026

---

## ⚠️ Restricciones críticas encontradas (leé esto primero)

### Vercel Hobby (gratis) — NO para este proyecto
- Prohíbe explícitamente **uso comercial** en el plan gratuito.
- Cuando se llega al límite mensual, la app **se cae completamente** (no throttle, no warning).
- **Usar Cloudflare Pages en su lugar**: gratis, ilimitado en bandwidth, sin restricción comercial, CDN global.

### Supabase free tier — OK con un asterisco
- El proyecto **se pausa después de 7 días sin actividad**. En producción hay que tenerlo en cuenta.
- El SMTP incorporado tiene un límite de **3 emails por hora**. Completamente insuficiente para un MVP real.
- **Solución**: configurar Resend como SMTP externo (gratis hasta 3,000 mails/mes, 100/día).
- Para evitar la pausa: el plan Pro de Supabase cuesta $25/mes y la elimina. Empezar gratis y upgradear cuando haya usuarios reales.

### Google News RSS — CORS bloqueado en el browser
- No se puede llamar directamente desde el frontend. El browser lo bloquea siempre.
- **Solución**: Supabase Edge Function como proxy que cachea resultados 30 minutos.
- Costo: 0 (500k invocaciones/mes gratis).

### RSS de medios argentinos — Fuentes confirmadas
- **Infobae**: `https://www.infobae.com/argentina-footer/infobae/rss/`
- **La Nación** (política): `https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml`
- **Clarín**: `https://www.clarin.com/rss/`
- **Perfil**: `https://www.perfil.com/feed`
- Todos tienen CORS — deben pasar por el proxy Edge Function.

### Boletín Oficial — Sin RSS público directo
- `boletinoficial.gob.ar` no expone RSS fácilmente consumible.
- La alternativa viable es **Infoleg** (`infoleg.gob.ar`) + búsqueda por nombre en su API pública.
- Por ahora: link directo al buscador del B.O. con el nombre del político pre-cargado.

### Resend (email para auth)
- Free: 3,000 emails/mes, límite de 100/día.
- Suficiente para un MVP. Si crece: $20/mes para 50,000 emails.
- Se configura como SMTP custom en Supabase, no requiere código extra.

---

## Stack definitivo

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | React + Vite | Ya lo conocés, rápido de iterar |
| Hosting | **Cloudflare Pages** | Gratis, ilimitado, sin restricción comercial |
| Backend/DB | Supabase (PostgreSQL) | Ya lo usás en El Botón, auth + DB + Edge Functions |
| Auth | Supabase Auth + magic link OTP | Sin contraseña, cross-device, un email |
| Email (SMTP) | Resend | 3,000/mes gratis, developer-friendly |
| News proxy | Supabase Edge Functions | Proxy RSS + cache, dentro del free tier |
| Mapa | SVG custom de Argentina | Sin dependencias externas |
| Domain | A definir (Cloudflare o dominio propio) | Cloudflare DNS es gratis |

---

## Esquema de base de datos (Supabase/PostgreSQL)

```sql
-- Los usuarios los maneja Supabase Auth automáticamente (tabla auth.users)

-- Votos por categoría
CREATE TABLE votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pol_id      TEXT NOT NULL,         -- 'milei', 'cfk', etc.
  category    TEXT NOT NULL,         -- 'general', 'economia', 'salud', etc.
  vote        TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  province    TEXT,                  -- nullable, selección del usuario
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, pol_id, category) -- un voto por usuario/político/categoría
);

-- Índices para consultas frecuentes
CREATE INDEX idx_votes_pol    ON votes(pol_id);
CREATE INDEX idx_votes_cat    ON votes(pol_id, category);
CREATE INDEX idx_votes_prov   ON votes(pol_id, province);
CREATE INDEX idx_votes_time   ON votes(pol_id, updated_at);

-- Vista de agregados (lo que el frontend consume)
CREATE VIEW vote_aggregates AS
SELECT
  pol_id,
  category,
  COUNT(*) FILTER (WHERE vote = 'approve') AS approvals,
  COUNT(*) FILTER (WHERE vote = 'reject')  AS rejections,
  COUNT(*)                                 AS total
FROM votes
GROUP BY pol_id, category;

-- Vista por provincia
CREATE VIEW vote_by_province AS
SELECT
  pol_id,
  province,
  COUNT(*) FILTER (WHERE vote = 'approve') AS approvals,
  COUNT(*) FILTER (WHERE vote = 'reject')  AS rejections
FROM votes
WHERE province IS NOT NULL
GROUP BY pol_id, province;

-- Snapshots diarios para el gráfico de evolución
CREATE TABLE daily_snapshots (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pol_id   TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  date     DATE NOT NULL DEFAULT CURRENT_DATE,
  approval INT NOT NULL,  -- porcentaje 0-100
  total    INT NOT NULL,
  UNIQUE (pol_id, category, date)
);

-- Row Level Security: los votos son privados por usuario
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own votes"
  ON votes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own votes"
  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own votes"
  ON votes FOR UPDATE USING (auth.uid() = user_id);

-- Los agregados son públicos (no tienen datos personales)
GRANT SELECT ON vote_aggregates  TO anon, authenticated;
GRANT SELECT ON vote_by_province TO anon, authenticated;
GRANT SELECT ON daily_snapshots  TO anon, authenticated;
```

### Lógica de cooldown (en el frontend / Edge Function)
El cooldown de 24h **no se maneja con un campo en la DB**. Se lee `updated_at` del voto existente y se calcula en el cliente. Así:
```js
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const canChange = Date.now() - new Date(existingVote.updated_at).getTime() >= COOLDOWN_MS;
```

---

## Categorías de votación (9 — internacionales, sin sesgo)

```js
export const CATEGORIES = [
  { id: 'general',         label: 'Imagen General',       icon: '⭐' },
  { id: 'economia',        label: 'Economía y Empleo',     icon: '📊' },
  { id: 'salud',           label: 'Salud',                icon: '🏥' },
  { id: 'educacion',       label: 'Educación',            icon: '📚' },
  { id: 'seguridad',       label: 'Seguridad y Justicia', icon: '🛡️' },
  { id: 'social',          label: 'Política Social',      icon: '🤝' },
  { id: 'infraestructura', label: 'Infraestructura',      icon: '🏗️' },
  { id: 'transparencia',   label: 'Transparencia',        icon: '⚖️' },
  { id: 'medioambiente',   label: 'Medio Ambiente',       icon: '🌿' },
];
```
Basadas en el marco OCDE/PNUD de evaluación de gobiernos. No las definiste vos, las define un organismo internacional.

---

## Flujo de autenticación

```
Usuario abre la app
       │
       ▼
¿Tiene sesión activa? ──── SÍ ───► Listo, puede votar
       │
      NO
       │
       ▼
Escribe su email
       │
       ▼
Supabase envía OTP de 6 dígitos (vía Resend)
       │
       ▼
Usuario ingresa el código (expira en 1 hora)
       │
       ▼
Sesión creada, persiste en todos sus dispositivos
con la misma cuenta de email
```

**Cross-device**: funciona siempre que usen el mismo email. No hay contraseña que perder. Si cambian de dispositivo, piden un nuevo OTP al mismo email.

**¿Qué pasa si alguien crea emails falsos para votar múltiples veces?**
- El cooldown de 24h limita el daño por email
- En una iteración futura: detección de patrones sospechosos con una Supabase Edge Function (muchos votos del mismo IP en poco tiempo)
- Para el MVP: aceptable

---

## Edge Function: proxy de noticias RSS

```typescript
// supabase/functions/news-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SOURCES = {
  infobae: "https://www.infobae.com/argentina-footer/infobae/rss/",
  lanacion: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml",
  clarin:   "https://www.clarin.com/rss/",
  perfil:   "https://www.perfil.com/feed",
};

// Cache en memoria (se resetea con cada cold start, ~30min en producción)
const cache = new Map<string, { data: any[]; ts: number }>();
const CACHE_MS = 30 * 60 * 1000; // 30 minutos

serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  const cacheKey = query;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return Response.json(cached.data, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const results: any[] = [];

  for (const [source, url] of Object.entries(SOURCES)) {
    try {
      const res  = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const xml  = await res.text();
      // Parsear XML básico: extraer <item> con <title> y <link>
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/g)];
      for (const [, title, link] of items) {
        if (!query || title.toLowerCase().includes(query)) {
          results.push({ title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(), link: link.trim(), source });
        }
      }
    } catch (_) { /* fuente no disponible, continuar */ }
  }

  const top = results.slice(0, 8); // máximo 8 noticias en el hover
  cache.set(cacheKey, { data: top, ts: Date.now() });

  return Response.json(top, { headers: { "Access-Control-Allow-Origin": "*" } });
});
```

---

## Fases de desarrollo

### Fase 1 — Setup (½ día)
- [ ] Crear proyecto en Supabase
- [ ] Ejecutar el SQL del schema
- [ ] Configurar Resend como SMTP en Supabase Auth
- [ ] Scaffolding: `npm create vite@latest termometro -- --template react`
- [ ] Instalar: `@supabase/supabase-js`, `recharts`, `react-router-dom`
- [ ] Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Conectar repo a Cloudflare Pages (GitHub → Pages → auto-deploy)

### Fase 2 — Auth (1 día)
- [ ] Pantalla de login: input de email + submit
- [ ] Pantalla de código OTP: 6 inputs numéricos
- [ ] Hook `useAuth()`: sesión, usuario, logout
- [ ] Proteger acciones de voto (no acceso a datos, solo las acciones)
- [ ] Persistencia de sesión across tabs/dispositivos
- [ ] Testing: mismo email, distintos dispositivos ✓

### Fase 3 — Core voting con categorías (1 día)
- [ ] Hook `useVotes(polId)`: carga votos del usuario + agregados públicos
- [ ] Función `castVote(polId, category, type, province)` con lógica de cooldown
- [ ] UI de categorías: tabs o acordeón dentro del panel del político
- [ ] Vista de resultados por categoría con mini-gauges
- [ ] Selector de provincia opcional al votar

### Fase 4 — Mapa SVG (1 día)
- [ ] Componente `<ArgentinaMap polId={selected} />` con SVG de las 24 provincias
- [ ] Color fill dinámico por aprobación (escala verde→rojo)
- [ ] Tooltip al hover con datos de la provincia
- [ ] Datos desde la vista `vote_by_province` + seed data de base

### Fase 5 — Noticias y Boletín (½ día)
- [ ] Deploy de la Edge Function `news-proxy`
- [ ] Hook `useNews(polName)` con fetch a la Edge Function
- [ ] Hover/panel de noticias en la card del político
- [ ] Link directo al Boletín Oficial:
  `https://www.boletinoficial.gob.ar/#!DetalleNorma/search/term={nombre}`

### Fase 6 — Gráfico de evolución + snapshots (½ día)
- [ ] Cron job en Supabase (o trigger) que guarda un snapshot diario en `daily_snapshots`
- [ ] LineChart de recharts conectado a datos reales
- [ ] Selector de políticos a mostrar en el gráfico

### Fase 7 — Polish + deploy (½ día)
- [ ] Responsive mobile
- [ ] Loading states y error handling
- [ ] `_redirects` file para SPA routing en Cloudflare Pages
- [ ] Variables de entorno en Cloudflare Pages dashboard
- [ ] Dominio custom (opcional, Cloudflare DNS)
- [ ] Smoke test end-to-end

---

## Estructura de carpetas

```
termometro-politico/
├── public/
├── src/
│   ├── components/
│   │   ├── ArcGauge.jsx
│   │   ├── ArgentinaMap.jsx      ← SVG mapa
│   │   ├── CategoryVote.jsx      ← votación por categoría
│   │   ├── NewsHover.jsx         ← noticias en hover
│   │   ├── EvolutionChart.jsx
│   │   └── AuthModal.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useVotes.js
│   │   └── useNews.js
│   ├── lib/
│   │   └── supabase.js           ← cliente Supabase
│   ├── data/
│   │   ├── politicians.js        ← lista de políticos
│   │   └── categories.js        ← 9 categorías
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── functions/
│   │   └── news-proxy/
│   │       └── index.ts
│   └── migrations/
│       └── 001_initial.sql
├── _redirects                    ← "/* /index.html 200" para Cloudflare
├── .env.local
└── package.json
```

---

## Costos mensuales

| Servicio | Plan | Costo |
|---------|------|-------|
| Supabase | Free (hasta 50k MAU) | $0 |
| Cloudflare Pages | Free (ilimitado) | $0 |
| Resend | Free (3k emails/mes) | $0 |
| Dominio | Opcional | ~$10/año |
| **Total arranque** | | **$0** |

### Cuándo pagar (cuándo tiene sentido)
- **Supabase Pro ($25/mes)**: cuando haya usuarios activos diarios y no querés que el proyecto se pause. También elimina el branding de Supabase en los emails de auth.
- **Resend Pro ($20/mes)**: si superás 100 nuevos usuarios por día.
- No hay costo por el mapa, las noticias, el gráfico, ni el Boletín Oficial.

---

## Comandos para arrancar mañana

```bash
# 1. Crear el proyecto
npm create vite@latest termometro-politico -- --template react
cd termometro-politico

# 2. Instalar dependencias
npm install @supabase/supabase-js recharts react-router-dom

# 3. Variables de entorno (.env.local)
echo "VITE_SUPABASE_URL=tu_url_aqui" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=tu_key_aqui" >> .env.local

# 4. Archivo para Cloudflare Pages SPA routing
echo "/* /index.html 200" > public/_redirects

# 5. Instalar Supabase CLI para Edge Functions
npm install -g supabase
supabase login
supabase init

# 6. Correr local
npm run dev
```

---

## Checklist de Supabase (Dashboard)

- [ ] Auth → Email → Enable email confirmations: **OFF** (queremos OTP, no link)
- [ ] Auth → Email → Enable magic link: **OFF** (sólo OTP de 6 dígitos)
- [ ] Auth → OTP expiry: **3600** segundos (1 hora)
- [ ] Auth → SMTP → Custom SMTP con Resend:
  - Host: `smtp.resend.com`
  - Port: `465`
  - User: `resend`
  - Password: tu API key de Resend
  - Sender: `auth@tudominio.com`
- [ ] Auth → URL Configuration → Site URL: tu URL de Cloudflare Pages
- [ ] Database → ejecutar migration `001_initial.sql`
- [ ] Edge Functions → deploy `news-proxy`

---

## Nota sobre el mapa SVG

El SVG de Argentina con las 24 provincias va a ser generado como componente React con paths hardcodeados. Cada `<path>` tiene un `id` que corresponde al nombre de la provincia, permitiendo coloreo dinámico:

```jsx
// Ejemplo de uso
<path
  id="Buenos Aires"
  d="M ... Z"
  fill={getColor(provinceApproval["Buenos Aires"])}
  onClick={() => setSelectedProvince("Buenos Aires")}
/>
```

El SVG completo de Argentina con paths correctos lo generamos en la siguiente sesión de desarrollo.
