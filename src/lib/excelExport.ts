import * as XLSX from 'xlsx';

interface WorkInstructionStep {
  step_number: number;
  step_title: string;
  step_description: string;
  tools: Array<{ name: string; spec?: string }>;
  key_points: Array<{ point: string; priority?: string }>;
  parameters: Record<string, any>;
  video_url: string;
  duration_seconds: number;
  safety_notes: string;
  quality_checkpoints: Array<{ item: string; standard?: string }>;
}

interface WorkInstruction {
  id?: string;
  title: string;
  description: string;
  version: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  process_name?: string;
  steps?: WorkInstructionStep[];
}

export function exportWorkInstructionToExcel(instruction: WorkInstruction) {
  const workbook = XLSX.utils.book_new();

  const basicInfoData = [
    ['标准作业指导书'],
    [],
    ['基本信息'],
    ['标题', instruction.title],
    ['工序', instruction.process_name || '未关联'],
    ['描述', instruction.description || '无'],
    ['版本', instruction.version],
    ['状态', getStatusText(instruction.status)],
    ['创建时间', formatDate(instruction.created_at)],
    ['更新时间', formatDate(instruction.updated_at)],
    [],
  ];

  if (instruction.steps && instruction.steps.length > 0) {
    basicInfoData.push(['作业步骤']);
    basicInfoData.push([]);

    instruction.steps.forEach((step) => {
      basicInfoData.push([`步骤 ${step.step_number}`, step.step_title]);

      if (step.step_description) {
        basicInfoData.push(['步骤说明', step.step_description]);
      }

      if (step.duration_seconds > 0) {
        basicInfoData.push(['预计耗时', `${step.duration_seconds}秒`]);
      }

      if (step.tools && step.tools.length > 0) {
        basicInfoData.push(['工具清单', '']);
        step.tools.forEach((tool) => {
          basicInfoData.push(['', `• ${tool.name}${tool.spec ? ` (${tool.spec})` : ''}`]);
        });
      }

      if (step.key_points && step.key_points.length > 0) {
        basicInfoData.push(['作业要点', '']);
        step.key_points.forEach((kp) => {
          const priority = kp.priority === 'high' ? '[高]' : kp.priority === 'medium' ? '[中]' : '[低]';
          basicInfoData.push(['', `${priority} ${kp.point}`]);
        });
      }

      if (step.parameters && Object.keys(step.parameters).length > 0) {
        basicInfoData.push(['工艺参数', '']);
        Object.entries(step.parameters).forEach(([key, value]) => {
          basicInfoData.push(['', `${key}: ${value}`]);
        });
      }

      if (step.quality_checkpoints && step.quality_checkpoints.length > 0) {
        basicInfoData.push(['质量检查点', '']);
        step.quality_checkpoints.forEach((qc) => {
          basicInfoData.push(['', `• ${qc.item}${qc.standard ? ` - ${qc.standard}` : ''}`]);
        });
      }

      if (step.safety_notes) {
        basicInfoData.push(['安全注意事项', step.safety_notes]);
      }

      if (step.video_url) {
        basicInfoData.push(['视频链接', step.video_url]);
      }

      basicInfoData.push([]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(basicInfoData);

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 60 }
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      if (R === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (R === 2 || (worksheet[cellAddress].v &&
                 (worksheet[cellAddress].v === '作业步骤' ||
                  String(worksheet[cellAddress].v).startsWith('步骤 ')))) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 14 },
          fill: { fgColor: { rgb: 'E7F3FF' } }
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, '作业指导书');

  const fileName = `${instruction.title}_${instruction.version}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportMultipleWorkInstructionsToExcel(instructions: WorkInstruction[]) {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['标准作业指导书汇总'],
    [],
    ['序号', '工序', '标题', '版本', '状态', '更新时间'],
  ];

  instructions.forEach((instruction, index) => {
    summaryData.push([
      index + 1,
      instruction.process_name || '未关联',
      instruction.title,
      instruction.version,
      getStatusText(instruction.status),
      formatDate(instruction.updated_at)
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总');

  instructions.forEach((instruction) => {
    const sheetData = [
      [instruction.title],
      [],
      ['基本信息'],
      ['标题', instruction.title],
      ['工序', instruction.process_name || '未关联'],
      ['描述', instruction.description || '无'],
      ['版本', instruction.version],
      ['状态', getStatusText(instruction.status)],
      [],
    ];

    if (instruction.steps && instruction.steps.length > 0) {
      sheetData.push(['作业步骤']);
      sheetData.push([]);

      instruction.steps.forEach((step) => {
        sheetData.push([`步骤 ${step.step_number}`, step.step_title]);

        if (step.step_description) {
          sheetData.push(['步骤说明', step.step_description]);
        }

        if (step.duration_seconds > 0) {
          sheetData.push(['预计耗时', `${step.duration_seconds}秒`]);
        }

        if (step.tools && step.tools.length > 0) {
          sheetData.push(['工具清单', '']);
          step.tools.forEach((tool) => {
            sheetData.push(['', `• ${tool.name}${tool.spec ? ` (${tool.spec})` : ''}`]);
          });
        }

        if (step.key_points && step.key_points.length > 0) {
          sheetData.push(['作业要点', '']);
          step.key_points.forEach((kp) => {
            const priority = kp.priority === 'high' ? '[高]' : kp.priority === 'medium' ? '[中]' : '[低]';
            sheetData.push(['', `${priority} ${kp.point}`]);
          });
        }

        if (step.parameters && Object.keys(step.parameters).length > 0) {
          sheetData.push(['工艺参数', '']);
          Object.entries(step.parameters).forEach(([key, value]) => {
            sheetData.push(['', `${key}: ${value}`]);
          });
        }

        if (step.quality_checkpoints && step.quality_checkpoints.length > 0) {
          sheetData.push(['质量检查点', '']);
          step.quality_checkpoints.forEach((qc) => {
            sheetData.push(['', `• ${qc.item}${qc.standard ? ` - ${qc.standard}` : ''}`]);
          });
        }

        if (step.safety_notes) {
          sheetData.push(['安全注意事项', step.safety_notes]);
        }

        sheetData.push([]);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 60 }
    ];

    const sheetName = (instruction.process_name || instruction.title).substring(0, 30);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const fileName = `作业指导书汇总_${instructions.length}份_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  };
  return statusMap[status] || status;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
