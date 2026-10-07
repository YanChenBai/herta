import { Application, Property, View } from "@nativescript/core";

let nextId = 0;
export class Video extends View {
  declare src: string;
  declare headers: Map<string, string>;
  declare initialVolume: number;
  private readonly playerId = ++nextId;
  private started = false;
  private ready = false;
  private buffering = false;
  private timer?: ReturnType<typeof setInterval>;

  createNativeView() {
    return new android.view.TextureView(this._context);
  }
  onLoaded() {
    super.onLoaded();
    this.buffering = false;
    const service = app.viyuni.herta.PlaybackService;
    service.attach(this.playerId, this.nativeViewProtected as android.view.TextureView);
    if (!this.started && this.src) {
      this.started = true;
      service.prepare(
        Application.android.context,
        this.playerId,
        this.src,
        JSON.stringify(Object.fromEntries(this.headers)),
        this.initialVolume,
      );
    }
    this.timer = setInterval(() => {
      const error = service.error(this.playerId);
      if (error) {
        this.notify({ eventName: "error", object: this });
        this.stopPolling();
        return;
      }
      const buffering = service.buffering(this.playerId);
      if (buffering !== this.buffering) {
        this.buffering = buffering;
        this.notify({ eventName: "buffering", object: this, value: buffering });
      }
      if (!this.ready && service.ready(this.playerId)) {
        this.ready = true;
        this.notify({ eventName: "playbackReady", object: this });
      }
    }, 500);
  }
  onUnloaded() {
    this.stopPolling();
    app.viyuni.herta.PlaybackService.detach(this.playerId);
    super.onUnloaded();
  }
  private stopPolling() {
    clearInterval(this.timer);
    this.timer = undefined;
  }
  setVolume(value: number) {
    app.viyuni.herta.PlaybackService.volume(this.playerId, value);
  }
  play() {
    app.viyuni.herta.PlaybackService.play(this.playerId);
  }
  pause() {
    app.viyuni.herta.PlaybackService.pause(this.playerId);
  }
  destroy() {
    this.stopPolling();
    app.viyuni.herta.PlaybackService.release(this.playerId);
    this.started = false;
  }
}
new Property<Video, string>({ name: "src", defaultValue: "" }).register(Video);
new Property<Video, Map<string, string>>({ name: "headers" }).register(Video);
new Property<Video, number>({ name: "initialVolume", defaultValue: 0 }).register(Video);
