<script setup lang="ts">
import { TableColumn } from "@nuxt/ui"
import { SystemProjects, Timestamp, Workday } from "../model"
import { useProjectTimeStore } from "../store"
import { useColorMode } from "@vueuse/core"

const UButton = resolveComponent("UButton")
const DescriptionInput = resolveComponent("DescriptionInput")
const IconLabel = resolveComponent("IconLabel")
const ProjectSelect = resolveComponent("ProjectSelect")
const TimeInput = resolveComponent("TimeInput")

const colorMode = useColorMode()

const { day } = defineProps<{
  day: Workday
}>()

const { deleteTimestamp } = await useProjectTimeStore()

const columns: TableColumn<Timestamp>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }) => {
      return h(TimeInput, {
        date: row.getValue("timestamp"),
      })
    },
    meta: {
      class: {
        td: "w-20 text-center",
      },
    },
  },
  {
    header: "Duration",
    accessorKey: "duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration")
      return duration
        ? h(IconLabel, {
            icon: "fa7-solid:hourglass-half",
            label: `${duration}h`,
          })
        : undefined
    },
    meta: {
      class: {
        td: "w-20",
      },
    },
  },
  {
    accessorKey: "project",
    header: "Project",
    meta: {
      class: {
        td: "w-80",
      },
    },
    cell: ({ row }) => {
      return h(ProjectSelect, {
        date: row.getValue("timestamp"),
        project: row.getValue("project"),
      })
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return h(DescriptionInput, {
        description: row.getValue("description"),
        date: row.getValue("timestamp"),
      })
    },
  },
  {
    id: "actions",
    meta: {
      class: {
        td: "text-right w-10",
      },
    },
    cell: ({ row }) => {
      return h(UButton, {
        icon: "fa7-solid:trash",
        color: "error",
        variant: "ghost",
        class: "p-1",
        onClick: async () => await deleteRow(row.original),
      })
    },
  },
]

const meta = computed(() => ({
  class: {
    tr: (row: any) => {
      for (const project of SystemProjects) {
        if (row.original.project === project.name) {
          if (project.name === "None" && row.original.isLast) {
            return ""
          }
          return colorMode.value === "dark"
            ? project.rowColor.replace("bg-gray-300", "bg-gray-500")
            : project.rowColor
        }
      }
      return ""
    },
  },
}))

async function deleteRow(timestamp: Timestamp) {
  await deleteTimestamp(timestamp.key)
}
</script>

<template>
  <UTable
    :key="day.date.getDay() * day.timestamps.length"
    :data="day.timestamps"
    :columns="columns"
    :ui="{ td: 'p-1.5', th: 'py-1' }"
    :meta="meta"
    :get-row-id="(r, _1, _2) => r.timestamp.getTime().toString()"
  >
  </UTable>
</template>
