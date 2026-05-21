-- RPC for fetching all politicians' approval trends at once
CREATE OR REPLACE FUNCTION get_all_snapshots(p_days int DEFAULT 60)
RETURNS TABLE(pol_id text, snap_date date, pct numeric)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pol_id,
    date,
    CASE WHEN total > 0
         THEN ROUND(approval::numeric / total * 100, 1)
         ELSE 0
    END AS pct
  FROM daily_snapshots
  WHERE category = 'general'
    AND date >= CURRENT_DATE - p_days
  ORDER BY date ASC;
$$;

GRANT EXECUTE ON FUNCTION get_all_snapshots TO anon, authenticated;
