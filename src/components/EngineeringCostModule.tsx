import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EngineeringCost } from '../types';
import { DollarSign, Save, Calculator } from 'lucide-react';

interface EngineeringCostModuleProps {
  configurationId: string;
}

export default function EngineeringCostModule({ configurationId }: EngineeringCostModuleProps) {
  const [costData, setCostData] = useState<EngineeringCost | null>(null);
  const [workforceCount, setWorkforceCount] = useState(0);
  const [taktTime, setTaktTime] = useState(0);
  const [laborCostPerHour, setLaborCostPerHour] = useState(0);
  const [managementFeePercentage, setManagementFeePercentage] = useState(0);
  const [auxiliaryMaterialsCost, setAuxiliaryMaterialsCost] = useState(0);
  const [logisticsCost, setLogisticsCost] = useState(0);
  const [facilityCost, setFacilityCost] = useState(0);
  const [loading, setLoading] = useState(false);

  const [calculatedValues, setCalculatedValues] = useState({
    totalWorkHours: 0,
    assemblyCost: 0,
    managementFee: 0,
    laborCostTotal: 0,
    unitEngineeringCost: 0,
  });

  useEffect(() => {
    loadCostData();
  }, [configurationId]);

  useEffect(() => {
    calculateCosts();
  }, [
    workforceCount,
    taktTime,
    laborCostPerHour,
    managementFeePercentage,
    auxiliaryMaterialsCost,
    logisticsCost,
    facilityCost,
  ]);

  const loadCostData = async () => {
    const { data } = await supabase
      .from('engineering_cost')
      .select('*')
      .eq('configuration_id', configurationId)
      .maybeSingle();

    if (data) {
      setCostData(data);
      setWorkforceCount(data.workforce_count || 0);
      setTaktTime(data.takt_time || 0);
      setLaborCostPerHour(data.labor_cost_per_hour || 0);
      setManagementFeePercentage(data.management_fee_percentage || 0);
      setAuxiliaryMaterialsCost(data.auxiliary_materials_cost || 0);
      setLogisticsCost(data.logistics_cost || 0);
      setFacilityCost(data.facility_cost || 0);
    }
  };

  const calculateCosts = () => {
    const totalWorkHours = (workforceCount * taktTime) / 3600;

    const assemblyCost = totalWorkHours * laborCostPerHour;

    const managementFee = assemblyCost * (managementFeePercentage / 100);

    const laborCostTotal = assemblyCost + managementFee;

    const unitEngineeringCost =
      laborCostTotal + auxiliaryMaterialsCost + logisticsCost + facilityCost;

    setCalculatedValues({
      totalWorkHours: Number(totalWorkHours.toFixed(4)),
      assemblyCost: Number(assemblyCost.toFixed(2)),
      managementFee: Number(managementFee.toFixed(2)),
      laborCostTotal: Number(laborCostTotal.toFixed(2)),
      unitEngineeringCost: Number(unitEngineeringCost.toFixed(2)),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        configuration_id: configurationId,
        workforce_count: workforceCount,
        takt_time: taktTime,
        labor_cost_per_hour: laborCostPerHour,
        total_work_hours: calculatedValues.totalWorkHours,
        assembly_cost: calculatedValues.assemblyCost,
        management_fee_percentage: managementFeePercentage,
        management_fee: calculatedValues.managementFee,
        labor_cost_total: calculatedValues.laborCostTotal,
        auxiliary_materials_cost: auxiliaryMaterialsCost,
        logistics_cost: logisticsCost,
        facility_cost: facilityCost,
        unit_engineering_cost: calculatedValues.unitEngineeringCost,
        updated_at: new Date().toISOString(),
      };

      if (costData) {
        await supabase
          .from('engineering_cost')
          .update(dataToSave)
          .eq('id', costData.id);
      } else {
        await supabase.from('engineering_cost').insert([dataToSave]);
      }
      loadCostData();
      alert('保存成功！');
    } catch (error) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <DollarSign size={24} />
        工程造价
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">人数</label>
          <input
            type="number"
            value={workforceCount}
            onChange={(e) => setWorkforceCount(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">节拍时间 (秒)</label>
          <input
            type="number"
            value={taktTime}
            onChange={(e) => setTaktTime(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">人力成本单价 (元/小时)</label>
          <input
            type="number"
            value={laborCostPerHour}
            onChange={(e) => setLaborCostPerHour(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">管理费用百分比 (%)</label>
          <input
            type="number"
            value={managementFeePercentage}
            onChange={(e) => setManagementFeePercentage(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">辅料费用 (元/件)</label>
          <input
            type="number"
            value={auxiliaryMaterialsCost}
            onChange={(e) => setAuxiliaryMaterialsCost(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">物流费用 (元/件)</label>
          <input
            type="number"
            value={logisticsCost}
            onChange={(e) => setLogisticsCost(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">公共场地线体费用 (元/件)</label>
          <input
            type="number"
            value={facilityCost}
            onChange={(e) => setFacilityCost(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calculator size={20} />
          计算结果
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">总工时</p>
            <p className="text-xl font-bold text-gray-800">{calculatedValues.totalWorkHours} 小时</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">组装费用</p>
            <p className="text-xl font-bold text-gray-800">¥{calculatedValues.assemblyCost}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">管理费用</p>
            <p className="text-xl font-bold text-gray-800">¥{calculatedValues.managementFee}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">人力成本总计</p>
            <p className="text-xl font-bold text-gray-800">¥{calculatedValues.laborCostTotal}</p>
          </div>
          <div className="bg-white p-4 rounded-lg md:col-span-2">
            <p className="text-sm text-gray-600">工程单价</p>
            <p className="text-2xl font-bold text-blue-600">¥{calculatedValues.unitEngineeringCost}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        <Save size={20} />
        {loading ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
