/*
  # 新产品导入和工艺开发管理系统数据库架构
  
  ## 概述
  此迁移创建完整的NPI（新产品导入）管理系统，包括产品层级结构、工艺开发、试产、成本核算和量产管理。
  
  ## 1. 新增表
  
  ### 产品层级结构
    - `product_series` - 产品系列
      - id (uuid, 主键)
      - name (文本)
      - description (文本)
      - created_at (时间戳)
      
    - `product_subseries` - 产品子系列
      - id (uuid, 主键)
      - series_id (uuid, 外键)
      - name (文本)
      - description (文本)
      - created_at (时间戳)
      
    - `product_configurations` - 产品配置
      - id (uuid, 主键)
      - subseries_id (uuid, 外键)
      - name (文本)
      - description (文本)
      - created_at (时间戳)
      - updated_at (时间戳)
  
  ### 产品基础信息
    - `product_basic_info` - 新产品基础信息
      - id (uuid, 主键)
      - configuration_id (uuid, 外键)
      - design_3d_file_url (文本) - 3D设计图纸URL
      - packaging_sop_url (文本) - 包装设计SOP URL
      - notes (文本)
      - created_at (时间戳)
      - updated_at (时间戳)
  
  ### 工艺开发模块
    - `process_development` - 工艺开发
      - id (uuid, 主键)
      - configuration_id (uuid, 外键)
      - process_flow_chart_url (文本) - 工艺流程图
      - line_balance_chart_url (文本) - 线体平衡图
      - pfmea_url (文本) - PFMEA
      - control_plan_url (文本) - 控制计划
      - work_instruction_url (文本) - 标准作业指导书
      - additional_files_urls (jsonb) - 其他生产附加文件
      - created_at (时间戳)
      - updated_at (时间戳)
  
  ### 试产模块
    - `trial_production` - 试产记录
      - id (uuid, 主键)
      - configuration_id (uuid, 外键)
      - phase (文本) - Demon/EVT/DVT/PVT
      - test_date (日期)
      - quantity (整数)
      - pass_rate (数字)
      - issues_found (jsonb)
      - notes (文本)
      - attachments (jsonb)
      - created_at (时间戳)
      - updated_at (时间戳)
  
  ### 工程造价模块
    - `engineering_cost` - 工程造价
      - id (uuid, 主键)
      - configuration_id (uuid, 外键)
      - workforce_count (整数) - 人数
      - takt_time (数字) - 节拍时间
      - labor_cost_per_hour (数字) - 人力成本单价（每小时）
      - total_work_hours (数字) - 总工时
      - assembly_cost (数字) - 组装费用
      - management_fee_percentage (数字) - 管理费用百分比
      - management_fee (数字) - 管理费用
      - labor_cost_total (数字) - 人力成本总计
      - auxiliary_materials_cost (数字) - 辅料费用（摊销后）
      - logistics_cost (数字) - 物流费用（摊销后）
      - facility_cost (数字) - 公共场地线体费用（摊销后）
      - unit_engineering_cost (数字) - 工程单价
      - created_at (时间戳)
      - updated_at (时间戳)
  
  ### 量产管理模块
    - `mass_production` - 量产管理
      - id (uuid, 主键)
      - configuration_id (uuid, 外键)
      - final_process_flow_url (文本) - 确定的工艺流程图
      - production_sop_url (文本) - 量产SOP
      - final_pfmea_url (文本) - PFMEA
      - final_control_plan_url (文本) - CP控制计划
      - optimization_projects (jsonb) - 优化项目
      - status (文本) - 状态
      - start_date (日期)
      - created_at (时间戳)
      - updated_at (时间戳)
  
  ## 2. 安全性
    - 为所有表启用行级安全（RLS）
    - 为已认证用户添加完整的CRUD权限策略
*/

