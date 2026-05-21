-- Políticos ordenados por actividad reciente (últimos 7 días)
CREATE OR REPLACE FUNCTION get_politicians_ranked()
RETURNS TABLE (
  id TEXT, name TEXT, role TEXT, party TEXT,
  photo_url TEXT, display_order INT, recent_votes BIGINT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.role, p.party, p.photo_url, p.display_order,
    COALESCE(r.cnt, 0) AS recent_votes
  FROM politicians p
  LEFT JOIN (
    SELECT pol_id, COUNT(*) AS cnt
    FROM votes
    WHERE updated_at > NOW() - INTERVAL '7 days'
    GROUP BY pol_id
  ) r ON p.id = r.pol_id
  WHERE p.active = true
  ORDER BY recent_votes DESC, p.display_order ASC;
$$;

GRANT EXECUTE ON FUNCTION get_politicians_ranked TO anon, authenticated;

-- Propuestas de nuevos políticos
CREATE TABLE politician_proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  role        TEXT DEFAULT '',
  party       TEXT DEFAULT '',
  proposed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_votes (
  proposal_id UUID NOT NULL REFERENCES politician_proposals(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (proposal_id, user_id)
);

CREATE INDEX idx_proposal_votes_user ON proposal_votes(user_id);

ALTER TABLE politician_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read pending proposals"
  ON politician_proposals FOR SELECT USING (status = 'pending');
CREATE POLICY "users can propose"
  ON politician_proposals FOR INSERT WITH CHECK (auth.uid() = proposed_by);

CREATE POLICY "anyone can read proposal votes"
  ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "users can vote proposals"
  ON proposal_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can delete own proposal vote"
  ON proposal_votes FOR DELETE USING (auth.uid() = user_id);

-- RPC pública: propuestas con conteo de votos
CREATE OR REPLACE FUNCTION get_proposals()
RETURNS TABLE (
  id UUID, name TEXT, role TEXT, party TEXT,
  vote_count BIGINT, proposed_by UUID, created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.role, p.party,
    COUNT(pv.user_id)::BIGINT AS vote_count,
    p.proposed_by, p.created_at
  FROM politician_proposals p
  LEFT JOIN proposal_votes pv ON p.id = pv.proposal_id
  WHERE p.status = 'pending'
  GROUP BY p.id, p.name, p.role, p.party, p.proposed_by, p.created_at
  ORDER BY vote_count DESC, p.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_proposals TO anon, authenticated;
