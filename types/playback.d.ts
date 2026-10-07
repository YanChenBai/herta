declare namespace app.viyuni.herta {
  class PlaybackService extends android.app.Service {
    static setWorkspaceName(name: string): void;
    static prepare(
      context: android.content.Context,
      id: number,
      url: string,
      headers: string,
      volume: number,
    ): void;
    static attach(id: number, view: android.view.TextureView): void;
    static detach(id: number): void;
    static volume(id: number, value: number): void;
    static ready(id: number): boolean;
    static buffering(id: number): boolean;
    static error(id: number): string;
    static play(id: number): void;
    static pause(id: number): void;
    static release(id: number): void;
  }
}
