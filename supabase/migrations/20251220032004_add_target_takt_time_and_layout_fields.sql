/*
  # Add Target Parameters and Layout Fields to Process Flow Charts

  1. Changes
    - Add `target_takt_time` column to store user-defined target takt time
    - Add `target_station_count` column to store user-defined target station count
    - Add `layout_nodes` column to store custom layout node positions
    - Add `layout_connections` column to store custom layout connections
    
  2. Purpose
    - `target_takt_time`: Saves the takt time target set by the user (nullable, user may not set)
    - `takt_time`: Remains as the actual calculated takt time from the algorithm
    - `target_station_count`: Saves the station count target set by the user (nullable)
    - `total_workers`: Remains as the actual calculated worker count from the algorithm
    - `layout_nodes` and `layout_connections`: Store custom layout modifications
    
  3. Notes
    - These fields allow distinguishing between user input and system-calculated values
    - Prevents user input from being overwritten by calculation results
    - All new fields are nullable to maintain backward compatibility
*/

DO $$
BEGIN
  -- Add target_takt_time column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_flow_charts' AND column_name = 'target_takt_time'
  ) THEN
    ALTER TABLE process_flow_charts ADD COLUMN target_takt_time decimal(10,2);
  END IF;

  -- Add target_station_count column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_flow_charts' AND column_name = 'target_station_count'
  ) THEN
    ALTER TABLE process_flow_charts ADD COLUMN target_station_count integer;
  END IF;

  -- Add layout_nodes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_flow_charts' AND column_name = 'layout_nodes'
  ) THEN
    ALTER TABLE process_flow_charts ADD COLUMN layout_nodes jsonb DEFAULT '[]';
  END IF;

  -- Add layout_connections column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_flow_charts' AND column_name = 'layout_connections'
  ) THEN
    ALTER TABLE process_flow_charts ADD COLUMN layout_connections jsonb DEFAULT '[]';
  END IF;
END $$;