import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { JobPosition } from '../models/Job'
import type { User } from '../models/User'

interface OpenPositionsListProps {
  jobs: JobPosition[]
  user: User | null
  apiBaseUrl: string
}

interface ApplyToJobResponse {
  ok: boolean
}

interface JobAlert {
  kind: 'error' | 'success'
  message: string
}

function isPublicGithubRepoUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    const isGithubHost =
      parsedUrl.hostname === 'github.com' || parsedUrl.hostname === 'www.github.com'
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean)

    return isHttp && isGithubHost && pathParts.length === 2
  } catch {
    return false
  }
}

function OpenPositionsList({
  jobs,
  user,
  apiBaseUrl,
}: OpenPositionsListProps): JSX.Element {
  const [githubUrls, setGithubUrls] = useState<Record<string, string>>({})
  const [jobAlerts, setJobAlerts] = useState<Record<string, JobAlert>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  function handleUrlChange(jobId: string, event: ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value
    setGithubUrls((currentUrls) => ({
      ...currentUrls,
      [jobId]: value,
    }))

    const currentAlert = jobAlerts[jobId]
    if (currentAlert?.kind === 'error') {
      setJobAlerts((alerts) => {
        const nextAlerts = { ...alerts }
        delete nextAlerts[jobId]
        return nextAlerts
      })
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    jobId: string,
  ): Promise<void> {
    event.preventDefault()

    const githubUrl = githubUrls[jobId]?.trim()
    if (!githubUrl) {
      setJobAlerts((alerts) => ({
        ...alerts,
        [jobId]: {
          kind: 'error',
          message: 'Please enter your GitHub repository URL.',
        },
      }))
      return
    }

    if (!isPublicGithubRepoUrl(githubUrl)) {
      setJobAlerts((alerts) => ({
        ...alerts,
        [jobId]: {
          kind: 'error',
          message: 'Please enter a valid public GitHub repository URL.',
        },
      }))
      return
    }

    if (!user) {
      setJobAlerts((alerts) => ({
        ...alerts,
        [jobId]: {
          kind: 'error',
          message: 'You are not logged in. Please login before applying.',
        },
      }))
      return
    }

    if (!apiBaseUrl) {
      setJobAlerts((alerts) => ({
        ...alerts,
        [jobId]: {
          kind: 'error',
          message: 'Missing BASE_URL in .env',
        },
      }))
      return
    }

    setIsSubmitting((currentState) => ({
      ...currentState,
      [jobId]: true,
    }))

    setJobAlerts((alerts) => {
      const nextAlerts = { ...alerts }
      delete nextAlerts[jobId]
      return nextAlerts
    })

    try {
      const response = await fetch(`${apiBaseUrl}/api/candidate/apply-to-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: user.uuid,
          jobId,
          candidateId: user.candidateId,
          repoUrl: githubUrl,
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = (await response.json()) as ApplyToJobResponse
      if (!data.ok) {
        throw new Error('Unexpected API response')
      }

      setJobAlerts((alerts) => ({
        ...alerts,
        [jobId]: {
          kind: 'success',
          message: 'Application submitted successfully.',
        },
      }))
    } catch (requestError) {
      setJobAlerts((alerts) => ({
        ...alerts,
        [jobId]: {
          kind: 'error',
          message:
            requestError instanceof Error
              ? requestError.message
              : 'Unexpected request error',
        },
      }))
    } finally {
      setIsSubmitting((currentState) => ({
        ...currentState,
        [jobId]: false,
      }))
    }
  }

  return (
    <section className="jobs-section" aria-label="Open work positions">
      <h2 className="jobs-title">Open positions</h2>

      {jobs.length === 0 ? (
        <p className="jobs-status">No open positions available.</p>
      ) : (
        <ul className="jobs-list">
          {jobs.map((job) => (
            <li key={job.id} className="jobs-list-item">
              <h3 className="jobs-list-item-title">{job.title}</h3>

              <form
                className="jobs-list-item-form"
                onSubmit={(event) => handleSubmit(event, job.id)}
              >
                <input
                  type="url"
                  value={githubUrls[job.id] ?? ''}
                  onChange={(event) => handleUrlChange(job.id, event)}
                  placeholder="https://github.com/your-username/your-repo"
                  aria-label={`GitHub URL for ${job.title}`}
                />
                <button type="submit" disabled={isSubmitting[job.id] ?? false}>
                  {isSubmitting[job.id] ? 'Submitting...' : 'Submit'}
                </button>
              </form>

              {jobAlerts[job.id] ? (
                <p
                  className={
                    jobAlerts[job.id].kind === 'success'
                      ? 'jobs-list-item-feedback jobs-list-item-feedback-success'
                      : 'jobs-list-item-feedback jobs-list-item-feedback-error'
                  }
                  role={jobAlerts[job.id].kind === 'error' ? 'alert' : undefined}
                >
                  {jobAlerts[job.id].message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default OpenPositionsList
