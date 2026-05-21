CREATE TABLE politicians (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  party         TEXT NOT NULL,
  photo_url     TEXT,
  active        BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read active politicians"
  ON politicians FOR SELECT USING (active = true);

INSERT INTO politicians (id, name, role, party, display_order) VALUES
('milei',      'Javier Milei',                  'Presidente de la Nación',      'La Libertad Avanza', 1),
('villarruel', 'Victoria Villarruel',            'Vicepresidenta de la Nación',  'La Libertad Avanza', 2),
('bullrich',   'Patricia Bullrich',              'Ministra de Seguridad',        'PRO',                3),
('kicillof',   'Axel Kicillof',                 'Gobernador de Buenos Aires',   'Unión por la Patria',4),
('cfk',        'Cristina Fernández de Kirchner', 'Ex presidenta / Senadora',     'Unión por la Patria',5),
('macri',      'Mauricio Macri',                 'Ex presidente',                'PRO',                6),
('jmacri',     'Jorge Macri',                   'Jefe de Gobierno CABA',        'PRO',                7),
('larreta',    'Horacio Rodríguez Larreta',      'Ex jefe de Gobierno CABA',     'PRO',                8),
('massa',      'Sergio Massa',                   'Ex ministro de Economía',      'Unión por la Patria',9);
