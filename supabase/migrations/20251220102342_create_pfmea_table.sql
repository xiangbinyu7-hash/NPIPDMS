/*
  # Create PFMEA (Process Failure Mode and Effects Analysis) Table

  1. New Tables
    - pfmea_items
      - id (uuid, primary key)
      - configuration_id (uuid, foreign key)
      - process_id (uuid, foreign key)
      - failure_mode (text)
      - failure_effects (text)
      - failure_causes (text)
      - current_controls (text)
      - severity (integer, 1-10)
      - occurrence (integer, 1-10)
      - detection (integer, 1-10)
      - rpn (integer, computed)
      - recommended_actions (text)
      - responsible_person (text)
      - target_date (date)
      - actions_taken (text)
      - status (text)
      - severity_after (integer)
      - occurrence_after (integer)
      - detection_after (integer)
      - rpn_after (integer)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on pfmea_items table
    - Add policies for public access
*/

-- Create pfmea_items table
CREATE TABLE IF NOT EXISTS pfmea_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE,
  process_id uuid REFERENCES process_sequences(id) ON DELETE CASCADE,
  failure_mode text NOT NULL,
  failure_effects text DEFAULT '',
  failure_causes text DEFAULT '',
  current_controls text DEFAULT '',
  severity integer NOT NULL CHECK (severity >= 1 AND severity <= 10),
  occurrence integer NOT NULL CHECK (occurrence >= 1 AND occurrence <= 10),
  detection integer NOT NULL CHECK (detection >= 1 AND detection <= 10),
  rpn integer GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
  recommended_actions text DEFAULT '',
  responsible_person text DEFAULT '',
  target_date date,
  actions_taken text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'overdue', 'completed')),
  severity_after integer CHECK (severity_after IS NULL OR (severity_after >= 1 AND severity_after <= 10)),
  occurrence_after integer CHECK (occurrence_after IS NULL OR (occurrence_after >= 1 AND occurrence_after <= 10)),
  detection_after integer CHECK (detection_after IS NULL OR (detection_after >= 1 AND detection_after <= 10)),
  rpn_after integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pfmea_configuration_id ON pfmea_items(configuration_id);
CREATE INDEX IF NOT EXISTS idx_pfmea_process_id ON pfmea_items(process_id);
CREATE INDEX IF NOT EXISTS idx_pfmea_rpn ON pfmea_items(rpn DESC);
CREATE INDEX IF NOT EXISTS idx_pfmea_status ON pfmea_items(status);

-- Enable RLS
ALTER TABLE pfmea_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to pfmea_items"
  ON pfmea_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to pfmea_items"
  ON pfmea_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to pfmea_items"
  ON pfmea_items
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to pfmea_items"
  ON pfmea_items
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pfmea_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pfmea_items_updated_at
  BEFORE UPDATE ON pfmea_items
  FOR EACH ROW
  EXECUTE FUNCTION update_pfmea_items_updated_at();