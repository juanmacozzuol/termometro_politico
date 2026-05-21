-- Funciones públicas para agregados (bypasean RLS de forma segura)

CREATE OR REPLACE FUNCTION get_vote_aggregates(p_pol_id TEXT)
RETURNS TABLE(pol_id TEXT, category TEXT, approvals BIGINT, rejections BIGINT, total BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    v.pol_id,
    v.category,
    COUNT(*) FILTER (WHERE v.vote = 'approve')::BIGINT,
    COUNT(*) FILTER (WHERE v.vote = 'reject')::BIGINT,
    COUNT(*)::BIGINT
  FROM votes v
  WHERE v.pol_id = p_pol_id
  GROUP BY v.pol_id, v.category;
$$;

CREATE OR REPLACE FUNCTION get_votes_by_province(p_pol_id TEXT)
RETURNS TABLE(pol_id TEXT, province TEXT, approvals BIGINT, rejections BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    v.pol_id,
    v.province,
    COUNT(*) FILTER (WHERE v.vote = 'approve')::BIGINT,
    COUNT(*) FILTER (WHERE v.vote = 'reject')::BIGINT
  FROM votes v
  WHERE v.pol_id = p_pol_id AND v.province IS NOT NULL
  GROUP BY v.pol_id, v.province;
$$;

GRANT EXECUTE ON FUNCTION get_vote_aggregates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_votes_by_province TO anon, authenticated;
