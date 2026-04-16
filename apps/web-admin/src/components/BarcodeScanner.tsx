import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

/**
 * BarcodeScanner — uses the browser's camera to decode Code128/EAN/QR barcodes.
 * Falls back to a manual entry field if the BarcodeDetector API is unavailable.
 */
export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const [manual, setManual]   = useState('');
  const [hasApi, setHasApi]   = useState(false);
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    const supported = 'BarcodeDetector' in window;
    setHasApi(supported);

    if (!supported) return;

    let detector: any;
    try {
      detector = new (window as any).BarcodeDetector({
        formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
      });
    } catch {
      setHasApi(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
        }

        const scan = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const code = codes[0].rawValue;
              stopCamera();
              onDetected(code);
              return; // stop loop
            }
          } catch {/* ignore frame errors */}
          rafRef.current = requestAnimationFrame(scan);
        };

        rafRef.current = requestAnimationFrame(scan);
      })
      .catch(() => {
        toast.error('Camera access denied — use manual entry below.');
        setHasApi(false);
      });

    return () => stopCamera();
  }, [onDetected, stopCamera]);

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-modal" onClick={e => e.stopPropagation()}>
        <div className="scanner-header">
          <div className="flex items-center gap-2">
            <Zap size={16} color="var(--blue)" />
            <span style={{ fontWeight: 600 }}>Barcode Scanner</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {hasApi ? (
          <div className="scanner-viewfinder">
            <video ref={videoRef} muted playsInline className="scanner-video" />
            {scanning && (
              <div className="scanner-reticle">
                <div className="scanner-line" />
              </div>
            )}
          </div>
        ) : (
          <div className="scanner-fallback">
            <Camera size={48} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
            <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
              Camera API not supported — enter barcode manually
            </p>
          </div>
        )}

        <div className="scanner-manual">
          <input
            className="input"
            placeholder="Or type barcode / SKU…"
            value={manual}
            onChange={e => setManual(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && manual.trim()) {
                stopCamera();
                onDetected(manual.trim());
              }
            }}
            autoFocus={!hasApi}
          />
          <button
            className="btn btn-primary"
            disabled={!manual.trim()}
            onClick={() => { stopCamera(); onDetected(manual.trim()); }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
