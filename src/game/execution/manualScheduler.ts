import type { Scheduler } from '@/game/execution/scheduler'

interface Task {
  callback: () => void
  cancelled: boolean
}

export class ManualScheduler implements Scheduler {
  private tasks: Task[] = []

  schedule(callback: () => void): () => void {
    const task: Task = { callback, cancelled: false }
    this.tasks.push(task)
    return () => {
      task.cancelled = true
    }
  }

  get pending(): number {
    return this.tasks.filter((task) => !task.cancelled).length
  }

  runNext(): boolean {
    while (this.tasks.length > 0) {
      const task = this.tasks.shift()
      if (task && !task.cancelled) {
        task.callback()
        return true
      }
    }
    return false
  }

  runAll(limit = 10000): void {
    for (let count = 0; count < limit && this.runNext(); count += 1) {
      continue
    }
  }
}
