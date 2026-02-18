import { intervalToDuration, startOfDay } from "date-fns"
import {
  ProjectTime,
  SystemProjects,
  TicketTime,
  Timestamp,
  Workday,
  WorkSegment,
} from "./model"
import { useLocalStorage } from "@vueuse/core"

const rounded = useLocalStorage("rounded", false)
const parseTickets = useLocalStorage("parseTicketNumbers", false)
const parseTicketPattern = useLocalStorage("parseTicketNumbersPattern", "")
const workHoursPerDay = useLocalStorage("workHoursPerDay", 0)

export function roundDate(date: Date) {
  const timestamp = new Date(date)
  if (rounded.value) {
    timestamp.setMinutes(Math.round(timestamp.getMinutes() / 15) * 15)
  }
  timestamp.setSeconds(0, 0)
  return timestamp
}

export function round(value: number, decimals: number = 2) {
  const factor = 10 * decimals
  return Math.round(value * factor) / factor
}

export function getDuration(start: Date, end: Date) {
  if (!start || !end) {
    return undefined
  }
  const duration = intervalToDuration({
    start: start,
    end: end,
  })
  return round((duration.hours ?? 0) + (duration.minutes ?? 0) / 60, 2)
}

function getIcon(timestamp: Timestamp) {
  const project = SystemProjects.find((p) => p.name === timestamp.project)
  return project?.icon ?? "fa7-solid:briefcase"
}

export function createWorkday(timestamps: Timestamp[]) {
  for (const [i, ts] of timestamps.entries()) {
    ts.isBreak = ts.project === "Lunch" || ts.project === "Break"
    ts.isLast = i === timestamps.length - 1
    ts.duration = 0
    if (i > 0) {
      const previous = timestamps[i - 1]
      previous.duration = getDuration(previous.timestamp, ts.timestamp)
    }
  }

  const ticketPattern = new RegExp(parseTicketPattern.value)
  const workSegments: WorkSegment[] = []
  let projectTimes: ProjectTime[] = []
  for (const [i, timestamp] of timestamps.entries()) {
    const ticket = timestamp.description?.match(ticketPattern)
    const projectTime = projectTimes.find(
      (p) => p.project === timestamp.project,
    )
    if (!projectTime) {
      projectTimes.push(<ProjectTime>{
        project: timestamp.project,
        duration: timestamp.duration,
        description: timestamp.description?.trim(),
        tickets:
          parseTickets.value && ticket
            ? [
                <TicketTime>{
                  duration: timestamp.duration,
                  ticket: ticket?.groups?.ticket ?? "",
                  description: ticket?.groups?.description.trim() ?? timestamp.description,
                },
              ]
            : [],
      })
    } else {
      projectTime.duration += timestamp.duration ?? 0
      if (timestamp.description?.trim()) {
        projectTime.description = [
          projectTime.description,
          timestamp.description?.trim(),
        ].join(", ")
        if (parseTickets.value && ticket) {
          const existingTicket = projectTime.tickets.find(
            (t) => t.ticket === ticket.groups?.ticket,
          )
          if (existingTicket) {
            existingTicket.duration += timestamp.duration ?? 0
            existingTicket.description = [
              existingTicket.description,
              ticket.groups!.description.trim(),
            ].join(", ")
          } else {
            projectTime.tickets.push(<TicketTime>{
              project: timestamp.project,
              duration: timestamp.duration,
              ticket: ticket.groups!.ticket,
              description: ticket.groups!.description.trim(),
            })
          }
        }
      }
    }
    if (workSegments.length === 0) {
      workSegments.push(<WorkSegment>{
        start: timestamp.timestamp,
        end: undefined,
        isBreak: timestamp.isBreak,
        icon: getIcon(timestamp),
      })
    } else {
      const previousSegment = workSegments[workSegments.length - 1]
      if (
        previousSegment.isBreak !== timestamp.isBreak ||
        (previousSegment.isBreak &&
          timestamp.project !== timestamps[i - 1].project)
      ) {
        previousSegment.end = timestamp.timestamp
        workSegments.push(<WorkSegment>{
          start: timestamp.timestamp,
          end: undefined,
          isBreak: timestamp.isBreak,
          icon: getIcon(timestamp),
        })
      } else if (timestamp.project === "None" && i === timestamps.length - 1) {
        const segment = workSegments[workSegments.length - 1]
        segment.end = timestamp.timestamp
      }
    }
  }

  projectTimes = projectTimes.filter(
    (p) => !SystemProjects.find((s) => s.name === p.project && s.noWork),
  )
  const totalHours = projectTimes.reduce((s, p) => (s += p.duration), 0)

  return <Workday>{
    date: startOfDay(timestamps[0].timestamp),
    timestamps,
    totalHours,
    balance: round(totalHours - workHoursPerDay.value),
    projectTimes: projectTimes,
    workSegments,
  }
}
