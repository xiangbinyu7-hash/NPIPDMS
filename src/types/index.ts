export interface ProductSeries {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ProductSubseries {
  id: string;
  series_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ProductConfiguration {
  id: string;
  subseries_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBasicInfo {
  id: string;
  configuration_id: string;
  design_3d_file_url: string;
  packaging_sop_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessDevelopment {
  id: string;
  configuration_id: string;
  process_flow_chart_url: string;
  line_balance_chart_url: string;
  pfmea_url: string;
  control_plan_url: string;
  work_instruction_url: string;
  additional_files_urls: any[];
  created_at: string;
  updated_at: string;
}

export interface TrialProduction {
  id: string;
  configuration_id: string;
  phase: 'Demon' | 'EVT' | 'DVT' | 'PVT';
  test_date: string;
  quantity: number;
  pass_rate: number;
  issues_found: any[];
  notes: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface EngineeringCost {
  id: string;
  configuration_id: string;
  workforce_count: number;
  takt_time: number;
  labor_cost_per_hour: number;
  total_work_hours: number;
  assembly_cost: number;
  management_fee_percentage: number;
  management_fee: number;
  labor_cost_total: number;
  auxiliary_materials_cost: number;
  logistics_cost: number;
  facility_cost: number;
  unit_engineering_cost: number;
  created_at: string;
  updated_at: string;
}

export interface MassProduction {
  id: string;
  configuration_id: string;
  final_process_flow_url: string;
  production_sop_url: string;
  final_pfmea_url: string;
  final_control_plan_url: string;
  optimization_projects: any[];
  status: 'planning' | 'in_progress' | 'completed';
  start_date: string | null;
  created_at: string;
  updated_at: string;
}
