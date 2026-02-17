export interface JobApiResponse {
  id: string
  title: string
}

export class JobPosition {
  id: string
  title: string

  constructor(job: JobApiResponse) {
    this.id = job.id
    this.title = job.title
  }
}

export function buildJobPositionList(jobs: JobApiResponse[]): JobPosition[] {
  return jobs.map((job) => new JobPosition(job))
}
