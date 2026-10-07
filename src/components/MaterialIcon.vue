<script setup lang="ts">
import { icons, type IconName } from "../domain/icons";
defineProps<{ name: IconName }>();
</script>
<template>
  <Label :text="icons[name]" class="material-icon" verticalAlignment="center" />
</template>
