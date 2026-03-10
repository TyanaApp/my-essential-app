declare module '@zxing/browser' {
  export class BrowserMultiFormatReader {
    decodeOnceFromVideoDevice(deviceId: string | undefined, videoElement: HTMLVideoElement): Promise<{ getText(): string }>;
  }
}
