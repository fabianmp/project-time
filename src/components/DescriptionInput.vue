<script setup lang="ts">
import { useProjectTimeStore } from "../store"

const { date, description } = defineProps<{
  date: Date
  description?: string
}>()

const currentDescription = ref(description)
const { updateDescription } = await useProjectTimeStore()
</script>

<template>
  <UInput
    v-model="currentDescription"
    placeholder="Add description..."
    variant="ghost"
    class="w-full"
    @blur="updateDescription(date, currentDescription)"
    @keyup.enter="updateDescription(date, currentDescription)"
  />
</template>
