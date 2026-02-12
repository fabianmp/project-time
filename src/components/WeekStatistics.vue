<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { WorkWeek } from "../model"

const { week } = defineProps<{
  week: WorkWeek
}>()

const workHoursPerDay = useLocalStorage("workHoursPerDay", 0)

const headerColor = computed(() => {
  let color = "bg-blue-500"
  if (workHoursPerDay.value > 0) {
    color = week.balance >= 0 ? "bg-green-500" : "bg-yellow-400"
  }
  return color
})

const ui = computed(() => ({
  root: "flex-none shadow-lg",
  header: `flex flex-row ${headerColor.value} font-bold text-white sm:px-2 px-2 sm:py-1 py-1 items-center h-10 gap-2 justify-between`,
  body: "flex flex-col flex-nowrap gap-1 sm:px-2 px-2 sm:py-1 py-1 overflow-x-auto",
  footer:
    "flex flex-row bg-gray-200 font-bold text-white sm:px-2 px-2 sm:py-1 py-1 items-center justify-between",
}))
</script>

<template>
  <UCard
    variant="subtle"
    :ui="ui"
  >
    <template #header>
      <IconLabel
        icon="fa7-solid:calendar-week"
        label="Week"
      />
      <IconLabel
        icon="fa7-solid:hourglass-half"
        :label="`${week.totalHours}h`"
      />
      <OvertimeBalance
        :balance="week.balance"
        color-positive="text-green-700"
      />
    </template>
    <div
      v-for="projectTime in week.projectTimes"
      class="flex justify-between w-full"
    >
      <IconLabel
        icon="fa7-solid:briefcase"
        :label="projectTime.project"
      />
      {{ projectTime.duration }}h
    </div>
  </UCard>
</template>
