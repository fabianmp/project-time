<script setup lang="ts">
import { TableColumn } from "@nuxt/ui"
import { ProjectTime, TicketTime, Workday } from "../model"
import { useColorMode, useLocalStorage } from "@vueuse/core"

const parseTickets = useLocalStorage("parseTicketNumbers", false)
const colorMode = useColorMode()
const gray = computed(() =>
  colorMode.value === "dark" ? "bg-gray-600" : "bg-gray-300",
)

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

const columnsTickets: TableColumn<TicketTime>[] = [
  {
    accessorKey: "ticket",
    header: "Ticket",
    cell: ({ row }) => {
      const ticket = row.getValue("ticket")
      return ticket
        ? h(CopyableValue, {
            icon: "fa7-solid:ticket",
            label: ticket,
          })
        : undefined
    },
    meta: {
      class: {
        td: "w-80 pl-10",
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

const expanded = computed(
  () =>
    Object.fromEntries(
      day.projectTimes.map((p, i) => [
        i,
        parseTickets.value && p.tickets && p.tickets.length > 0,
      ]),
    ) as Record<string, boolean>,
)
</script>

<template>
  <UTable
    :data="day.projectTimes"
    :columns="columns"
    :ui="{
      td: 'p-1.5',
      th: 'px-1 py-1',
      empty: 'py-2',
    }"
    :expanded="expanded"
  >
    <template #expanded="{ row }">
      <UTable
        v-if="row.original.tickets && row.original.tickets.length > 0"
        :data="row.original.tickets"
        :columns="columnsTickets"
        :ui="{
          root: '-m-0.5',
          td: 'p-0.5',
          tr: `${gray}`,
          empty: 'py-2',
          thead: 'hidden',
        }"
      ></UTable>
    </template>
  </UTable>
</template>
