<script setup lang="ts">
import { TableColumn } from "@nuxt/ui"
import { TicketTime } from "../model"

const CopyableValue = resolveComponent("CopyableValue")

const { project, tickets } = defineProps<{
  project: string
  tickets: TicketTime[]
}>()

const ui = computed(() => ({
  root: "flex-none shadow-lg",
  header: `flex flex-row bg-blue-500 font-bold text-white sm:px-2 px-2 sm:py-1 py-1 items-center justify-between h-10`,
  body: `flex flex-col flex-nowrap gap-1 sm:p-0 p-0 sm:pb-3 overflow-x-auto`,
}))

const columns: TableColumn<TicketTime>[] = [
  {
    accessorKey: "ticket",
    header: "Ticket",
    cell: ({ row }) => {
      const ticket = row.getValue("ticket")
      return ticket
        ? h(CopyableValue, {
            icon: "fa7-solid:check-square",
            label: ticket,
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

const combinedTickets = computed(() => {
  const combined: TicketTime[] = []
  for (const ticket of tickets) {
    const existing = combined.find((t) => t.ticket === ticket.ticket)
    if (existing) {
      existing.duration += ticket.duration
      existing.description = [
        existing.description,
        ticket.description.trim(),
      ].join(", ")
    } else {
      combined.push({ ...ticket })
    }
  }
  return combined
})
</script>

<template>
  <UCard
    variant="subtle"
    :ui="ui"
  >
    <template #header>
      <IconLabel
        icon="fa7-solid:business-time"
        :label="project"
      />
    </template>
    <UTable
      :data="combinedTickets"
      :columns="columns"
      :ui="{
        td: 'p-1.5',
        th: 'px-1 py-1',
        empty: 'py-2',
      }"
    >
    </UTable>
  </UCard>
</template>
