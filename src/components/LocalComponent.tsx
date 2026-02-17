import { useEffect, useState, type ChangeEvent } from 'react'
import OpenPositionsList from './OpenPositionsList'
import {
  buildJobPositionList,
  type JobApiResponse,
  type JobPosition,
} from '../models/Job'
import {
  buildUserModel,
  clearInMemoryUser,
  getInMemoryUser,
  type CandidateApiResponse,
  type User,
} from '../models/User'

const apiBaseUrl = __API_BASE_URL__.replace(/\/+$/, '')

function LocalComponent(): JSX.Element {
  const [user, setUser] = useState<User | null>(getInMemoryUser())
  const [emailInput, setEmailInput] = useState('')
  const [jobs, setJobs] = useState<JobPosition[]>([])
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [isJobsLoading, setIsJobsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCandidateNotFound, setIsCandidateNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const userLabel = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : ''

  useEffect(() => {
    let isUnmounted = false

    async function loadJobs(): Promise<void> {
      if (!apiBaseUrl) {
        if (!isUnmounted) {
          setJobsError('Missing BASE_URL in .env')
        }
        return
      }

      setIsJobsLoading(true)
      setJobsError(null)

      try {
        const response = await fetch(`${apiBaseUrl}/api/jobs/get-list`, {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = (await response.json()) as JobApiResponse[]
        if (!isUnmounted) {
          setJobs(buildJobPositionList(data))
        }
      } catch (requestError) {
        if (!isUnmounted) {
          setJobsError(
            requestError instanceof Error
              ? requestError.message
              : 'Unexpected request error',
          )
        }
      } finally {
        if (!isUnmounted) {
          setIsJobsLoading(false)
        }
      }
    }

    void loadJobs()

    return () => {
      isUnmounted = true
    }
  }, [])

  async function handleGetCandidate(): Promise<void> {
    const email = emailInput.trim()

    if (!apiBaseUrl) {
      setError('Missing BASE_URL in .env')
      setIsCandidateNotFound(false)
      return
    }

    if (!email) {
      setError('Please enter an email')
      setIsCandidateNotFound(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setIsCandidateNotFound(false)

    try {
      const url =
        `${apiBaseUrl}/api/candidate/get-by-email` +
        `?email=${encodeURIComponent(email)}`
      const response = await fetch(url, { method: 'GET' })

      if (response.status === 404) {
        setError(`No candidate found for "${email}".`)
        setIsCandidateNotFound(true)
        return
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = (await response.json()) as CandidateApiResponse
      const model = buildUserModel(data)
      setUser(model)
      setEmailInput(model.email)
    } catch (requestError) {
      setIsCandidateNotFound(false)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unexpected request error',
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
    setEmailInput(event.target.value)
    if (error) {
      setError(null)
      setIsCandidateNotFound(false)
    }
  }

  function handleLogout(): void {
    clearInMemoryUser()
    setUser(null)
    setError(null)
    setIsCandidateNotFound(false)
  }

  return (
    <section className="candidate-page">
      <header className="candidate-header">
        {user ? (
          <h1>{`Hi, ${userLabel}`}</h1>
        ) : (
          <input
            className="candidate-email-input"
            type="email"
            value={emailInput}
            onChange={handleEmailChange}
            placeholder="Enter email"
            aria-label="Candidate email"
          />
        )}

        {user ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <button onClick={handleGetCandidate} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load candidate'}
          </button>
        )}
      </header>

      {error ? (
        <div
          role="alert"
          className={
            isCandidateNotFound
              ? 'candidate-error candidate-error-not-found'
              : 'candidate-error'
          }
        >
          {isCandidateNotFound ? <strong>Candidate not found.</strong> : null}
          <span>{error}</span>
        </div>
      ) : null}

      <main className="candidate-content">
        {isJobsLoading ? (
          <p className="jobs-status">Loading open positions...</p>
        ) : null}

        {jobsError ? (
          <p role="alert" className="jobs-status jobs-status-error">
            {jobsError}
          </p>
        ) : null}

        {!isJobsLoading && !jobsError ? (
          <OpenPositionsList jobs={jobs} user={user} apiBaseUrl={apiBaseUrl} />
        ) : null}
      </main>
    </section>
  )
}

export default LocalComponent
