export interface Timestamp {
  key: Date
  timestamp: Date
  project: string
  description?: string
  duration?: number
  isBreak?: boolean
  isLast?: boolean
}

export interface WorkSegment {
  start: Date
  end?: Date
  isBreak: boolean
  icon: string
}

export interface ProjectTime {
  duration: number
  project: string
  description: string
}

export interface Workday {
  date: Date
  totalHours: number
  balance: number
  timestamps: Timestamp[]
  projectTimes: ProjectTime[]
  workSegments: WorkSegment[]
}

export interface WorkWeek {
  firstDay: Date
  days: Workday[]
  totalHours: number
  balance: number
  projectTimes: ProjectTime[]
}

type Color =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral"

interface ProjectProps {
  name: string
  icon: string
  color: Color
  rowColor: string
  textColor: string
  noWork: boolean
}

export const SystemProjects: ProjectProps[] = [
  {
    name: "None",
    icon: "fa7-solid:stop",
    color: "error",
    rowColor: "bg-red-300",
    textColor: "text-red-600",
    noWork: true,
  },
  {
    name: "Out-of-Office",
    icon: "fa7-solid:calendar-times",
    color: "neutral",
    rowColor: "bg-gray-300",
    textColor: "text-gray-600",
    noWork: false,
  },
  {
    name: "Lunch",
    icon: "fa7-solid:utensils",
    color: "success",
    rowColor: "bg-green-200",
    textColor: "text-green-700",
    noWork: true,
  },
  {
    name: "Break",
    icon: "fa7-solid:coffee",
    color: "success",
    rowColor: "bg-green-200",
    textColor: "text-green-700",
    noWork: true,
  },
]