-- 创建产品系列表
CREATE TABLE IF NOT EXISTS product_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 创建产品子系列表
CREATE TABLE IF NOT EXISTS product_subseries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES product_series(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 创建产品配置表
CREATE TABLE IF NOT EXISTS product_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subseries_id uuid NOT NULL REFERENCES product_subseries(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建产品基础信息表
CREATE TABLE IF NOT EXISTS product_basic_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES product_configurations(id) ON DELETE CASCADE,
  design_3d_file_url text DEFAULT '',
  packaging_sop_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建工艺开发表
CREATE TABLE IF NOT EXISTS process_development (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES product_configurations(id) ON DELETE CASCADE,
  process_flow_chart_url text DEFAULT '',
  line_balance_chart_url text DEFAULT '',
  pfmea_url text DEFAULT '',
  control_plan_url text DEFAULT '',
  work_instruction_url text DEFAULT '',
  additional_files_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建试产表
CREATE TABLE IF NOT EXISTS trial_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES product_configurations(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('Demon', 'EVT', 'DVT', 'PVT')),
  test_date date DEFAULT CURRENT_DATE,
  quantity integer DEFAULT 0,
  pass_rate numeric(5, 2) DEFAULT 0.00,
  issues_found jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建工程造价表
CREATE TABLE IF NOT EXISTS engineering_cost (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES product_configurations(id) ON DELETE CASCADE,
  workforce_count integer DEFAULT 0,
  takt_time numeric(10, 2) DEFAULT 0.00,
  labor_cost_per_hour numeric(10, 2) DEFAULT 0.00,
  total_work_hours numeric(10, 2) DEFAULT 0.00,
  assembly_cost numeric(10, 2) DEFAULT 0.00,
  management_fee_percentage numeric(5, 2) DEFAULT 0.00,
  management_fee numeric(10, 2) DEFAULT 0.00,
  labor_cost_total numeric(10, 2) DEFAULT 0.00,
  auxiliary_materials_cost numeric(10, 2) DEFAULT 0.00,
  logistics_cost numeric(10, 2) DEFAULT 0.00,
  facility_cost numeric(10, 2) DEFAULT 0.00,
  unit_engineering_cost numeric(10, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建量产管理表
CREATE TABLE IF NOT EXISTS mass_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES product_configurations(id) ON DELETE CASCADE,
  final_process_flow_url text DEFAULT '',
  production_sop_url text DEFAULT '',
  final_pfmea_url text DEFAULT '',
  final_control_plan_url text DEFAULT '',
  optimization_projects jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed')),
  start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 为所有表启用行级安全
ALTER TABLE product_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_subseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_production ENABLE ROW LEVEL SECURITY;

-- 为产品系列创建策略
CREATE POLICY "Allow authenticated users to read product series"
  ON product_series FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert product series"
  ON product_series FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product series"
  ON product_series FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product series"
  ON product_series FOR DELETE
  TO authenticated
  USING (true);

-- 为产品子系列创建策略
CREATE POLICY "Allow authenticated users to read product subseries"
  ON product_subseries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert product subseries"
  ON product_subseries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product subseries"
  ON product_subseries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product subseries"
  ON product_subseries FOR DELETE
  TO authenticated
  USING (true);

-- 为产品配置创建策略
CREATE POLICY "Allow authenticated users to read product configurations"
  ON product_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert product configurations"
  ON product_configurations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product configurations"
  ON product_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product configurations"
  ON product_configurations FOR DELETE
  TO authenticated
  USING (true);

-- 为产品基础信息创建策略
CREATE POLICY "Allow authenticated users to read product basic info"
  ON product_basic_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert product basic info"
  ON product_basic_info FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product basic info"
  ON product_basic_info FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product basic info"
  ON product_basic_info FOR DELETE
  TO authenticated
  USING (true);

-- 为工艺开发创建策略
CREATE POLICY "Allow authenticated users to read process development"
  ON process_development FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert process development"
  ON process_development FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update process development"
  ON process_development FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete process development"
  ON process_development FOR DELETE
  TO authenticated
  USING (true);

-- 为试产创建策略
CREATE POLICY "Allow authenticated users to read trial production"
  ON trial_production FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert trial production"
  ON trial_production FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update trial production"
  ON trial_production FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete trial production"
  ON trial_production FOR DELETE
  TO authenticated
  USING (true);

-- 为工程造价创建策略
CREATE POLICY "Allow authenticated users to read engineering cost"
  ON engineering_cost FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert engineering cost"
  ON engineering_cost FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update engineering cost"
  ON engineering_cost FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete engineering cost"
  ON engineering_cost FOR DELETE
  TO authenticated
  USING (true);

-- 为量产管理创建策略
CREATE POLICY "Allow authenticated users to read mass production"
  ON mass_production FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert mass production"
  ON mass_production FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update mass production"
  ON mass_production FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete mass production"
  ON mass_production FOR DELETE
  TO authenticated
  USING (true);