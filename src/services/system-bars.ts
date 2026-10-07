import { Application, Color, Utils } from "@nativescript/core";

export function configureSystemBars() {
  if (!__ANDROID__) return;
  const activity = Application.android.foregroundActivity;
  if (!activity) return;
  const background = new Color("#000000");
  Utils.android.setIgnoreEdgeToEdgeOnOlderDevices(false);
  Utils.android.enableEdgeToEdge(activity, {
    statusBarLightColor: background,
    statusBarDarkColor: background,
    navigationBarLightColor: background,
    navigationBarDarkColor: background,
    handleDarkMode: () => true,
  });
  const window = activity.getWindow();
  if (android.os.Build.VERSION.SDK_INT >= 28) {
    const attributes = window.getAttributes();
    attributes.layoutInDisplayCutoutMode =
      android.os.Build.VERSION.SDK_INT >= 30
        ? android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
        : android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    window.setAttributes(attributes);
  }
  if (android.os.Build.VERSION.SDK_INT >= 30) {
    const controller = window.getInsetsController();
    controller?.setSystemBarsBehavior(
      android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE,
    );
    controller?.hide(android.view.WindowInsets.Type.statusBars());
  } else {
    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
  }
  window.getDecorView().requestApplyInsets();
}
