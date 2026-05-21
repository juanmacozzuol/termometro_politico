-- Termómetro Político Argentino — schema inicial

CREATE TABLE votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pol_id      TEXT NOT NULL,
  category    TEXT NOT NULL,
  vote        TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  province    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, pol_id, category)
);

CREATE INDEX idx_votes_pol  ON votes(pol_id);
CREATE INDEX idx_votes_cat  ON votes(pol_id, category);
CREATE INDEX idx_votes_prov ON votes(pol_id, province);
CREATE INDEX idx_votes_time ON votes(pol_id, updated_at);

CREATE VIEW vote_aggregates AS
SELECT
  pol_id,
  category,
  COUNT(*) FILTER (WHERE vote = 'approve') AS approvals,
  COUNT(*) FILTER (WHERE vote = 'reject')  AS rejections,
  COUNT(*)                                 AS total
FROM votes
GROUP BY pol_id, category;

CREATE VIEW vote_by_province AS
SELECT
  pol_id,
  province,
  COUNT(*) FILTER (WHERE vote = 'approve') AS approvals,
  COUNT(*) FILTER (WHERE vote = 'reject')  AS rejections
FROM votes
WHERE province IS NOT NULL
GROUP BY pol_id, province;

CREATE TABLE daily_snapshots (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pol_id   TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  date     DATE NOT NULL DEFAULT CURRENT_DATE,
  approval INT NOT NULL,
  total    INT NOT NULL,
  UNIQUE (pol_id, category, date)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own votes"
  ON votes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own votes"
  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own votes"
  ON votes FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT ON vote_aggregates  TO anon, authenticated;
GRANT SELECT ON vote_by_province TO anon, authenticated;
GRANT SELECT ON daily_snapshots  TO anon, authenticated;
