import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAllSnapshots(days = 60) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.rpc('get_all_snapshots', { p_days: days })
      .then(({ data: rows }) => {
        setData(rows ?? [])
        setLoading(false)
      })
  }, [days])

  return { data, loading }
}
