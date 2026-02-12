<script setup lang="ts">
import { NavigationMenuItem } from "@nuxt/ui"
import { useLocalStorage } from "@vueuse/core"
import { useProjectTimeStore } from "../store"
import { round } from "../helpers"
import { parse } from "date-fns"

const toast = useToast()

const workHoursPerDay = useLocalStorage("workHoursPerDay", 0)
const overtimeBaseline = useLocalStorage("overtimeBaseline", 0)
const rounded = useLocalStorage("rounded", false)
const showRecommendedTimestamps = useLocalStorage(
  "showRecommendedTimestamps",
  false,
)

const { totalBalance, deleteOldData, loadTimestamps, getTimestampsFromDb } =
  await useProjectTimeStore()

watch(rounded, async () => await loadTimestamps())
watch(workHoursPerDay, async () => await loadTimestamps())

const items = ref<NavigationMenuItem[]>([
  {
    label: "Track Time",
    icon: "fa7-solid:stopwatch",
    to: "/",
    class: "px-5",
  },
  {
    label: "Statistics",
    icon: "fa7-solid:chart-line",
    to: "/statistics/",
    class: "px-5",
  },
])
const overtime = computed(() =>
  round(totalBalance.value + parseFloat(`${overtimeBaseline.value}`)),
)
const open = ref(workHoursPerDay.value === 0)
const openModalDelete = ref(false)
const threshold = new Date()
threshold.setDate(threshold.getDate() - 14)
threshold.setHours(0, 0, 0, 0)
const cutoffDate = ref(threshold.toISOString().substring(0, 10))

async function deleteData() {
  const date = parse(cutoffDate.value, "yyyy-MM-dd", threshold)
  await deleteOldData(date)
  toast.add({
    title: `Deleted all data before "${date.toLocaleDateString()}"`,
    icon: "fa7-solid:trash",
    color: "error",
    duration: 3000,
    close: false,
  })
  openModalDelete.value = false
}

const exportDate = ref(threshold.toISOString().substring(0, 10))

async function exportData() {
  const date = parse(exportDate.value, "yyyy-MM-dd", threshold)

  const data = []
  data.push("timestamp;project;description")
  const timestamps = await getTimestampsFromDb(date)
  for (const timestamp of timestamps) {
    data.push(
      `${timestamp.timestamp.toISOString()};"${
        timestamp.project
      }";"${encodeURIComponent(timestamp.description ?? "")}"`,
    )
  }
  const csvContent = encodeURI("data:text/csv;charset=utf-8," + data.join("\n"))
  var link = document.createElement("a")
  link.setAttribute("href", csvContent)
  link.setAttribute("download", "project-time.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.add({
    title: `Exported all data from "${date.toLocaleDateString()}"`,
    icon: "fa7-solid:file-export",
    color: "success",
    duration: 3000,
    close: false,
  })
  openModalExport.value = false
}

const openModalExport = ref(false)
</script>
<template>
  <UHeader
    title="Project Time Tracker"
    :ui="{ title: 'items-center' }"
  >
    <template #title>
      <h1 class="text-nowrap">Project Time Tracker</h1>
      <UNavigationMenu
        color="neutral"
        :items="items"
      />
    </template>
    <template #right>
      <OvertimeBalance
        :balance="overtime"
        v-if="workHoursPerDay > 0"
      />
      <span class="w-5" />
      <UPopover
        arrow
        modal
        portal
        v-model:open="open"
      >
        <UButton
          icon="fa7-solid:gear"
          label="Configuration"
          variant="subtle"
          color="neutral"
        />
        <template #content>
          <div class="flex flex-col w-65 py-5 gap-1">
            <USwitch
              v-model="rounded"
              label="15 min resolution"
              color="success"
              class="px-5 py-2"
            />
            <USwitch
              v-model="showRecommendedTimestamps"
              label="Recommend timestamps"
              color="success"
              class="px-5 py-2"
            />
            <USeparator />
            <div
              class="flex items-center gap-2 justify-between px-5"
              :class="{ 'bg-red-400': workHoursPerDay === 0 }"
            >
              <UIcon name="fa7-solid:business-time" />
              <UFormField
                label="Work hours per day"
                orientation="horizontal"
                class="w-full"
              >
                <UInput
                  v-model:model-value="workHoursPerDay"
                  placeholder="8"
                  class="w-12"
                />
              </UFormField>
            </div>
            <div class="flex items-center gap-2 justify-between px-5">
              <UIcon name="fa7-solid:piggy-bank" />
              <UFormField
                label="Overtime baseline"
                orientation="horizontal"
                class="w-full"
              >
                <UInput
                  v-model:model-value="overtimeBaseline"
                  placeholder="0"
                  class="w-12"
                />
              </UFormField>
            </div>
            <USeparator />
            <UModal
              v-model:open="openModalExport"
              title="Export data as CSV"
              :dismissible="false"
              :close="false"
              :ui="{
                content: 'w-100',
                footer: 'justify-end',
                body: 'flex justify-between',
              }"
            >
              <UButton
                icon="fa7-solid:file-export"
                color="neutral"
                variant="subtle"
                label="Export data as CSV..."
                class="mx-2"
              />
              <template #body>
                <IconLabel
                  icon="fa7-solid:calendar"
                  label="Export all data from"
                />
                <UInput
                  type="date"
                  v-model="exportDate"
                />
              </template>
              <template #footer>
                <UButton
                  label="Cancel"
                  variant="outline"
                  color="neutral"
                  @click="openModalExport = false"
                />
                <UButton
                  label="Export"
                  color="primary"
                  class="cursor-pointer"
                  @click="exportData"
                />
              </template>
            </UModal>
            <UModal
              v-model:open="openModalDelete"
              title="Delete old data?"
              :dismissible="false"
              :close="false"
              :ui="{
                content: 'w-100',
                footer: 'justify-end',
                body: 'flex justify-between',
              }"
            >
              <UButton
                icon="fa7-solid:trash"
                color="error"
                label="Delete old data..."
                class="mx-2"
              />
              <template #body>
                <IconLabel
                  icon="fa7-solid:calendar"
                  label="Delete all data before"
                />
                <UInput
                  type="date"
                  v-model="cutoffDate"
                />
              </template>
              <template #footer>
                <UButton
                  label="Cancel"
                  variant="outline"
                  color="neutral"
                  @click="openModal = false"
                />
                <UButton
                  label="Delete"
                  color="error"
                  class="cursor-pointer"
                  @click="deleteData"
                />
              </template>
            </UModal>
          </div>
        </template>
      </UPopover>
      <UButton
        label="View on GitHub"
        to="https://github.com/fabianmp/project-time"
        target="_blank"
        icon="fa7-brands:github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
      <UColorModeButton title="Swich color mode" />
    </template>
  </UHeader>
</template>
