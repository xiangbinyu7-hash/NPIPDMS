/*
  # Process Development Module Tables

  1. New Tables
    - `process_sequences`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `process_name` (text) - Name of the process step
      - `sequence_level` (integer) - Manufacturing sequence level (1, 2, 3, etc.)
      - `work_hours` (decimal) - Time required for this process in hours
      - `order_index` (integer) - Order within the same level
      - `description` (text) - Process description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `process_flow_charts`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `total_workers` (integer) - Total number of workers needed
      - `takt_time` (decimal) - Takt time in seconds
      - `flow_chart_data` (jsonb) - Generated flow chart data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `line_balance_diagrams`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `file_url` (text) - URL to line balance diagram file
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `standard_work_instructions`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `file_url` (text) - URL to SWI file
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pfmea_documents`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `file_url` (text) - URL to PFMEA file
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `control_plans`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `file_url` (text) - URL to control plan file
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `production_attachments`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `file_name` (text) - Original file name
      - `file_url` (text) - URL to attachment file
      - `file_type` (text) - File type/extension
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for anonymous users to perform all operations
*/

-- Process Sequences Table
CREATE TABLE IF NOT EXISTS process_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  process_name text NOT NULL,
  sequence_level integer NOT NULL DEFAULT 1,
  work_hours decimal(10,2) NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE process_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to process_sequences"
  ON process_sequences FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Process Flow Charts Table
CREATE TABLE IF NOT EXISTS process_flow_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  total_workers integer DEFAULT 0,
  takt_time decimal(10,2) DEFAULT 0,
  flow_chart_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE process_flow_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to process_flow_charts"
  ON process_flow_charts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Line Balance Diagrams Table
CREATE TABLE IF NOT EXISTS line_balance_diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  file_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE line_balance_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to line_balance_diagrams"
  ON line_balance_diagrams FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Standard Work Instructions Table
CREATE TABLE IF NOT EXISTS standard_work_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  file_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE standard_work_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to standard_work_instructions"
  ON standard_work_instructions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- PFMEA Documents Table
CREATE TABLE IF NOT EXISTS pfmea_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  file_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pfmea_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to pfmea_documents"
  ON pfmea_documents FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Control Plans Table
CREATE TABLE IF NOT EXISTS control_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  file_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE control_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to control_plans"
  ON control_plans FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Production Attachments Table
CREATE TABLE IF NOT EXISTS production_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE production_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to production_attachments"
  ON production_attachments FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_process_sequences_config ON process_sequences(configuration_id);
CREATE INDEX IF NOT EXISTS idx_process_sequences_level_order ON process_sequences(configuration_id, sequence_level, order_index);
CREATE INDEX IF NOT EXISTS idx_process_flow_charts_config ON process_flow_charts(configuration_id);
CREATE INDEX IF NOT EXISTS idx_line_balance_diagrams_config ON line_balance_diagrams(configuration_id);
CREATE INDEX IF NOT EXISTS idx_standard_work_instructions_config ON standard_work_instructions(configuration_id);
CREATE INDEX IF NOT EXISTS idx_pfmea_documents_config ON pfmea_documents(configuration_id);
CREATE INDEX IF NOT EXISTS idx_control_plans_config ON control_plans(configuration_id);
CREATE INDEX IF NOT EXISTS idx_production_attachments_config ON production_attachments(configuration_id);
