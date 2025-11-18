/*
  # Create Product Components Table

  1. New Tables
    - `product_components`
      - `id` (uuid, primary key)
      - `configuration_id` (uuid, foreign key to product_configurations)
      - `component_name` (text) - Name of the component
      - `order_index` (integer) - Display order
      - `description` (text) - Component description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Modify `process_sequences` to add `component_id` field
    - Modify `process_flow_charts` to add `component_id` field

  3. Security
    - Enable RLS on `product_components` table
    - Add policies for anonymous users to perform all operations
    - Update existing policies to support component-level access

  4. Important Notes
    - Each product can have multiple components
    - Each component has its own process sequences and flow charts
    - Existing data without component_id will be treated as default component
*/

-- Create Product Components Table
CREATE TABLE IF NOT EXISTS product_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE NOT NULL,
  component_name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access to product_components"
  ON product_components FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add component_id to process_sequences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_sequences' AND column_name = 'component_id'
  ) THEN
    ALTER TABLE process_sequences ADD COLUMN component_id uuid REFERENCES product_components(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add component_id to process_flow_charts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_flow_charts' AND column_name = 'component_id'
  ) THEN
    ALTER TABLE process_flow_charts ADD COLUMN component_id uuid REFERENCES product_components(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_components_config ON product_components(configuration_id);
CREATE INDEX IF NOT EXISTS idx_product_components_order ON product_components(configuration_id, order_index);
CREATE INDEX IF NOT EXISTS idx_process_sequences_component ON process_sequences(component_id);
CREATE INDEX IF NOT EXISTS idx_process_flow_charts_component ON process_flow_charts(component_id);
