<script setup lang="ts">
import { ref } from "nativescript-vue";
import { fetchCookie } from "../../services/cookie-sync";
import { getCookie, setCookie, syncTransport } from "../../services/runtime";
const emit = defineEmits<{ updated: [] }>();
const connection = ref("");
const password = ref("");
const busy = ref(false);
const status = ref(getCookie() ? "已获取 · 本次会话可用" : "尚未获取");
const notice = ref("");
async function pull() {
  if (busy.value) return;
  busy.value = true;
  notice.value = "";
  try {
    setCookie(await fetchCookie(connection.value.trim(), password.value, syncTransport));
    status.value = "已获取 · 本次会话可用";
    notice.value = "Cookie 已获取，播放区域正在重新连接";
    emit("updated");
  } catch (cause) {
    notice.value = cause instanceof Error ? cause.message : "获取失败，请稍后重试";
  } finally {
    busy.value = false;
  }
}
function clear() {
  setCookie("");
  password.value = "";
  connection.value = "";
  status.value = "尚未获取";
  notice.value = "";
  emit("updated");
}
</script>

<template>
  <StackLayout>
    <Label :text="status" class="text-sm text-ice mb-3" />
    <Label
      text="从你的 Cookie 服务获取 B站登录状态，仅用于本次会话。"
      textWrap="true"
      class="text-sm text-mist mb-4"
    />
    <Label text="连接地址" class="text-xs text-mist mb-2" />
    <TextField
      v-model="connection"
      hint="https://名称:令牌@你的服务器"
      secure="true"
      autocorrect="false"
    />
    <Label text="解密密码" class="text-xs text-mist mt-4 mb-2" />
    <TextField v-model="password" hint="与同步端相同的密码" secure="true" />
    <Button
      :text="busy ? '获取中…' : '从服务器获取 Cookie'"
      :isEnabled="!busy"
      class="primary mt-4"
      @tap="pull"
    />
    <Button text="清除本次登录状态" class="quiet mt-2" :isEnabled="!busy" @tap="clear" />
    <Label :text="notice" textWrap="true" class="text-sm text-ice mt-3" />
  </StackLayout>
</template>
