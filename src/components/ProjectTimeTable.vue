<script setup lang="ts">
import { TableColumn } from "@nuxt/ui"
import { ProjectTime, Workday } from "../model"

const CopyableValue = resolveComponent("CopyableValue")

const { day } = defineProps<{
  day: Workday
}>()

const columns: TableColumn<ProjectTime>[] = [
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => {
      const project = row.getValue("project")
      return project
        ? h(CopyableValue, {
            icon: "fa7-solid:briefcase",
            label: project,
          })
        : undefined
    },
    meta: {
      class: {
        td: "w-80",
      },
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration")
      return duration
        ? h(CopyableValue, {
            icon: "fa7-solid:hourglass-half",
            label: `${duration}h`,
            value: `${duration}`,
          })
        : undefined
    },
    meta: {
      class: {
        td: "w-30",
      },
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description")
      return description
        ? h(CopyableValue, {
            icon: "fa7-solid:file-text",
            label: description,
          })
        : undefined
    },
  },
]
</script>

<template>
  <UTable
    :data="day.projectTimes"
    :columns="columns"
    :ui="{ td: 'p-1.5', th: 'px-1 py-1', empty: 'py-2' }"
  >
  </UTable>
</template>
