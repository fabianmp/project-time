<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { SystemProjects } from "../model"
import { useProjectTimeStore } from "../store"

const { date, project } = defineProps<{
  date: Date
  project: string
}>()

const projects = useLocalStorage<string[]>("projects", [])
const currentProject = ref(project)
const { updateProject } = await useProjectTimeStore()

const projectOptions = ref([
  ...SystemProjects.map((p) => ({
    label: p.name,
    value: p.name,
    icon: p.icon,
    class: p.textColor,
  })),
  ...projects.value.sort().map((p) => ({
    label: p,
    value: p,
    icon: "fa7-solid:briefcase",
  })),
])

watch(currentProject, async (p) => {
  await updateProject(date, p)
})

const icon = computed(
  () =>
    projectOptions.value.find((item) => item.value === currentProject.value)
      ?.icon,
)
</script>

<template>
  <USelect
    v-model="currentProject"
    :items="projectOptions"
    value-key="value"
    :icon="icon"
    variant="ghost"
    class="w-full"
    :ui="{ content: 'max-h-100' }"
  />
</template>
