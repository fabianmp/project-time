<script setup lang="ts">
import { Workday } from "../model"
import { useProjectTimeStore } from "../store"
import { addHours, addMinutes } from "date-fns"
import { useColorMode, useLocalStorage } from "@vueuse/core"

const { day } = defineProps<{
  day: Workday
}>()

const { addTimestamp } = await useProjectTimeStore()
const workHoursPerDay = useLocalStorage("workHoursPerDay", 0)

const colorMode = useColorMode()
const gray = computed(() => colorMode.value === "dark" ? "bg-gray-700" : "bg-gray-200")

const headerColor = computed(() => {
  let color = "bg-blue-500"
  if (workHoursPerDay.value > 0) {
    color =
      day.totalHours >= workHoursPerDay.value ? "bg-green-500" : "bg-yellow-400"
  }
  if (day.timestamps.length === 0) {
    color = "bg-red-400"
  }
  return color
})

const ui = computed(() => ({
  root: "flex-none shadow-lg",
  header: `flex flex-row ${headerColor.value} font-bold text-white sm:px-2 px-2 sm:py-1 py-1 items-center justify-between h-10`,
  body: "flex flex-col flex-nowrap gap-1 sm:p-0 p-0 sm:pb-3 overflow-x-auto",
  footer: `flex flex-col ${gray.value} font-bold sm:px-0 px-0 sm:pt-1 sm:pb-2`,
}))

async function markOutOfOffice(day: Workday) {
  const start = new Date(day.date.getTime())
  start.setHours(8)
  addTimestamp(start, "Out-of-Office")
  const end = addHours(start, workHoursPerDay.value)
  addTimestamp(end, "None")
}

async function addRow(day: Workday) {
  let timestamp = new Date(day.date.getTime())
  timestamp.setHours(8)
  if (day.timestamps.length > 0) {
    timestamp = addMinutes(
      day.timestamps[day.timestamps.length - 1].timestamp,
      15,
    )
  }
  await addTimestamp(timestamp, "None")
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}
</script>

<template>
  <UCard
    variant="subtle"
    :ui="ui"
  >
    <template #header>
      <div class="flex flex-row items-center gap-1">
        <IconLabel
          icon="fa7-solid:calendar-day"
          :label="formatDate(day.date)"
        />
        <span class="w-5" />
        <IconLabel
          :icon="
            day.totalHours === 0
              ? 'fa7-solid:hourglass'
              : 'fa7-solid:hourglass-half'
          "
          :label="`${day.totalHours}h`"
        />
        <span class="w-5" />
        <OvertimeBalance
          v-if="workHoursPerDay > 0"
          :balance="day.balance"
          color-positive="text-green-700"
          color-negative="text-red-600"
        />
      </div>
      <UButton
        icon="fa7-solid:plus"
        label="Add new"
        variant="subtle"
        color="neutral"
        @click="addRow(day)"
      />
    </template>
    <template #footer>
      <div class="flex gap-5 px-2 items-center w-full">
        <span
          v-for="w in day.workSegments"
          class="flex gap-1 items-center"
        >
          <UIcon :name="w.icon" />
          <CopyableValue :label="w.start.toTimeString().substring(0, 5)" />
          -
          <CopyableValue
            :label="w.end.toTimeString().substring(0, 5)"
            v-if="w.end"
          />
        </span>
      </div>
      <ProjectTimeTable :day="day" />
    </template>
    <WorkSegmentTable
      :day="day"
      v-if="day.timestamps.length > 0"
    />
    <UEmpty
      v-if="day.timestamps.length === 0"
      icon="fa7-solid:business-time"
      class="sm:p-4 lg:p-4"
      :actions="[
        {
          icon: 'fa7-solid:calendar-times',
          label: 'Mark as Out-of-Office',
          variant: 'subtle',
          color: 'neutral',
          onClick: async () => await markOutOfOffice(day),
        },
      ]"
    />
  </UCard>
</template>
