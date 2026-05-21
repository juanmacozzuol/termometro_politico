import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const PROPOSAL_THRESHOLD = 5

export function useProposals(user) {
  const [proposals, setProposals] = useState([])
  const [userVotes, setUserVotes] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const fetchProposals = useCallback(async () => {
    const { data } = await supabase.rpc('get_proposals')
    setProposals(data || [])
  }, [])

  const fetchUserVotes = useCallback(async () => {
    if (!user) { setUserVotes(new Set()); return }
    const { data } = await supabase
      .from('proposal_votes')
      .select('proposal_id')
      .eq('user_id', user.id)
    setUserVotes(new Set((data || []).map(r => r.proposal_id)))
  }, [user])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchProposals(), fetchUserVotes()]).finally(() => setLoading(false))
  }, [fetchProposals, fetchUserVotes])

  async function propose(name, role, party) {
    if (!user) throw new Error('Necesitás estar logueado')
    const { error } = await supabase
      .from('politician_proposals')
      .insert({ name: name.trim(), role: role.trim(), party: party.trim(), proposed_by: user.id })
    if (error) throw error
    await fetchProposals()
  }

  async function vote(proposalId) {
    if (!user) throw new Error('Necesitás estar logueado')
    if (userVotes.has(proposalId)) {
      await supabase.from('proposal_votes').delete()
        .eq('proposal_id', proposalId).eq('user_id', user.id)
      setUserVotes(prev => { const s = new Set(prev); s.delete(proposalId); return s })
    } else {
      await supabase.from('proposal_votes').insert({ proposal_id: proposalId, user_id: user.id })
      setUserVotes(prev => new Set([...prev, proposalId]))
    }
    await fetchProposals()
  }

  return { proposals, userVotes, loading, propose, vote }
}
