import { onBeforeUnmount, ref, watch } from "nativescript-vue";

export function useAutoHide(canHide: () => boolean) {
  const controls = ref(true);
  let timer: ReturnType<typeof setTimeout> | undefined;
  function wake() {
    controls.value = true;
    if (timer) clearTimeout(timer);
    if (canHide())
      timer = setTimeout(() => {
        controls.value = false;
      }, 4500);
  }
  function toggle() {
    if (!controls.value) {
      wake();
      return;
    }
    if (timer) clearTimeout(timer);
    controls.value = false;
  }
  watch(canHide, wake, { immediate: true });
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
  });
  return { controls, wake, toggle };
}
