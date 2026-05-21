import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePoliticians() {
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .rpc('get_politicians_ranked')
      .then(({ data }) => {
        setPoliticians(data || [])
        setLoading(false)
      })
  }, [])

  return { politicians, loading }
}
