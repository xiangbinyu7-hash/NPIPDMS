/*
  # 创建标准作业指导书表

  ## 概述
  此迁移创建标准作业指导书（Standard Work Instructions）相关的数据表。

  ## 新增表

  ### 1. work_instructions（作业指导书主表）
  - `id` (uuid, primary key) - 主键
  - `configuration_id` (uuid, foreign key) - 关联产品配置
  - `component_id` (uuid, foreign key) - 关联产品部件
  - `process_id` (uuid, foreign key) - 关联工序
  - `title` (text) - 标题
  - `description` (text) - 描述
  - `version` (text) - 版本号
  - `status` (text) - 状态：draft（草稿）、published（已发布）、archived（已归档）
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

  ### 2. work_instruction_steps（作业指导步骤表）
  - `id` (uuid, primary key) - 主键
  - `instruction_id` (uuid, foreign key) - 关联作业指导书
  - `step_number` (integer) - 步骤序号
  - `step_title` (text) - 步骤标题
  - `step_description` (text) - 步骤描述
  - `tools` (jsonb) - 工具列表：[{name: "工具名", spec: "规格"}]
  - `key_points` (jsonb) - 作业要点列表：[{point: "要点内容", priority: "high/medium/low"}]
  - `parameters` (jsonb) - 参数设置：{温度: "120°C", 压力: "2.5MPa"}
  - `video_url` (text) - 视频URL
  - `video_thumbnail` (text) - 视频缩略图
  - `images` (jsonb) - 图片URLs：["url1", "url2"]
  - `duration_seconds` (integer) - 预计耗时（秒）
  - `safety_notes` (text) - 安全注意事项
  - `quality_checkpoints` (jsonb) - 质量检查点：[{item: "检查项", standard: "标准"}]
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

  ## 安全性
  - 对所有表启用 RLS
  - 允许匿名用户读取和修改数据（用于开发环境）
*/

-- 创建作业指导书主表
CREATE TABLE IF NOT EXISTS work_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES product_configurations(id) ON DELETE CASCADE,
  component_id uuid REFERENCES product_components(id) ON DELETE SET NULL,
  process_id uuid REFERENCES process_sequences(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  version text DEFAULT '1.0',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建作业指导步骤表
CREATE TABLE IF NOT EXISTS work_instruction_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id uuid REFERENCES work_instructions(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL DEFAULT 1,
  step_title text NOT NULL DEFAULT '',
  step_description text DEFAULT '',
  tools jsonb DEFAULT '[]'::jsonb,
  key_points jsonb DEFAULT '[]'::jsonb,
  parameters jsonb DEFAULT '{}'::jsonb,
  video_url text DEFAULT '',
  video_thumbnail text DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  duration_seconds integer DEFAULT 0,
  safety_notes text DEFAULT '',
  quality_checkpoints jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_work_instructions_configuration 
  ON work_instructions(configuration_id);
CREATE INDEX IF NOT EXISTS idx_work_instructions_component 
  ON work_instructions(component_id);
CREATE INDEX IF NOT EXISTS idx_work_instructions_process 
  ON work_instructions(process_id);
CREATE INDEX IF NOT EXISTS idx_work_instruction_steps_instruction 
  ON work_instruction_steps(instruction_id);

-- 启用 RLS
ALTER TABLE work_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_instruction_steps ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：允许所有用户读取
CREATE POLICY "Allow public read access on work_instructions"
  ON work_instructions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access on work_instruction_steps"
  ON work_instruction_steps FOR SELECT
  TO anon
  USING (true);

-- 创建 RLS 策略：允许所有用户插入
CREATE POLICY "Allow public insert access on work_instructions"
  ON work_instructions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public insert access on work_instruction_steps"
  ON work_instruction_steps FOR INSERT
  TO anon
  WITH CHECK (true);

-- 创建 RLS 策略：允许所有用户更新
CREATE POLICY "Allow public update access on work_instructions"
  ON work_instructions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public update access on work_instruction_steps"
  ON work_instruction_steps FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 创建 RLS 策略：允许所有用户删除
CREATE POLICY "Allow public delete access on work_instructions"
  ON work_instructions FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public delete access on work_instruction_steps"
  ON work_instruction_steps FOR DELETE
  TO anon
  USING (true);
