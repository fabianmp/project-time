<script setup lang="ts">
import { Pie } from "vue-chartjs"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
ChartJS.register(ArcElement, Tooltip, Legend)

const { data } = defineProps<{
  data: any
  options?: any
}>()
</script>

<template>
  <div>
    <Pie
      :options="options"
      :data="data"
    />
  </div>
</template>
