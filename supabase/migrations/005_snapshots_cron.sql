-- Enable pg_cron (available on all Supabase plans)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily snapshot job: runs at 3 AM UTC every day
SELECT cron.schedule(
  'termometro-daily-snapshot',
  '0 3 * * *',
  $$
  INSERT INTO daily_snapshots (pol_id, category, date, approval, total)
  SELECT
    pol_id,
    category,
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE vote = 'approve'),
    COUNT(*)
  FROM votes
  GROUP BY pol_id, category
  ON CONFLICT (pol_id, category, date) DO UPDATE
    SET approval = EXCLUDED.approval,
        total    = EXCLUDED.total;
  $$
);

-- Populate today's snapshot immediately so there is data to display
INSERT INTO daily_snapshots (pol_id, category, date, approval, total)
SELECT
  pol_id,
  category,
  CURRENT_DATE,
  COUNT(*) FILTER (WHERE vote = 'approve'),
  COUNT(*)
FROM votes
GROUP BY pol_id, category
ON CONFLICT (pol_id, category, date) DO UPDATE
  SET approval = EXCLUDED.approval,
      total    = EXCLUDED.total;

-- RPC used by the frontend to read a politician's approval trend
CREATE OR REPLACE FUNCTION get_snapshots(p_pol_id text, p_days int DEFAULT 60)
RETURNS TABLE(snap_date date, approval int, total int, pct numeric)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    date,
    approval,
    total,
    CASE WHEN total > 0
         THEN ROUND(approval::numeric / total * 100, 1)
         ELSE 0
    END AS pct
  FROM daily_snapshots
  WHERE pol_id = p_pol_id AND category = 'general'
  ORDER BY date ASC
  LIMIT p_days;
$$;

GRANT EXECUTE ON FUNCTION get_snapshots TO anon, authenticated;
