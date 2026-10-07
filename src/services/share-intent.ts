// iOS 分享扩展需要单独的原生 target，当前仅接入 Android 系统分享。
export function observeSharedText(_receive: (text: string) => void): () => void {
  return () => {};
}
