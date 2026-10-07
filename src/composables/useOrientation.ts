import { onBeforeUnmount, ref } from "nativescript-vue";
import { Application, Screen } from "@nativescript/core";

export function useOrientation() {
  const landscape = ref(Screen.mainScreen.widthDIPs > Screen.mainScreen.heightDIPs);
  const update = () => {
    landscape.value = Screen.mainScreen.widthDIPs > Screen.mainScreen.heightDIPs;
  };
  function rotate() {
    const next = !landscape.value;
    if (__ANDROID__) Application.android.foregroundActivity?.setRequestedOrientation(next ? 0 : 1);
    if (__IOS__) UIDevice.currentDevice.setValueForKey(next ? 3 : 1, "orientation");
    landscape.value = next;
  }
  Application.on(Application.orientationChangedEvent, update);
  onBeforeUnmount(() => Application.off(Application.orientationChangedEvent, update));
  return { landscape, rotate };
}
