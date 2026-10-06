import { useEffect, useRef } from "preact/hooks";

// API Barcode Detection : native dans Chromium sous Android et macOS, absente de
// Firefox, de Safari et de Chrome sous Windows. Elle n'est pas encore décrite
// dans les types DOM de TypeScript.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<string[]>;
}

const formats = ["ean_13", "ean_8", "upc_a", "upc_e"];

/**
 * Détecteur natif s'il lit les codes EAN/UPC, sinon prothèse ZXing (WebAssembly)
 * chargée à la demande. Le `.wasm` est servi par l'application, pas par un CDN.
 */
export async function createDetector(): Promise<BarcodeDetectorInstance> {
  const Native = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats();
      if (formats.some((format) => supported.includes(format))) return new Native({ formats });
    } catch {
      // Détecteur natif inutilisable : on passe à la prothèse.
    }
  }
  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
    import("barcode-detector/ponyfill"),
    import("zxing-wasm/reader/zxing_reader.wasm?url"),
  ]);
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith(".wasm") ? wasmUrl : prefix + path,
    },
  });
  return new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
}

/** La prothèse doit utiliser exactement la version de zxing-wasm dont on sert le `.wasm`. */
export async function polyfillWasmVersion(): Promise<string> {
  return (await import("barcode-detector/ponyfill")).ZXING_WASM_VERSION;
}

export function canScan(): boolean {
  return !!navigator.mediaDevices?.getUserMedia;
}

/** Aperçu caméra qui s'arrête dès qu'un code EAN/UPC est lu. */
export function BarcodeScanner({
  onDetected,
  onUnavailable,
}: {
  onDetected: (code: string) => void;
  onUnavailable: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const start = async () => {
      // Le détecteur se charge pendant l'ouverture de la caméra ; le nettoyage
      // final arrête le flux même si son chargement échoue.
      const pendingDetector = createDetector();
      pendingDetector.catch(() => {});
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const detector = await pendingDetector;
      if (stopped || !video.current) return;
      video.current.srcObject = stream;
      await video.current.play();

      const scan = async () => {
        if (stopped || !video.current) return;
        try {
          const [code] = await detector.detect(video.current);
          if (code && !stopped) {
            onDetected(code.rawValue);
            return;
          }
        } catch {
          // Image pas encore prête : on réessaie.
        }
        timer = setTimeout(scan, 300);
      };
      void scan();
    };

    start().catch(() => {
      stream?.getTracks().forEach((track) => track.stop());
      if (!stopped) onUnavailable();
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetected, onUnavailable]);

  return <video ref={video} class="scanner-video" muted playsInline aria-label="Aperçu caméra" />;
}
