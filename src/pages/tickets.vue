<script setup lang="ts">
import { useProjectTimeStore } from "../store"
import { TicketTime, Workday } from "../model"
import {
  endOfDay,
  lightFormat,
  parse,
  startOfDay,
  startOfMonth,
} from "date-fns"

const { workWeeks } = await useProjectTimeStore()

const days = ref<Workday[]>([])
for (const week of workWeeks.value) {
  days.value.push(...week.days)
}

const DATE_FORMAT = "yyyy-MM-dd"
const startDate = ref(lightFormat(startOfMonth(new Date()), DATE_FORMAT))
const endDate = ref(lightFormat(new Date(), DATE_FORMAT))

const projects = computed(() => {
  const projects = days.value
    .filter(
      (d) =>
        d.date >= startOfDay(parse(startDate.value, DATE_FORMAT, new Date())) &&
        d.date < endOfDay(parse(endDate.value, DATE_FORMAT, new Date())),
    )
    .map((d) => d.projectTimes)
    .flat()
    .filter((pt) => pt.tickets.length > 0)

  const projectMap = new Map<string, TicketTime[]>()
  for (const pt of projects) {
    const tickets = projectMap.get(pt.project)
    if (tickets) {
      tickets.push(...pt.tickets)
    } else {
      projectMap.set(pt.project, [...pt.tickets])
    }
  }
  return projectMap
})
</script>

<template>
  <div class="flex flex-col h-full w-full pt-5 px-20 gap-5">
    <div class="flex gap-5 justify-center">
      <UFormField
        label="Start date"
        orientation="horizontal"
      >
        <UInput
          type="date"
          v-model:model-value="startDate"
        />
      </UFormField>
      <UFormField
        label="End date"
        orientation="horizontal"
      >
        <UInput
          type="date"
          v-model:model-value="endDate"
        />
      </UFormField>
    </div>
    <ProjectTickets
      v-for="[project, tickets] in projects"
      :project="project"
      :tickets="tickets"
    />
  </div>
</template>
