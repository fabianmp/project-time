<script setup lang="ts">
const { icon, label } = defineProps<{
  icon: string
  label: string
}>()
</script>

<template>
  <span class="flex items-center gap-1">
    <UIcon :name="icon" />
    {{ label }}
  </span>
</template>
