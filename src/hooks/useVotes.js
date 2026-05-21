import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const COOLDOWN_MS = 24 * 60 * 60 * 1000

export function useVotes(polId, user) {
  const [aggregates, setAggregates] = useState([])
  const [userVotes, setUserVotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAggregates = useCallback(async () => {
    const { data } = await supabase.rpc('get_vote_aggregates', { p_pol_id: polId })
    setAggregates(data || [])
  }, [polId])

  const fetchUserVotes = useCallback(async () => {
    if (!user) { setUserVotes([]); return }
    const { data } = await supabase.from('votes').select('*').eq('pol_id', polId)
    setUserVotes(data || [])
  }, [polId, user])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAggregates(), fetchUserVotes()]).finally(() => setLoading(false))
  }, [fetchAggregates, fetchUserVotes])

  async function castVote(category, type, province) {
    if (!user) throw new Error('No autenticado')
    const { error } = await supabase.from('votes').upsert(
      {
        user_id: user.id,
        pol_id: polId,
        category,
        vote: type,
        province: province || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,pol_id,category' }
    )
    if (error) throw error
    await Promise.all([fetchAggregates(), fetchUserVotes()])
  }

  function getAggregate(category) {
    const a = aggregates.find(x => x.category === category)
    if (!a || Number(a.total) === 0) return { approvals: 0, rejections: 0, total: 0, pct: 0 }
    return { ...a, pct: Math.round((Number(a.approvals) / Number(a.total)) * 100) }
  }

  function getUserVote(category) {
    return userVotes.find(v => v.category === category) || null
  }

  function canVote(category) {
    const existing = getUserVote(category)
    if (!existing) return { can: true }
    const elapsed = Date.now() - new Date(existing.updated_at).getTime()
    if (elapsed >= COOLDOWN_MS) return { can: true }
    const hoursLeft = Math.ceil((COOLDOWN_MS - elapsed) / (1000 * 60 * 60))
    return { can: false, hoursLeft }
  }

  return { loading, castVote, getAggregate, getUserVote, canVote }
}
