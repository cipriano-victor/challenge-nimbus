export interface CandidateApiResponse {
  uuid: string
  candidateId: string
  applicationId: string
  firstName: string
  lastName: string
  email: string
}

export class User {
  uuid: string
  candidateId: string
  applicationId: string
  firstName: string
  lastName: string
  email: string

  constructor(candidate: CandidateApiResponse) {
    this.uuid = candidate.uuid
    this.candidateId = candidate.candidateId
    this.applicationId = candidate.applicationId
    this.firstName = candidate.firstName
    this.lastName = candidate.lastName
    this.email = candidate.email
  }
}

let inMemoryUser: User | null = null

export function buildUserModel(candidate: CandidateApiResponse): User {
  const user = new User(candidate)
  inMemoryUser = user
  return user
}

export function getInMemoryUser(): User | null {
  return inMemoryUser
}

export function clearInMemoryUser(): void {
  inMemoryUser = null
}
