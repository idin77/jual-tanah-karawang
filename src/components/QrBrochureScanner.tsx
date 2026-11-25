import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QrBrochureScannerProps {
  open: boolean;
  onClose: () => void;
}

type FacingMode = 'environment' | 'user';
type ScannerStatus = 'starting' | 'scanning' | 'detected' | 'error';

function parseSafeWebUrl(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;
  try {
    const candidate = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)
        ? `https://${trimmed}`
        : trimmed;
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export default function QrBrochureScanner({ open, onClose }: QrBrochureScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [status, setStatus] = useState<ScannerStatus>('starting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scannedText, setScannedText] = useState<string>('');
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [scanAttempt, setScanAttempt] = useState<number>(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDecodedValue = useCallback(
    (rawValue: string) => {
      stopCamera();
      const safeUrl = parseSafeWebUrl(rawValue);
      setScannedText(rawValue);
      setDetectedUrl(safeUrl);
      setStatus('detected');
    },
    [stopCamera]
  );

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopCamera();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, stopCamera]);

  // Start live camera scanning when modal opens or facingMode/retry changes
  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let cancelled = false;
    setStatus('starting');
    setErrorMessage('');
    setScannedText('');
    setDetectedUrl(null);

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('error');
        setErrorMessage(
          'Browser ini belum mendukung akses kamera langsung. Gunakan tombol Ambil Foto / Unggah Gambar QR Brosur di bawah.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        setStatus('scanning');

        const scanFrame = () => {
          if (cancelled) return;
          const v = videoRef.current;
          const canvas = canvasRef.current;
          if (!v || !canvas) return;

          if (v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && v.videoWidth > 0 && v.videoHeight > 0) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });
              if (code && code.data) {
                handleDecodedValue(code.data);
                return;
              }
            }
          }

          rafRef.current = window.requestAnimationFrame(scanFrame);
        };

        rafRef.current = window.requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;
        const errName = err instanceof Error ? err.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setErrorMessage(
            'Izin kamera ditolak. Berikan akses kamera di browser Anda, atau gunakan tombol foto/unggah QR brosur di bawah.'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setErrorMessage(
            'Kamera tidak terdeteksi pada perangkat ini. Anda tetap dapat mengambil foto atau mengunggah gambar QR brosur.'
          );
        } else {
          setErrorMessage(
            'Kamera tidak dapat dimulai saat ini. Silakan coba lagi atau unggah foto QR Code dari brosur cetak.'
          );
        }
        setStatus('error');
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, facingMode, scanAttempt, handleDecodedValue, stopCamera]);

  // If detected URL points to the same origin, automatically navigate directly after brief visual feedback
  useEffect(() => {
    if (status !== 'detected' || !detectedUrl) return;
    try {
      const parsed = new URL(detectedUrl);
      if (parsed.origin === window.location.origin) {
        const timer = window.setTimeout(() => {
          onClose();
          window.location.assign(parsed.toString());
        }, 700);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // Ignore parse errors
    }
  }, [status, detectedUrl, onClose]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = canvasRef.current ?? document.createElement('canvas');
      const maxDim = 1400;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setStatus('error');
        setErrorMessage('Gagal membaca gambar QR Code.');
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data) {
        handleDecodedValue(code.data);
      } else {
        stopCamera();
        setStatus('error');
        setErrorMessage('QR Code tidak terbaca pada foto tersebut. Pastikan QR brosur terlihat jelas dan cukup cahaya.');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setStatus('error');
      setErrorMessage('File gambar tidak dapat dibuka.');
    };
    img.src = objectUrl;
  };

  if (!open) return null;

  return (
    <div
      className="legal-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
    >
      <div
        className="legal-modal scan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-scanner-title"
      >
        <div className="legal-modal-hd">
          <div>
            <span className="legal-modal-kicker">Kamera Pemindai Brosur</span>
            <h3 id="qr-scanner-title">Pindai QR Code dari Brosur Cetak</h3>
          </div>
          <button
            type="button"
            className="legal-modal-close"
            aria-label="Tutup pemindai QR brosur"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            <svg className="ic" aria-hidden="true">
              <use href="#i-close" />
            </svg>
          </button>
        </div>

        <div className="legal-modal-body">
          <p className="legal-modal-intro">
            Arahkan kamera ponsel Anda ke QR Code pada brosur cetak Mitra Property Indonesia untuk membuka tautan
            website penawaran secara langsung.
          </p>

          <canvas ref={canvasRef} className="scan-hidden-canvas" aria-hidden="true" />

          {status === 'detected' ? (
            <div className="scan-result" role="status" aria-live="polite">
              <div className="scan-result-badge">
                <svg className="ic" aria-hidden="true">
                  <use href="#i-check" />
                </svg>
                QR Code Berhasil Dipindai
              </div>
              {detectedUrl ? (
                <>
                  <p className="scan-result-label">Alamat Website Terdeteksi:</p>
                  <div className="scan-result-url">{detectedUrl}</div>
                  <div className="scan-result-actions">
                    <a
                      className="btn-legal-primary"
                      href={detectedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buka Website Sekarang
                    </a>
                    <button
                      type="button"
                      className="btn-legal-close"
                      onClick={() => {
                        window.location.assign(detectedUrl);
                      }}
                    >
                      Buka di Halaman Ini
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="scan-result-label">Isi QR Code Terbaca:</p>
                  <div className="scan-result-url">{scannedText}</div>
                </>
              )}
              <button
                type="button"
                className="scan-retry-link"
                onClick={() => setScanAttempt((prev) => prev + 1)}
              >
                Pindai QR Brosur Lainnya
              </button>
            </div>
          ) : (
            <div className="scan-viewport-wrap">
              <video ref={videoRef} className="scan-video" playsInline muted autoPlay />
              {status === 'scanning' && (
                <div className="scan-reticle" aria-hidden="true">
                  <span className="scan-corner tl" />
                  <span className="scan-corner tr" />
                  <span className="scan-corner bl" />
                  <span className="scan-corner br" />
                  <span className="scan-guide-text">Posisikan QR Brosur di dalam kotak</span>
                </div>
              )}
              {status === 'starting' && (
                <div className="scan-overlay-msg">Menghubungkan ke kamera perangkat...</div>
              )}
              {status === 'error' && (
                <div className="scan-overlay-msg error" role="alert">
                  <strong>Kamera Tidak Aktif</strong>
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    className="btn-legal-primary"
                    onClick={() => setScanAttempt((prev) => prev + 1)}
                  >
                    Coba Aktifkan Kamera Lagi
                  </button>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="scan-file-input"
            aria-label="Ambil foto atau unggah gambar QR Code brosur"
            onChange={handleFileUpload}
          />
        </div>

        <div className="legal-modal-ft">
          {status !== 'detected' && (
            <button
              type="button"
              className="btn-legal-primary"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            >
              {facingMode === 'environment' ? 'Ganti ke Kamera Depan' : 'Ganti ke Kamera Belakang'}
            </button>
          )}
          <button
            type="button"
            className="btn-wa scan-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="ic" aria-hidden="true">
              <use href="#i-camera" />
            </svg>
            Foto / Unggah Gambar QR
          </button>
          <button
            type="button"
            className="btn-legal-close"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
