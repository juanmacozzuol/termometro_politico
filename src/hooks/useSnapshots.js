import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSnapshots(polId, days = 60) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!polId) return
    setLoading(true)
    supabase.rpc('get_snapshots', { p_pol_id: polId, p_days: days })
      .then(({ data }) => {
        setSnapshots(data ?? [])
        setLoading(false)
      })
  }, [polId, days])

  return { snapshots, loading }
}
