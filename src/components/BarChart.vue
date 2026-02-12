<script setup lang="ts">
import { Bar } from "vue-chartjs"
import {
  Chart as ChartJS,
  Colors,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js"
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Colors)

const { data } = defineProps<{
  data: any
  options?: any
}>()
</script>

<template>
  <div>
    <Bar
      :options="options"
      :data="data"
    />
  </div>
</template>
