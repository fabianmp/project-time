<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { useProjectTimeStore } from "../store"

const toast = useToast()

const { workWeeks } = await useProjectTimeStore()

const page = ref(1)
const currentWeek = computed(() => workWeeks.value[page.value - 1])

const dismissedStorage = useLocalStorage("projectTimeDismissedMessages", "[]")
const dismissed = ref(JSON.parse(dismissedStorage.value))

const messages: Toast[] = [
  <Toast>{
    id: "1",
    icon: "fa7-solid:bullhorn",
    duration: 10000,
    title: "Welcome to the new implementation using NuxtUI",
  },
  <Toast>{
    id: "2",
    icon: "fa7-solid:info-circle",
    duration: 10000,
    title: "Import and export of data",
    description: h("span", {}, [
      "Please use this tool:",
      h('br'),
      h(
        "a",
        {
          href: "https://fabianmp.github.io/idb-import-export/",
          target: "_blank",
        },
        ["https://fabianmp.github.io/idb-import-export/"],
      ),
    ]),
  },
]
const newMessages = messages.filter((x) => !dismissed.value.includes(x.id))
newMessages.forEach((m) =>
  toast.add({
    ...m,
    close: false,
    orientation: "horizontal",
    actions: [
      {
        icon: "fa7-solid:eye-slash",
        class: "cursor-pointer",
        label: "Hide",
        color: "neutral",
        variant: "subtle",
        onClick: (e) => {
          e?.stopPropagation()
          dismissed.value.push(m.id)
          dismissedStorage.value = JSON.stringify(dismissed.value)
        },
      },
    ],
  }),
)
</script>

<template>
  <div class="flex flex-row h-full w-full pt-5 gap-5">
    <div class="flex flex-col flex-none gap-5 pl-20 w-100">
      <ProjectList />
      <WeekStatistics
        v-if="currentWeek"
        :week="currentWeek"
      />
    </div>
    <div class="flex flex-col grow h-full w-full">
      <div class="flex flex-col gap-5 grow h-full overflow-y-auto pl-5 pr-20">
        <WorkDay
          :key="day.date.getTime()"
          :day="day"
          v-for="day in currentWeek.days"
          v-if="currentWeek"
        />
      </div>
      <UPagination
        v-model:page="page"
        :items-per-page="1"
        :total="workWeeks.length"
        class="w-full flex-0 pr-20 py-5"
        :ui="{
          list: 'justify-center',
        }"
      />
    </div>
  </div>
</template>
