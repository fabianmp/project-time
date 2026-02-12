<script setup lang="ts">
const { balance, colorPositive, colorNegative } = defineProps<{
  balance: number
  colorPositive?: string
  colorNegative?: string
}>()

const positive = computed(() => colorPositive ?? "text-green-600")
const negative = computed(() => colorNegative ?? "text-red-500")
</script>

<template>
  <IconLabel
    icon="fa7-solid:piggy-bank"
    :label="`${balance}h`"
    :class="{
      [positive]: balance > 0,
      [negative]: balance < 0,
    }"
  />
</template>
