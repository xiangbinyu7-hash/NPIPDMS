import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ProductBasicInfo } from '../types';
import { Upload, FileText, Save, Download, X } from 'lucide-react';

interface BasicInfoModuleProps {
  configurationId: string;
}

export default function BasicInfoModule({ configurationId }: BasicInfoModuleProps) {
  const [basicInfo, setBasicInfo] = useState<ProductBasicInfo | null>(null);
  const [design3dUrl, setDesign3dUrl] = useState('');
  const [packagingSopUrl, setPackagingSopUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading3d, setUploading3d] = useState(false);
  const [uploadingSop, setUploadingSop] = useState(false);

  const design3dInputRef = useRef<HTMLInputElement>(null);
  const packagingSopInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBasicInfo();
  }, [configurationId]);

  const loadBasicInfo = async () => {
    const { data } = await supabase
      .from('product_basic_info')
      .select('*')
      .eq('configuration_id', configurationId)
      .maybeSingle();

    if (data) {
      setBasicInfo(data);
      setDesign3dUrl(data.design_3d_file_url || '');
      setPackagingSopUrl(data.packaging_sop_url || '');
      setNotes(data.notes || '');
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const bucketName = 'product-files';
      const fileName = `${path}/${Date.now()}_${file.name}`;

      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800,
        });
      }

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handle3dFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.stp') && !file.name.toLowerCase().endsWith('.step')) {
      alert('请上传STP格式的3D设计图纸文件');
      return;
    }

    setUploading3d(true);
    try {
      const url = await uploadFile(file, `design-3d/${configurationId}`);
      if (url) {
        setDesign3dUrl(url);
        alert('3D设计图纸上传成功！');
      } else {
        alert('文件上传失败，请重试');
      }
    } catch (error) {
      alert('文件上传失败');
    } finally {
      setUploading3d(false);
      if (design3dInputRef.current) {
        design3dInputRef.current.value = '';
      }
    }
  };

  const handleSopFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      alert('请上传XLSX格式的包装设计SOP文件');
      return;
    }

    setUploadingSop(true);
    try {
      const url = await uploadFile(file, `packaging-sop/${configurationId}`);
      if (url) {
        setPackagingSopUrl(url);
        alert('包装设计SOP上传成功！');
      } else {
        alert('文件上传失败，请重试');
      }
    } catch (error) {
      alert('文件上传失败');
    } finally {
      setUploadingSop(false);
      if (packagingSopInputRef.current) {
        packagingSopInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (basicInfo) {
        await supabase
          .from('product_basic_info')
          .update({
            design_3d_file_url: design3dUrl,
            packaging_sop_url: packagingSopUrl,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', basicInfo.id);
      } else {
        await supabase
          .from('product_basic_info')
          .insert([{
            configuration_id: configurationId,
            design_3d_file_url: design3dUrl,
            packaging_sop_url: packagingSopUrl,
            notes,
          }]);
      }
      loadBasicInfo();
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
        <FileText size={24} />
        新产品基础信息
      </h2>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            3D设计图纸 (STP格式)
          </label>

          <div className="flex gap-3 mb-3">
            <input
              ref={design3dInputRef}
              type="file"
              accept=".stp,.step"
              onChange={handle3dFileUpload}
              className="hidden"
            />
            <button
              onClick={() => design3dInputRef.current?.click()}
              disabled={uploading3d}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Upload size={18} />
              {uploading3d ? '上传中...' : '上传STP文件'}
            </button>

            {design3dUrl && (
              <>
                <a
                  href={design3dUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={18} />
                  下载文件
                </a>
                <button
                  onClick={() => setDesign3dUrl('')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={18} />
                  清除
                </button>
              </>
            )}
          </div>

          {design3dUrl && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800 break-all">
                已上传文件: {design3dUrl.split('/').pop()}
              </p>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            支持.stp或.step格式，文件可通过本地3D软件打开
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            包装设计SOP (XLSX格式)
          </label>

          <div className="flex gap-3 mb-3">
            <input
              ref={packagingSopInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleSopFileUpload}
              className="hidden"
            />
            <button
              onClick={() => packagingSopInputRef.current?.click()}
              disabled={uploadingSop}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Upload size={18} />
              {uploadingSop ? '上传中...' : '上传XLSX文件'}
            </button>

            {packagingSopUrl && (
              <>
                <a
                  href={packagingSopUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={18} />
                  下载文件
                </a>
                <button
                  onClick={() => setPackagingSopUrl('')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={18} />
                  清除
                </button>
              </>
            )}
          </div>

          {packagingSopUrl && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800 break-all">
                已上传文件: {packagingSopUrl.split('/').pop()}
              </p>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            支持.xlsx或.xls格式，文件可通过Excel打开
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="输入相关备注信息..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
    </div>
  );
}
