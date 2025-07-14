export type WorkflowStep = 
  | 'initialized'
  | 'researching'
  | 'generating'
  | 'validating'
  | 'completed'
  | 'error'

export interface WorkflowHistoryEntry {
  step: WorkflowStep
  timestamp: string
  data?: any
}

export class WorkflowState {
  private currentStep: WorkflowStep = 'initialized'
  private history: WorkflowHistoryEntry[] = []
  private data: Record<string, any> = {}
  private error: string | null = null

  constructor() {
    this.addHistoryEntry('initialized')
  }

  transition(step: WorkflowStep): void {
    this.currentStep = step
    this.addHistoryEntry(step)
  }

  getStep(): WorkflowStep {
    return this.currentStep
  }

  addData(key: string, value: any): void {
    this.data[key] = value
  }

  getData(): Record<string, any> {
    return { ...this.data }
  }

  setError(error: string): void {
    this.error = error
    this.data.errorDetails = {
      message: error,
      timestamp: new Date().toISOString(),
      step: this.currentStep
    }
  }

  getError(): string | null {
    return this.error
  }

  getHistory(): WorkflowHistoryEntry[] {
    return [...this.history]
  }

  private addHistoryEntry(step: WorkflowStep): void {
    this.history.push({
      step,
      timestamp: new Date().toISOString(),
      data: this.data[step]
    })
  }

  reset(): void {
    this.currentStep = 'initialized'
    this.history = []
    this.data = {}
    this.error = null
    this.addHistoryEntry('initialized')
  }
}