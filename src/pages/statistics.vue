<script setup lang="ts">
import { useProjectTimeStore } from "../store"
import { Workday } from "../model"
import { eachMonthOfInterval, endOfMonth, lightFormat } from "date-fns"
import { Chart, Legend, plugins } from "chart.js"

const { workWeeks } = await useProjectTimeStore()

const days = ref<Workday[]>([])
for (const week of workWeeks.value) {
  days.value.push(...week.days)
}

const months = eachMonthOfInterval({
  start: days.value[0].date,
  end: days.value[days.value.length - 1].date,
})

const page = ref(1)

const currentMonth = computed(() => months[page.value - 1])
const daysOfMonth = computed(() =>
  days.value
    .filter(
      (d) =>
        d.date > currentMonth.value && d.date <= endOfMonth(currentMonth.value),
    )
    .reverse(),
)

const colors = [
  "#3FA7D6CC",
  "#F25C54CC",
  "#70C1B3CC",
  "#FFE066CC",
  "#247BA0CC",
  "#FF9F1CCC",
  "#9B5DE5CC",
  "#00BBF9CC",
  "#F15BB5CC",
  "#00F5D4CC",
]

const projects = computed(() => {
  const names = new Set(
    daysOfMonth.value.reduce((p: string[], d) => {
      p.push(...d.projectTimes.map((pt) => pt.project))
      return p
    }, []),
  )
  const uniqueNames = [...names].sort()
  return uniqueNames.map((name, i) => ({
    name: name,
    color: colors[i],
  }))
})

const hoursData = computed(() => {
  const projectHoursPerDay = projects.value.map((p) => ({
    label: p.name,
    data: [],
    backgroundColor: p.color,
  }))
  const labels = []
  for (const day of daysOfMonth.value) {
    labels.push(day.date.toLocaleDateString())
    for (const project of projectHoursPerDay) {
      project.data.push(
        day.projectTimes.find((pt) => pt.project == project.label)?.duration ??
          0,
      )
    }
  }
  return {
    labels: labels,
    datasets: projectHoursPerDay,
  }
})

const projectsData = computed(() => {
  const projectHours = projects.value.map((p) => ({
    label: p.name,
    hours: 0,
    backgroundColor: p.color,
  }))
  for (const day of daysOfMonth.value) {
    for (const project of projectHours) {
      project.hours +=
        day.projectTimes.find((pt) => pt.project == project.label)?.duration ??
        0
    }
  }
  return {
    labels: projectHours.map((p) => p.label),
    datasets: [
      {
        backgroundColor: projectHours.map((p) => p.backgroundColor),
        data: projectHours.map((p) => p.hours),
      },
    ],
  }
})

const chartOptionsStacked = {
  maintainAspectRatio: false,
  responsive: true,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
  plugins: {
    legend: {
      position: "bottom",
    },
  },
}

const chartOptionsPie = {
  maintainAspectRatio: false,
  responsive: true,
  cutout: "30%",
  plugins: {
    legend: {
      position: "bottom",
    },
  },
}
</script>

<template>
  <div class="flex flex-col h-full w-full pt-5 px-20 gap-5">
    <UPagination
      v-model:page="page"
      :items-per-page="1"
      :total="months.length"
      class="w-full flex-0 pr-20 py-5"
      :ui="{
        list: 'justify-center',
      }"
    />
    <div class="w-full text-center">
      <b>{{ lightFormat(months[page - 1], "yyyy-MM") }}</b>
    </div>
    <div class="flex w-full text-center">
      <BarChart
        :data="hoursData"
        :options="chartOptionsStacked"
        class="w-1/2"
      />
      <PieChart
        :data="projectsData"
        :options="chartOptionsPie"
        class="w-1/2"
      />
    </div>
  </div>
</template>
