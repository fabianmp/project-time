const internalProjects = [
  {
    name: "None",
    icon: "fa-stop",
    internal: true,
  },
  {
    name: "Lunch",
    icon: "fa-utensils",
    internal: true,
  },
  {
    name: "Break",
    icon: "fa-coffee",
    internal: true,
  },
]

const app = Vue.createApp({
  data() {
    return {
      rounded: false,
      projects: [],
      currentProject: null,
      days: new Map(),
      calculatedDays: [],
      weekTotalTime: 0,
      weekProjectTimes: [],
    }
  },
  async mounted() {
    await idb.openDB("project-time", 1, {
      upgrade(db, oldVersion, newVersion, transaction, event) {
        db.createObjectStore("data", { keyPath: "timestamp" })
      },
    })
    this.rounded = JSON.parse(window.localStorage.getItem("rounded") ?? "false")
    this.loadProjects()
    await this.loadData()

    tippy.createSingleton(tippy("[data-tippy-content]"), {
      appendTo: () => document.body,
      delay: [500, 0],
    })
  },
  methods: {
    loadProjects() {
      this.projects.splice(0, this.projects.length, ...internalProjects)
      const projects = JSON.parse(
        window.localStorage.getItem("projects") ?? "[]"
      )
      projects.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      )
      this.projects.splice(
        this.projects.length,
        0,
        ...projects.map((p) => ({ name: p, icon: "fa-stopwatch" }))
      )
    },
    addProject(event) {
      const projects = JSON.parse(
        window.localStorage.getItem("projects") ?? "[]"
      )
      projects.push(event.target.value)
      window.localStorage.setItem("projects", JSON.stringify(projects))
      this.loadProjects()
      event.target.value = ""
    },
    deleteProject(name) {
      let projects = JSON.parse(window.localStorage.getItem("projects") ?? "[]")
      projects = projects.filter((p) => p !== name)
      window.localStorage.setItem("projects", JSON.stringify(projects))
      this.loadProjects()
    },
    getProjectsForEntry(entry) {
      const projects = this.projects.map((p) => p.name)
      if (!projects.includes(entry.project)) {
        projects.push(entry.project)
      }
      return projects
    },
    async loadData() {
      await this.loadDaysFromDb()
      const today = new Date().toISOString().substring(0, 10)
      if (!this.days.get(today)) {
        this.days.set(today, [])
      }
      const todayTimestamps = this.days.get(today)
      this.currentProject = todayTimestamps
        ? todayTimestamps[todayTimestamps.length - 1]?.project
        : this.projects[0].name

      this.calculatedDays.splice(0, this.calculatedDays.length)
      for (const date of Array.from(this.days.keys()).sort().reverse()) {
        const dayEntries = this.days.get(date)
        const roundedTimestamps = []
        for (const [i, entry] of dayEntries.entries()) {
          roundedTimestamps.push({
            timestamp: entry.timestamp,
            roundedTimestamp: this.toQuarter(entry.timestamp),
            project: entry.project,
            description: entry.description,
            duration: this.getDuration(
              this.toQuarter(entry.timestamp),
              this.toQuarter(dayEntries[i + 1]?.timestamp ?? entry.timestamp)
            ),
            isBreak: this.isBreak(entry),
            isProjectMissing:
              entry.project === "None" && i !== dayEntries.length - 1,
          })
        }
        const workSegments = []
        const projectTimes = new Map()
        for (const [i, entry] of roundedTimestamps.entries()) {
          const m = projectTimes.get(entry.project)
          if (!m) {
            projectTimes.set(entry.project, {
              duration: entry.duration,
              descriptions: [entry.description],
            })
          } else {
            m.duration += entry.duration
            m.descriptions.push(entry.description)
          }
          if (workSegments.length === 0) {
            workSegments.push({
              start: entry.roundedTimestamp,
              end: undefined,
              break: this.isBreak(entry),
              icon: this.getIcon(entry),
            })
          } else {
            const segment = workSegments[workSegments.length - 1]
            if (
              segment.break !== this.isBreak(entry) ||
              (segment.break &&
                entry.project !== roundedTimestamps[i - 1].project)
            ) {
              segment.end = entry.roundedTimestamp
              workSegments.push({
                start: entry.roundedTimestamp,
                end: undefined,
                break: this.isBreak(entry),
                icon: this.getIcon(entry),
              })
            } else if (
              entry.project === "None" &&
              i === roundedTimestamps.length - 1
            ) {
              const segment = workSegments[workSegments.length - 1]
              segment.end = entry.roundedTimestamp
            }
          }
        }
        const allProjectTimes = Array.from(projectTimes.entries())
        this.calculatedDays.push({
          date,
          timestamps: roundedTimestamps,
          workSegments,
          totalTime: roundedTimestamps
            .filter((e) => !this.isBreak(e))
            .reduce((s, e) => {
              return s + e.duration
            }, 0),
          projectTimes: allProjectTimes
            .filter(
              ([project, _]) =>
                !internalProjects.map((i) => i.name).includes(project)
            )
            .sort(([a, _a], [b, _b]) =>
              a.localeCompare(b, undefined, { sensitivity: "base" })
            )
            .map(([project, entry]) => ({
              project,
              duration: entry.duration,
              description: entry.descriptions.filter((d) => d).join("; "),
            })),
        })
      }
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
      const fromDate = startOfWeek.toISOString().substring(0, 10)
      const daysThisWeek = this.calculatedDays.filter((d) => d.date >= fromDate)
      this.weekTotalTime = daysThisWeek.reduce((s, d) => (s += d.totalTime), 0)
      const weekProjectTimes = new Map()
      for (const d of daysThisWeek) {
        for (const project of d.projectTimes) {
          const m = weekProjectTimes.get(project.project)
          if (!m) {
            weekProjectTimes.set(project.project, project.duration)
          } else {
            weekProjectTimes.set(project.project, m + project.duration)
          }
        }
      }
      const weekProjectTimesSorted = Array.from(weekProjectTimes.entries())
        .map(([name, duration]) => ({
          name,
          duration,
        }))
        .sort((p1, p2) => (p1.name < p2.name ? -1 : 1))
      this.weekProjectTimes.splice(
        0,
        this.weekProjectTimes.length,
        ...weekProjectTimesSorted
      )
    },
    async loadDaysFromDb() {
      const db = await idb.openDB("project-time")
      const allEntries = await db.getAll("data")
      this.days.clear()
      for (entry of allEntries) {
        const date = entry.timestamp.toISOString().substring(0, 10)
        const day = this.days.get(date)
        if (!day) {
          this.days.set(date, [entry])
        } else {
          day.push(entry)
        }
      }
    },
    async deleteOldData() {
      const db = await idb.openDB("project-time")
      const allKeys = await db.getAllKeys("data")
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - 14)
      threshold.setHours(0)
      threshold.setMinutes(0)
      threshold.setSeconds(0, 0)
      const oldKeys = allKeys.filter((d) => d < threshold)
      for (const key of oldKeys) {
        await db.delete("data", key)
      }
      await this.loadData()
    },
    async downloadCsv() {
      const data = []
      data.push("timestamp;project;description")
      const db = await idb.openDB("project-time")
      const allEntries = await db.getAll("data")
      for (const entry of allEntries) {
        data.push(
          `${entry.timestamp.toISOString()};"${
            entry.project
          }";"${encodeURIComponent(entry.description)}"`
        )
      }
      const csvContent = encodeURI(
        "data:text/csv;charset=utf-8," + data.join("\n")
      )
      var link = document.createElement("a")
      link.setAttribute("href", csvContent)
      link.setAttribute("download", "project-time.csv")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    async addProjectTimestamp(project, date) {
      let timestamp = new Date()
      timestamp.setSeconds(0, 0)
      const day = this.days.get(date)
      if (day && day.length > 0) {
        timestamp = new Date(day[day.length - 1].timestamp)
        timestamp.setMinutes(timestamp.getMinutes() + 15)
        timestamp.setSeconds(0, 0)
      }
      const db = await idb.openDB("project-time")
      await db.put("data", { timestamp: timestamp, project, description: "" })
      await this.loadData()
    },
    async deleteProjectTimestamp(entry) {
      const db = await idb.openDB("project-time")
      await db.delete("data", entry.timestamp)
      await this.loadData()
    },
    async toggleRounded() {
      this.rounded = !this.rounded
      window.localStorage.setItem("rounded", JSON.stringify(this.rounded))
      await this.loadData()
    },
    isBreak(entry) {
      return entry.project === "Lunch" || entry.project === "Break"
    },
    getIcon(entry) {
      switch (entry.project) {
        case "Break":
          return "fa-coffee"
        case "Lunch":
          return "fa-utensils"
        case "None":
          return "fa-stop"
        default:
          return "fa-briefcase"
      }
    },
    toQuarter(date) {
      const timestamp = new Date(date)
      if (this.rounded) {
        timestamp.setMinutes(Math.round(timestamp.getMinutes() / 15) * 15)
      }
      timestamp.setSeconds(0, 0)
      return timestamp
    },
    getDuration(start, end) {
      return Math.round(((end - start) / (60 * 60 * 1000)) * 100) / 100
    },
    async changeDate(date, event) {
      const day = this.days.get(date)
      const db = await idb.openDB("project-time")
      for (const entry of day) {
        await db.delete("data", entry.timestamp)
        const newDate = new Date(event.target.value)
        newDate.setHours(entry.timestamp.getHours())
        newDate.setMinutes(entry.timestamp.getMinutes())
        newDate.setSeconds(0, 0)
        await db.put("data", {
          timestamp: newDate,
          project: entry.project,
          description: entry.description,
        })
      }
      await this.loadData()
    },
    async changeTime(entry, event) {
      const db = await idb.openDB("project-time")
      await db.delete("data", entry.timestamp)
      const [hours, minutes, _] = event.target.value.split(":")
      entry.timestamp.setHours(hours)
      entry.timestamp.setMinutes(minutes)
      entry.timestamp.setSeconds(0, 0)
      await db.put("data", {
        timestamp: entry.timestamp,
        project: entry.project,
        description: entry.description,
      })
      await this.loadData()
    },
    async changeProject(entry, event) {
      const db = await idb.openDB("project-time")
      await db.put("data", {
        timestamp: entry.timestamp,
        project: event.target.value,
        description: entry.description,
      })
      await this.loadData()
    },
    async changeDescription(entry, event) {
      const db = await idb.openDB("project-time")
      await db.put("data", {
        timestamp: entry.timestamp,
        project: entry.project,
        description: event.target.value,
      })
      await this.loadData()
    },
  },
})

app.component("tooltip-dummy", {
  template: "<span></span>",
  mounted() {
    this.allTooltips = tippy("[data-tippy-content]")
    this.singletonTooltip = tippy.createSingleton(this.allTooltips, {
      appendTo: () => document.body,
      delay: [500, 0],
    })
  },
  unmounted() {
    this.allTooltips.forEach((t) => t.destroy())
    this.singletonTooltip.destroy()
  },
})

app.component("copyable-text", {
  template: "#copyable-text-template",
  props: {
    text: String,
  },
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(this.text)
    },
  },
})

const vm = app.mount("#app")
