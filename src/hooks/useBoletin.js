import { useState, useCallback } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function useBoletin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)
  const [query, setQuery] = useState('')

  const search = useCallback(async (q = '') => {
    setLoading(true)
    setError('')
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : ''
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/boletin-proxy${params}`,
        {
          headers: {
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
          },
        }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setItems(Array.isArray(data) ? data : [])
      setFetched(true)
    } catch {
      setError('No se pudo cargar el Boletín Oficial.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback((q) => {
    setQuery(q)
    search(q)
  }, [search])

  return { items, loading, error, fetched, query, search, handleSearch }
}
