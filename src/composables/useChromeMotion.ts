import { onBeforeUnmount, watch } from "nativescript-vue";
import { Animation, Enums, type EventData, type View } from "@nativescript/core";

export function useChromeMotion(visible: () => boolean, offset: number) {
  let view: View | undefined;
  let animation: Animation | undefined;
  let revision = 0;

  async function update() {
    if (!view) return;
    const current = ++revision;
    animation?.cancel();
    const showing = visible();
    view.visibility = "visible";
    view.isUserInteractionEnabled = showing;
    animation = new Animation([
      {
        target: view,
        opacity: showing ? 1 : 0,
        translate: { x: 0, y: showing ? 0 : offset },
        duration: showing ? 200 : 160,
        curve: Enums.AnimationCurve.easeOut,
      },
    ]);
    try {
      await animation.play();
      if (current === revision && !showing) view.visibility = "collapse";
    } catch {
      // 快速切换时取消上一段动画，由新状态接管。
    }
  }

  function loaded(event: EventData) {
    view = event.object as View;
    view.visibility = visible() ? "visible" : "collapse";
    view.opacity = visible() ? 1 : 0;
    view.translateY = visible() ? 0 : offset;
    view.isUserInteractionEnabled = visible();
  }
  watch(visible, update);
  onBeforeUnmount(() => {
    revision++;
    animation?.cancel();
    view = undefined;
  });
  return { loaded };
}
