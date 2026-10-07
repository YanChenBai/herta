import {
  Application,
  AndroidApplication,
  type AndroidActivityEventData,
  type AndroidActivityNewIntentEventData,
} from "@nativescript/core";

export function observeSharedText(receive: (text: string) => void): () => void {
  const handled = "app.viyuni.herta.share.handled";
  function accept(intent: android.content.Intent | null) {
    if (
      !intent ||
      intent.getAction() !== android.content.Intent.ACTION_SEND ||
      intent.getType() !== "text/plain" ||
      intent.getBooleanExtra(handled, false)
    )
      return;
    const text = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);
    if (!text) return;
    // 同一次冷启动可能触发多个 Activity 事件，只消费一次分享。
    intent.putExtra(handled, true);
    receive(text);
  }
  const created = (event: AndroidActivityEventData) => accept(event.activity.getIntent());
  const newIntent = (event: AndroidActivityNewIntentEventData) => accept(event.intent);
  Application.android.on(AndroidApplication.activityStartedEvent, created);
  Application.android.on(AndroidApplication.activityNewIntentEvent, newIntent);
  accept(
    (Application.android.foregroundActivity || Application.android.startActivity)?.getIntent(),
  );
  return () => {
    Application.android.off(AndroidApplication.activityStartedEvent, created);
    Application.android.off(AndroidApplication.activityNewIntentEvent, newIntent);
  };
}
