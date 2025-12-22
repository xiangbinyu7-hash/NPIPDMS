/*
  # Create Production Batch Management System

  1. New Tables
    - production_batches (量产批次主表)
      - id (uuid, primary key)
      - configuration_id (uuid, foreign key)
      - batch_number (text) - 批次号
      - production_date (date) - 生产日期
      - planned_quantity (integer) - 计划产量
      - actual_quantity (integer) - 实际产量
      - qualified_quantity (integer) - 合格产量
      - defect_rate (numeric) - 不良率
      - notes (text) - 备注
      - status (text) - 状态
      - created_at, updated_at

    - production_defects (不良品记录)
      - id, batch_id, defect_type, quantity, description, root_cause, corrective_action

    - production_issues (异常问题追踪)
      - id, batch_id, issue_type, description, severity, status, responsible_person, resolution

    - production_tools_needed (待补充工具/物品)
      - id, batch_id, item_name, category, quantity, priority, status, notes

    - production_materials (补料/耗损)
      - id, batch_id, material_name, material_type, planned_quantity, actual_quantity, wastage

    - production_optimizations (优化记录)
      - id, batch_id, optimization_type, description, status, expected_benefit, actual_benefit

    - production_changes (工艺/物料变更)
      - id, batch_id, change_type, change_description, reason, approval_status, implemented_date

  2. Security
    - Enable RLS on all tables
    - Add public access policies
*/

-- Create production_batches table
CREATE TABLE IF NOT EXISTS production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  production_date date DEFAULT CURRENT_DATE,
  planned_quantity integer DEFAULT 0,
  actual_quantity integer DEFAULT 0,
  qualified_quantity integer DEFAULT 0,
  defect_rate numeric DEFAULT 0.00,
  notes text DEFAULT '',
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create production_defects table
CREATE TABLE IF NOT EXISTS production_defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE,
  defect_type text NOT NULL,
  quantity integer DEFAULT 1,
  description text DEFAULT '',
  root_cause text DEFAULT '',
  corrective_action text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create production_issues table
CREATE TABLE IF NOT EXISTS production_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  responsible_person text DEFAULT '',
  resolution text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create production_tools_needed table
CREATE TABLE IF NOT EXISTS production_tools_needed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text DEFAULT 'tool' CHECK (category IN ('tool', 'equipment', 'material', 'other')),
  quantity integer DEFAULT 1,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create production_materials table
CREATE TABLE IF NOT EXISTS production_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  material_type text DEFAULT 'raw' CHECK (material_type IN ('raw', 'auxiliary', 'packaging', 'other')),
  planned_quantity numeric DEFAULT 0,
  actual_quantity numeric DEFAULT 0,
  wastage numeric DEFAULT 0,
  unit text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create production_optimizations table
CREATE TABLE IF NOT EXISTS production_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE,
  optimization_type text DEFAULT 'current' CHECK (optimization_type IN ('current', 'next')),
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'in_progress', 'implemented', 'rejected')),
  expected_benefit text DEFAULT '',
  actual_benefit text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create production_changes table
CREATE TABLE IF NOT EXISTS production_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE,
  change_type text DEFAULT 'process' CHECK (change_type IN ('process', 'material', 'equipment', 'other')),
  change_description text NOT NULL,
  reason text DEFAULT '',
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  implemented_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_production_batches_config ON production_batches(configuration_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(production_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_defects_batch ON production_defects(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_issues_batch ON production_issues(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_tools_batch ON production_tools_needed(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_materials_batch ON production_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_optimizations_batch ON production_optimizations(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_changes_batch ON production_changes(batch_id);

-- Enable RLS
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tools_needed ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_changes ENABLE ROW LEVEL SECURITY;

-- Create policies for production_batches
CREATE POLICY "Allow public read access to production_batches"
  ON production_batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_batches"
  ON production_batches FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_batches"
  ON production_batches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_batches"
  ON production_batches FOR DELETE TO anon, authenticated USING (true);

-- Create policies for production_defects
CREATE POLICY "Allow public read access to production_defects"
  ON production_defects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_defects"
  ON production_defects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_defects"
  ON production_defects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_defects"
  ON production_defects FOR DELETE TO anon, authenticated USING (true);

-- Create policies for production_issues
CREATE POLICY "Allow public read access to production_issues"
  ON production_issues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_issues"
  ON production_issues FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_issues"
  ON production_issues FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_issues"
  ON production_issues FOR DELETE TO anon, authenticated USING (true);

-- Create policies for production_tools_needed
CREATE POLICY "Allow public read access to production_tools_needed"
  ON production_tools_needed FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_tools_needed"
  ON production_tools_needed FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_tools_needed"
  ON production_tools_needed FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_tools_needed"
  ON production_tools_needed FOR DELETE TO anon, authenticated USING (true);

-- Create policies for production_materials
CREATE POLICY "Allow public read access to production_materials"
  ON production_materials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_materials"
  ON production_materials FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_materials"
  ON production_materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_materials"
  ON production_materials FOR DELETE TO anon, authenticated USING (true);

-- Create policies for production_optimizations
CREATE POLICY "Allow public read access to production_optimizations"
  ON production_optimizations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_optimizations"
  ON production_optimizations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_optimizations"
  ON production_optimizations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_optimizations"
  ON production_optimizations FOR DELETE TO anon, authenticated USING (true);

-- Create policies for production_changes
CREATE POLICY "Allow public read access to production_changes"
  ON production_changes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to production_changes"
  ON production_changes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to production_changes"
  ON production_changes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to production_changes"
  ON production_changes FOR DELETE TO anon, authenticated USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_production_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_production_batches_updated_at
  BEFORE UPDATE ON production_batches
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();

CREATE TRIGGER update_production_defects_updated_at
  BEFORE UPDATE ON production_defects
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();

CREATE TRIGGER update_production_issues_updated_at
  BEFORE UPDATE ON production_issues
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();

CREATE TRIGGER update_production_tools_updated_at
  BEFORE UPDATE ON production_tools_needed
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();

CREATE TRIGGER update_production_materials_updated_at
  BEFORE UPDATE ON production_materials
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();

CREATE TRIGGER update_production_optimizations_updated_at
  BEFORE UPDATE ON production_optimizations
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();

CREATE TRIGGER update_production_changes_updated_at
  BEFORE UPDATE ON production_changes
  FOR EACH ROW EXECUTE FUNCTION update_production_batches_updated_at();