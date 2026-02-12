<script setup lang="ts">
import { useColorMode, useLocalStorage } from "@vueuse/core"
import { useProjectTimeStore } from "../store"
import { SystemProjects } from "../model"

const { currentProject, addTimestamp } = await useProjectTimeStore()

async function selectProject(project: string) {
  currentProject.value = project
  await addTimestamp(new Date(), project)
}

const colorMode = useColorMode()
const gray = computed(() => colorMode.value === "dark" ? "bg-gray-700" : "bg-gray-200")

const ui = computed(() => ({
  root: "flex-none shadow-lg",
  header:
    "flex flex-row bg-blue-800 font-bold text-white sm:px-2 px-2 sm:py-1 py-1 h-10",
  body: `flex flex-col flex-nowrap gap-1 sm:p-0 p-0 sm:py-1 py-1`,
  footer:
    `flex flex-row ${gray.value} sm:px-2 px-2 sm:py-1 py-1 items-center justify-between`,
}))

const projects = useLocalStorage<string[]>("projects", [])
const newProject = ref<string>()

const systemProjects = SystemProjects.map((p) => p.name)

function addProject() {
  if (!newProject.value) {
    return
  }
  if (
    !projects.value.includes(newProject.value) &&
    !systemProjects.includes(newProject.value)
  ) {
    projects.value.push(newProject.value)
  }
  newProject.value = undefined
}

function deleteProject(project: string) {
  projects.value = projects.value.filter((p) => p !== project)
}
</script>

<template>
  <UCard
    variant="subtle"
    :ui="ui"
  >
    <template #header>
      <IconLabel
        icon="fa7-solid:list-check"
        label="Projects"
      />
    </template>
    <template #footer>
      <UInput
        v-model="newProject"
        placeholder="Add new project..."
        class="w-full"
        @keyup.enter="addProject"
      />
    </template>
    <UButton
      v-for="project in SystemProjects"
      :icon="project.icon"
      :label="project.name"
      :variant="currentProject === project.name ? 'solid' : 'ghost'"
      :color="project.color"
      class="w-full"
      @click="selectProject(project.name)"
      :disabled="currentProject === project.name"
    />
    <div
      v-for="project in projects.sort()"
      :key="project"
    >
      <UButton
        icon="fa7-solid:briefcase"
        :label="project"
        :variant="currentProject === project ? 'solid' : 'ghost'"
        color="primary"
        class="w-full justify-between"
        @click="selectProject(project)"
        :disabled="currentProject === project"
      >
        <template #default>
          <div class="w-full text-left">
            {{ project }}
          </div>
        </template>
        <template #trailing>
          <UButton
            icon="fa7-solid:trash"
            variant="ghost"
            color="error"
            class="mr-1 p-0.5"
            @click.stop="deleteProject(project)"
          />
        </template>
      </UButton>
    </div>
  </UCard>
</template>
