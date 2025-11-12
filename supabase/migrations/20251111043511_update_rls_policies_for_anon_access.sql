/*
  # 更新RLS策略以允许匿名访问

  ## 概述
  此迁移更新所有表的行级安全策略，允许匿名用户进行完整的CRUD操作。
  这使得应用程序无需认证即可使用。

  ## 修改内容
  - 删除所有现有的限制性策略
  - 为所有表添加允许匿名用户访问的新策略
*/

-- 删除旧策略并创建新的允许所有人访问的策略

-- 产品系列策略
DROP POLICY IF EXISTS "Allow authenticated users to read product series" ON product_series;
DROP POLICY IF EXISTS "Allow authenticated users to insert product series" ON product_series;
DROP POLICY IF EXISTS "Allow authenticated users to update product series" ON product_series;
DROP POLICY IF EXISTS "Allow authenticated users to delete product series" ON product_series;

CREATE POLICY "Allow all users to read product series"
  ON product_series FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert product series"
  ON product_series FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update product series"
  ON product_series FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete product series"
  ON product_series FOR DELETE
  USING (true);

-- 产品子系列策略
DROP POLICY IF EXISTS "Allow authenticated users to read product subseries" ON product_subseries;
DROP POLICY IF EXISTS "Allow authenticated users to insert product subseries" ON product_subseries;
DROP POLICY IF EXISTS "Allow authenticated users to update product subseries" ON product_subseries;
DROP POLICY IF EXISTS "Allow authenticated users to delete product subseries" ON product_subseries;

CREATE POLICY "Allow all users to read product subseries"
  ON product_subseries FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert product subseries"
  ON product_subseries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update product subseries"
  ON product_subseries FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete product subseries"
  ON product_subseries FOR DELETE
  USING (true);

-- 产品配置策略
DROP POLICY IF EXISTS "Allow authenticated users to read product configurations" ON product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to insert product configurations" ON product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to update product configurations" ON product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to delete product configurations" ON product_configurations;

CREATE POLICY "Allow all users to read product configurations"
  ON product_configurations FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert product configurations"
  ON product_configurations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update product configurations"
  ON product_configurations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete product configurations"
  ON product_configurations FOR DELETE
  USING (true);

-- 产品基础信息策略
DROP POLICY IF EXISTS "Allow authenticated users to read product basic info" ON product_basic_info;
DROP POLICY IF EXISTS "Allow authenticated users to insert product basic info" ON product_basic_info;
DROP POLICY IF EXISTS "Allow authenticated users to update product basic info" ON product_basic_info;
DROP POLICY IF EXISTS "Allow authenticated users to delete product basic info" ON product_basic_info;

CREATE POLICY "Allow all users to read product basic info"
  ON product_basic_info FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert product basic info"
  ON product_basic_info FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update product basic info"
  ON product_basic_info FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete product basic info"
  ON product_basic_info FOR DELETE
  USING (true);

-- 工艺开发策略
DROP POLICY IF EXISTS "Allow authenticated users to read process development" ON process_development;
DROP POLICY IF EXISTS "Allow authenticated users to insert process development" ON process_development;
DROP POLICY IF EXISTS "Allow authenticated users to update process development" ON process_development;
DROP POLICY IF EXISTS "Allow authenticated users to delete process development" ON process_development;

CREATE POLICY "Allow all users to read process development"
  ON process_development FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert process development"
  ON process_development FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update process development"
  ON process_development FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete process development"
  ON process_development FOR DELETE
  USING (true);

-- 试产策略
DROP POLICY IF EXISTS "Allow authenticated users to read trial production" ON trial_production;
DROP POLICY IF EXISTS "Allow authenticated users to insert trial production" ON trial_production;
DROP POLICY IF EXISTS "Allow authenticated users to update trial production" ON trial_production;
DROP POLICY IF EXISTS "Allow authenticated users to delete trial production" ON trial_production;

CREATE POLICY "Allow all users to read trial production"
  ON trial_production FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert trial production"
  ON trial_production FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update trial production"
  ON trial_production FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete trial production"
  ON trial_production FOR DELETE
  USING (true);

-- 工程造价策略
DROP POLICY IF EXISTS "Allow authenticated users to read engineering cost" ON engineering_cost;
DROP POLICY IF EXISTS "Allow authenticated users to insert engineering cost" ON engineering_cost;
DROP POLICY IF EXISTS "Allow authenticated users to update engineering cost" ON engineering_cost;
DROP POLICY IF EXISTS "Allow authenticated users to delete engineering cost" ON engineering_cost;

CREATE POLICY "Allow all users to read engineering cost"
  ON engineering_cost FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert engineering cost"
  ON engineering_cost FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update engineering cost"
  ON engineering_cost FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete engineering cost"
  ON engineering_cost FOR DELETE
  USING (true);

-- 量产管理策略
DROP POLICY IF EXISTS "Allow authenticated users to read mass production" ON mass_production;
DROP POLICY IF EXISTS "Allow authenticated users to insert mass production" ON mass_production;
DROP POLICY IF EXISTS "Allow authenticated users to update mass production" ON mass_production;
DROP POLICY IF EXISTS "Allow authenticated users to delete mass production" ON mass_production;

CREATE POLICY "Allow all users to read mass production"
  ON mass_production FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert mass production"
  ON mass_production FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update mass production"
  ON mass_production FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete mass production"
  ON mass_production FOR DELETE
  USING (true);