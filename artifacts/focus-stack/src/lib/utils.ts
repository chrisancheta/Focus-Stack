import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0]
}
