<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { useProjectTimeStore } from "../store"
import { parse } from "date-fns"

const showRecommendedTimestamps = useLocalStorage(
  "showRecommendedTimestamps",
  false,
)

const { date } = defineProps<{
  date: Date
}>()

const currentTime = ref(date.toTimeString().substring(0, 5))
const { updateTimestamp, recommendedTimestamps } = await useProjectTimeStore()

async function updateDate() {
  const newDate = parse(currentTime.value, "HH:mm", date)
  await updateTimestamp(date, newDate)
}
const showRecommended = ref(false)

async function selectRecommended(value: string) {
  currentTime.value = value
  showRecommended.value = false
  await updateDate()
}
</script>

<template>
  <div class="flex items-center">
    <UPopover
      v-if="showRecommendedTimestamps"
      arrow
      modal
      portal
      v-model:open="showRecommended"
    >
      <UTooltip text="Show recommended times">
        <UButton
          icon="fa7-solid:clock-rotate-left"
          size="xs"
          variant="ghost"
          color="neutral"
        />
      </UTooltip>
      <template #content>
        <div class="flex flex-col">
          <UButton
            v-for="timestamp in recommendedTimestamps"
            :label="timestamp"
            variant="ghost"
            color="neutral"
            class="px-5"
            @click="selectRecommended(timestamp)"
          />
        </div>
      </template>
    </UPopover>
    <UInput
      type="time"
      v-model="currentTime"
      variant="ghost"
      @blur="updateDate"
      @keyup.enter="updateDate"
    />
  </div>
</template>
