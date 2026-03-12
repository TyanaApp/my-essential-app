declare module '@zxing/browser' {
  export interface IScannerControls {
    stop: () => void;
    switchTorch?: (on: boolean) => void;
  }

  export class BrowserMultiFormatReader {
    decodeFromVideoDevice(
      deviceId: string | undefined,
      videoElement: HTMLVideoElement,
      callback: (result: { getText(): string } | undefined, error: any, controls: IScannerControls) => void
    ): Promise<IScannerControls>;

    decodeOnceFromVideoDevice(
      deviceId: string | undefined,
      videoElement: HTMLVideoElement
    ): Promise<{ getText(): string }>;
  }
}
