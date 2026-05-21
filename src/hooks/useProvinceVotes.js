import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProvinceVotes(polId) {
  const [data, setData] = useState({})

  useEffect(() => {
    if (!polId) return
    supabase.rpc('get_votes_by_province', { p_pol_id: polId }).then(({ data: rows }) => {
      const map = {}
      for (const row of rows || []) {
        const total = Number(row.approvals) + Number(row.rejections)
        map[row.province] = {
          approvals: Number(row.approvals),
          rejections: Number(row.rejections),
          total,
          pct: total > 0 ? Math.round((Number(row.approvals) / total) * 100) : null,
        }
      }
      setData(map)
    })
  }, [polId])

  return data
}
