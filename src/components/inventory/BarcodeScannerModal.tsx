import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductByBarcode, OFFProduct } from '@/lib/openFoodFacts';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

const BarcodeScannerModal = ({ open, onClose, onProductAdded }: BarcodeScannerModalProps) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const off = (t as any).openFoodFacts || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<OFFProduct | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      startScanning();
    }
    return () => stopScanning();
  }, [open]);

  const startScanning = async () => {
    setProduct(null);
    setScanning(true);
    try {
      // Dynamic import to avoid bundling if not used
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const result = await reader.decodeOnceFromVideoDevice(undefined, videoRef.current!);
      const barcode = result.getText();

      setScanning(false);
      setLoading(true);

      const found = await getProductByBarcode(barcode);
      setLoading(false);

      if (found) {
        setProduct(found);
      } else {
        toast.error(off.notInDatabase || 'Product not found in database');
        // Let user try again
        setTimeout(() => startScanning(), 1500);
      }
    } catch (e: any) {
      console.error('Barcode scan error:', e);
      setScanning(false);
      if (e?.name !== 'NotFoundException') {
        toast.error(off.scanError || 'Could not read barcode');
      }
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // BrowserMultiFormatReader doesn't have a stop method in newer versions
    readerRef.current = null;
  };

  const handleAddToInventory = async () => {
    if (!user || !product) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('inventory_items').insert({
        user_id: user.id,
        name: product.brand ? `${product.name} (${product.brand})` : product.name,
        category: 'other',
        quantity: 1,
        unit: 'pcs',
        storage_location: 'fridge',
      });
      if (error) throw error;
      toast.success((t.inventory as any)?.added || 'Added ✓');
      onProductAdded();
      onClose();
    } catch (e) {
      console.error('Error adding product:', e);
      toast.error('Error');
    } finally {
      setAdding(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/80">
          <h2 className="text-white font-bold text-lg">
            {off.scanBarcode || 'Scan barcode'}
          </h2>
          <button onClick={onClose} className="text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera / Product view */}
        {!product ? (
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-64 h-40 border-2 border-white/60 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

                {scanning && (
                  <motion.div
                    animate={{ y: [0, 120, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-4 right-4 h-0.5 bg-primary top-4"
                  />
                )}
              </div>

              <p className="text-white text-sm mt-4 text-center px-8">
                {loading
                  ? (off.lookingUp || 'Looking up product...')
                  : (off.pointCamera || 'Point camera at barcode')}
              </p>

              {loading && (
                <Loader2 className="w-6 h-6 text-white animate-spin mt-2" />
              )}
            </div>
          </div>
        ) : (
          /* Product found card */
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4"
            >
              <div className="text-center">
                <span className="text-3xl">✅</span>
                <h3 className="text-lg font-bold text-foreground mt-2">
                  {off.productFound || 'Product found!'}
                </h3>
              </div>

              {product.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-24 h-24 object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="text-center">
                <p className="font-bold text-foreground">{product.name}</p>
                {product.brand && (
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                )}
              </div>

              <div className="bg-muted rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2 text-center">
                  {off.per100g || 'Per 100g'}
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{product.calories}</p>
                    <p className="text-[10px] text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-500">{product.protein}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {language === 'ru' ? 'Б' : language === 'uk' ? 'Б' : language === 'lv' ? 'O' : 'P'}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-500">{product.fat}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {language === 'ru' ? 'Ж' : language === 'uk' ? 'Ж' : language === 'lv' ? 'T' : 'F'}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">{product.carbs}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {language === 'ru' ? 'У' : language === 'uk' ? 'В' : language === 'lv' ? 'O' : 'C'}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-center text-green-600 mt-2 font-medium">
                  📊 {off.dataFromLabel || 'Data from label'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => {
                    setProduct(null);
                    startScanning();
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  {off.notThis || 'Not this'}
                </Button>
                <Button
                  className="flex-1 gap-1"
                  onClick={handleAddToInventory}
                  disabled={adding}
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {(t.inventory as any)?.add || 'Add'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default BarcodeScannerModal;
