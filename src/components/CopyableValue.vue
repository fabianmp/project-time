<script setup lang="ts">
const { icon, label, value } = defineProps<{
  icon?: string
  value?: string
  label: string
}>()

function copyToClipboard() {
  navigator.clipboard.writeText(value ?? label)
}
</script>

<template>
  <span class="flex items-center gap-1">
    <UIcon
      :name="icon"
      v-if="icon"
    />
    <UTooltip text="Copy to clipboard">
      <UButton
        :label="label"
        variant="ghost"
        color="neutral"
        class="p-1"
        @click="copyToClipboard"
    /></UTooltip>
  </span>
</template>
