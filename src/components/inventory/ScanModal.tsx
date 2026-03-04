import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
}

const UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'packs'];

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ScanModal = ({ open, onClose, onSaved }: ScanModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setPreview(null);
    setBase64(null);
    setScannedItems([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t.scan.selectImage);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleScan = async () => {
    if (!base64) return;
    setStep(2);

    try {
      const { data, error } = await supabase.functions.invoke('scan-fridge', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      const items: ScannedItem[] = (data?.items || []).map((i: any) => ({
        name: String(i.name || ''),
        quantity: Number(i.quantity) || 1,
        unit: UNITS.includes(i.unit) ? i.unit : 'pcs',
      }));

      setScannedItems(items);
      setStep(3);
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(t.scan.scanFailed);
      setStep(1);
    }
  };

  const removeItem = (idx: number) => {
    setScannedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ScannedItem, value: any) => {
    setScannedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addManualItem = () => {
    setScannedItems((prev) => [...prev, { name: '', quantity: 1, unit: 'pcs' }]);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    const valid = scannedItems.filter((i) => i.name.trim());
    if (valid.length === 0) {
      toast.error(t.scan.noItems);
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('inventory_items')
        .select('id, name, quantity')
        .eq('user_id', user.id);

      const existingMap = new Map<string, { id: string; quantity: number }>();
      (existing || []).forEach((e: any) => {
        existingMap.set(e.name.toLowerCase(), { id: e.id, quantity: Number(e.quantity) || 0 });
      });

      const toInsert: any[] = [];
      const toUpdate: { id: string; quantity: number }[] = [];

      for (const item of valid) {
        const key = item.name.toLowerCase().trim();
        const match = existingMap.get(key);
        if (match) {
          toUpdate.push({ id: match.id, quantity: match.quantity + item.quantity });
        } else {
          toInsert.push({
            user_id: user.id,
            name: item.name.trim(),
            quantity: item.quantity,
            unit: item.unit,
            storage_location: 'fridge',
          });
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('inventory_items').insert(toInsert);
        if (error) throw error;
      }

      for (const u of toUpdate) {
        await supabase.from('inventory_items').update({ quantity: u.quantity }).eq('id', u.id);
      }

      toast.success(t.scan.itemsSaved.replace('{count}', String(valid.length)));
      onSaved();
      handleClose();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(t.scan.failedSave);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#EDE9FE' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>
            {step === 1 ? t.scan.title : step === 2 ? t.scan.analyzing : t.scan.results}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 pt-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full"
              style={{ backgroundColor: step >= s ? '#7C3AED' : '#EDE9FE' }}
            />
          ))}
        </div>

        <div className="p-4">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-[#7C3AED] hover:bg-[#F5F3FF]"
                style={{ borderColor: preview ? '#7C3AED' : '#DDD6FE' }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full max-h-60 object-contain rounded-lg" />
                ) : (
                  <>
                    <div className="text-4xl mb-3">📸</div>
                    <p className="text-sm font-medium" style={{ color: '#1E1B4B' }}>
                      {t.scan.clickToPhoto}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                      {t.scan.fileHint}
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <button
                onClick={handleScan}
                disabled={!base64}
                className="w-full mt-4 h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {t.scan.scanNow}
              </button>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 2 && (
            <div className="py-6">
              <div className="space-y-3 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg animate-pulse"
                      style={{ backgroundColor: '#EDE9FE' }}
                    />
                    <div className="flex-1 space-y-2">
                      <div
                        className="h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: '#EDE9FE', width: `${70 - i * 10}%` }}
                      />
                      <div
                        className="h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: '#F5F3FF', width: `${40 + i * 5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm" style={{ color: '#6B7280' }}>
                {t.scan.aiAnalyzing}
              </p>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: '#1E1B4B' }}>
                {t.scan.aiFound}
              </p>

              {scannedItems.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>
                  {t.inventory.noItemsDetected}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scannedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ backgroundColor: '#F5F3FF' }}
                    >
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder={t.inventory.itemName}
                        className="flex-1 text-sm font-medium bg-white rounded-lg px-2 py-1.5 border outline-none focus:border-[#7C3AED]"
                        style={{ borderColor: '#DDD6FE', color: '#1E1B4B' }}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 0)}
                        className="w-14 text-sm text-center bg-white rounded-lg px-1 py-1.5 border outline-none focus:border-[#7C3AED]"
                        style={{ borderColor: '#DDD6FE' }}
                        min={0}
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="text-xs bg-white rounded-lg px-1 py-1.5 border outline-none"
                        style={{ borderColor: '#DDD6FE', color: '#6B7280' }}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded-lg hover:bg-red-50 text-xs"
                        style={{ color: '#DC2626' }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addManualItem}
                className="flex items-center gap-1.5 mt-3 text-sm font-medium"
                style={{ color: '#7C3AED' }}
              >
                <Plus className="w-4 h-4" /> {t.scan.addUnrecognized}
              </button>

              <button
                onClick={handleSaveAll}
                disabled={saving || scannedItems.filter((i) => i.name.trim()).length === 0}
                className="w-full mt-4 h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {saving ? t.common.loading : t.scan.saveToInventory}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScanModal;
