import { useEffect, useRef, useState } from "react";
import Alert from "./ui/Alert";

// Uses the browser's native BarcodeDetector API where available - this is a
// real platform API (Chrome/Edge/Android WebView), not a library. Where it's
// unsupported (notably Safari/Firefox as of this writing), we say so
// plainly and let the manual-entry field below carry the flow instead of
// pretending camera scanning works everywhere.
const isSupported = typeof window !== "undefined" && "BarcodeDetector" in window;

const QrScanner = ({ onScan, active }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastScanRef = useRef({ value: null, time: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active || !isSupported) return;

    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanLoop();
      } catch (err) {
        setError("Couldn't access the camera - check browser permissions, or use manual entry below.");
      }
    };

    const scanLoop = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          const value = codes[0].rawValue;
          const now = Date.now();
          // Debounce - the same QR code stays in frame for many loop
          // iterations; only treat it as a new scan once per 2s per value.
          if (value !== lastScanRef.current.value || now - lastScanRef.current.time > 2000) {
            lastScanRef.current = { value, time: now };
            onScan(value);
          }
        }
      } catch {
        // transient decode errors are normal (blurry frame, etc.) - ignore and keep looping
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    };

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  if (!isSupported) {
    return (
      <Alert variant="info">
        Camera scanning isn't supported in this browser. Use manual entry below instead.
      </Alert>
    );
  }

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-black dark:border-slate-800">
      {error ? (
        <div className="p-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : (
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      )}
    </div>
  );
};

export default QrScanner;
