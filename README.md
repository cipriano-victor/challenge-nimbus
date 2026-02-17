# challenge-nimbus

Minimal local React starter using Vite + TypeScript.

## Prerequisite

- Node.js LTS

## Environment variables

Create a `.env` file in the project root:

```bash
BASE_URL=https://your-api-domain.com
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Type an email in the header input, then click **Load candidate** to call:

`$BASE_URL/api/candidate/get-by-email?email=$HEADER_INPUT_EMAIL`

On app startup, it also loads open positions with:

`$BASE_URL/api/jobs/get-list`

Each position row includes:

- Position title
- GitHub URL input
- Submit button

Submit sends:

`POST $BASE_URL/api/candidate/apply-to-job`

with:

```json
{
  "uuid": "logged user uuid",
  "jobId": "selected job id",
  "candidateId": "logged user candidateId",
  "repoUrl": "typed GitHub repo URL"
}
```
