import { useState, useCallback } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function getSearchTerm(name) {
  const parts = name.split(' ')
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].length > 2 && !['del', 'los', 'las', 'der'].includes(parts[i].toLowerCase())) {
      return parts[i].toLowerCase()
    }
  }
  return parts[0].toLowerCase()
}

export function useNews(polName) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const q = encodeURIComponent(getSearchTerm(polName))
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/news-proxy?q=${q}`,
        {
          headers: {
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
          },
        }
      )
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Error ${res.status}: ${text}`)
      }
      const data = await res.json()
      setArticles(data)
      setFetched(true)
    } catch (e) {
      setError('No se pudieron cargar las noticias. Verificá que la Edge Function esté deployada.')
    } finally {
      setLoading(false)
    }
  }, [polName])

  return { articles, loading, error, fetched, fetch: fetch_ }
}
