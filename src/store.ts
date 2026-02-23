import { createGlobalState, useLocalStorage } from "@vueuse/core"
import { openDB, DBSchema } from "idb"
import { ProjectTime, Timestamp, Workday, WorkWeek } from "./model"
import {
  addHours,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfWeek,
  isWeekend,
  startOfWeek,
  subMonths,
  WeekOptions,
} from "date-fns"
import { createWorkday, round, roundDate } from "./helpers"

const WEEK_OPTIONS = <WeekOptions>{ weekStartsOn: 1 }
const workHoursPerDay = useLocalStorage("workHoursPerDay", 0)
const showWholeCurrentWeek = useLocalStorage("showWholeCurrentWeek", false)

interface ProjectTimeSchema extends DBSchema {
  data: {
    key: Date
    value: Timestamp
  }
}

export const useProjectTimeStore = createGlobalState(async () => {
  const db = await openDB<ProjectTimeSchema>("project-time", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction, _event) {
      db.createObjectStore("data", { keyPath: "timestamp" })
    },
  })

  const currentProject = ref<string>("None")
  const totalBalance = ref(0)
  const workWeeks = ref<WorkWeek[]>([])
  const recommendedTimestamps = ref<string[]>([])

  function getTimestamps(
    allTimestamps: Timestamp[],
    minDate?: Date,
    maxDate?: Date,
  ) {
    if (minDate && maxDate) {
      return allTimestamps.filter(
        (t) => t.timestamp > minDate && t.timestamp < maxDate,
      )
    } else if (minDate) {
      return allTimestamps.filter((t) => t.timestamp > minDate)
    } else {
      return allTimestamps
    }
  }

  async function addTimestamp(
    date: Date,
    project: string,
    description?: string,
  ) {
    await db.add("data", <Timestamp>{
      timestamp: roundDate(date),
      project,
      description,
    })
    await reloadWeek(date)
  }

  async function updateProject(timestamp: Date, project: string) {
    const updateTimestamp = await db.get("data", timestamp)
    if (!updateTimestamp) {
      return
    }
    updateTimestamp.project = project
    await db.put("data", updateTimestamp)
    await reloadWeek(timestamp)
  }

  async function updateDescription(timestamp: Date, description?: string) {
    const updateTimestamp = await db.get("data", timestamp)
    if (!updateTimestamp) {
      return
    }
    updateTimestamp.description = description
    await db.put("data", updateTimestamp)
    await reloadWeek(timestamp)
  }

  async function updateTimestamp(timestamp: Date, newTimestamp: Date) {
    const updateTimestamp = await db.get("data", timestamp)
    if (!updateTimestamp) {
      return
    }
    updateTimestamp.timestamp = newTimestamp
    await db.delete("data", timestamp)
    await db.add("data", updateTimestamp)
    await reloadWeek(timestamp)
    await reloadWeek(newTimestamp)
  }

  async function deleteTimestamp(timestamp: Date) {
    await db.delete("data", timestamp)
    await reloadWeek(timestamp)
  }

  function updateBalances() {
    totalBalance.value = workWeeks.value.reduce((s, w) => (s += w.balance), 0)
  }

  function parseWorkday(day: Date, allTimestamps: Timestamp[]) {
    const timestamps = getTimestamps(allTimestamps, day, endOfDay(day))
    if (
      timestamps.length === 0 &&
      (startOfWeek(day, WEEK_OPTIONS).getTime() ===
        startOfWeek(new Date(), WEEK_OPTIONS).getTime() ||
        isWeekend(day) ||
        workHoursPerDay.value === 0)
    ) {
      return <Workday>{
        date: day,
        timestamps,
        totalHours: 0,
        balance: 0 - workHoursPerDay.value,
        projectTimes: [],
        workSegments: [],
      }
    } else if (timestamps.length === 0) {
      const start = new Date(day.getTime())
      start.setHours(8, 0, 0, 0)
      timestamps.push(<Timestamp>{
        key: start,
        timestamp: start,
        project: "Out-of-Office",
      })
      const end = addHours(start, workHoursPerDay.value)
      timestamps.push(<Timestamp>{ key: end, timestamp: end, project: "None" })
    }
    return createWorkday(timestamps)
  }

  function loadWeek(date: Date, allTimestamps: Timestamp[]) {
    const start = startOfWeek(date, WEEK_OPTIONS)
    const end = endOfWeek(date, WEEK_OPTIONS)
    const today = endOfDay(new Date())
    const lastDay = !showWholeCurrentWeek.value && end > today ? today : end
    const weekDays = eachDayOfInterval({
      start: start,
      end: lastDay,
    })
      .map((d) => parseWorkday(d, allTimestamps))
      .filter((d) => d.timestamps.length > 0 || !isWeekend(d.date))
    const projectTimes: ProjectTime[] = []
    for (const w of weekDays) {
      for (const p of w.projectTimes) {
        const project = projectTimes.find((wp) => wp.project === p.project)
        if (project) {
          project.duration += p.duration
        } else {
          projectTimes.push(<ProjectTime>{
            project: p.project,
            duration: p.duration,
          })
        }
      }
    }
    const totalHours = round(
      weekDays.reduce((total, d) => {
        total += d.totalHours
        return total
      }, 0),
    )
    const balance = round(
      weekDays.reduce((balance, d) => {
        balance += d.balance
        return balance
      }, 0),
    )
    return <WorkWeek>{
      firstDay: start,
      days: weekDays.reverse(),
      totalHours,
      balance,
      projectTimes,
    }
  }

  async function getTimestampsFromDb(from: Date) {
    return await db.getAll("data", IDBKeyRange.lowerBound(from))
  }

  async function loadTimestamps() {
    const allTimestamps = await db.getAll("data")
    allTimestamps.forEach((t) => {
      t.key = t.timestamp
      t.timestamp = roundDate(t.timestamp)
    })

    currentProject.value = allTimestamps[allTimestamps.length - 1].project
    const today = endOfDay(new Date())

    const weeks = eachWeekOfInterval(
      { start: allTimestamps[0].timestamp, end: today },
      WEEK_OPTIONS,
    )

    workWeeks.value = weeks.map((w) => loadWeek(w, allTimestamps)).reverse()
    updateBalances()

    const timestampOccurrences = getTimestamps(
      allTimestamps,
      subMonths(today, 3),
      today,
    )
      .map((t) => t.timestamp.toTimeString().substring(0, 5))
      .reduce((map, element) => {
        if (map.has(element)) {
          map.set(element, map.get(element) + 1)
        } else {
          map.set(element, 1)
        }
        return map
      }, new Map())
      .entries()

    recommendedTimestamps.value = [...timestampOccurrences]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 10)
      .map((x) => x[0])
      .sort()
  }
  await loadTimestamps()

  async function deleteOldData(threshold: Date) {
    const allKeys = await db.getAllKeys("data")
    const oldKeys = allKeys.filter((d) => d < threshold)
    for (const key of oldKeys) {
      await db.delete("data", key)
    }
    await loadTimestamps()
  }

  async function reloadWeek(date: Date) {
    const firstDay = startOfWeek(date, WEEK_OPTIONS)
    const weekTimestamps = await db.getAll(
      "data",
      IDBKeyRange.bound(firstDay, endOfWeek(date, WEEK_OPTIONS)),
    )
    weekTimestamps.forEach((t) => {
      t.key = t.timestamp
      t.timestamp = roundDate(t.timestamp)
    })
    const week = loadWeek(firstDay, weekTimestamps)

    const idx = workWeeks.value.findIndex(
      (w) => w.firstDay.getTime() === firstDay.getTime(),
    )
    if (idx >= 0) {
      workWeeks.value.splice(idx, 1, week)
    } else {
      workWeeks.value.splice(0, 0, week)
    }
    updateBalances()
    if (
      firstDay.getTime() === startOfWeek(new Date(), WEEK_OPTIONS).getTime()
    ) {
      currentProject.value = weekTimestamps[weekTimestamps.length - 1].project
    }
  }

  return {
    currentProject,
    workWeeks,
    totalBalance,
    recommendedTimestamps,
    loadTimestamps,
    getTimestampsFromDb,
    addTimestamp,
    updateProject,
    updateDescription,
    updateTimestamp,
    deleteTimestamp,
    deleteOldData,
  }
})
