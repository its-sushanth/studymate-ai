# StudyMate AI

StudyMate AI is a React/Vite study application backed by a FastAPI RAG service. The backend extracts uploaded documents, creates embeddings with Sentence Transformers, indexes chunks in per-document FAISS indexes, and uses the configured AI provider for grounded chat, summaries, and quizzes.

## Local development

### Frontend

The local Vite configuration is in `.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Install dependencies and run the frontend from the project root:

```powershell
npm install
npm run dev
```

### Backend

Create `backend/.env` from `backend/.env.example` and set `API_KEY` to your provider key. Keep that key in the backend environment only; do not put it in a `VITE_` variable, frontend source, or browser storage.

Install and run the FastAPI backend from the project root:

```powershell
python -m pip install -r backend\requirements.txt
python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000
```

The API health check is available at `http://127.0.0.1:8000/healthz` (also `/api/health`), and the interactive API docs are at `http://127.0.0.1:8000/docs`.

The first backend startup downloads and loads the configured Sentence Transformers model. It requires outbound network access to Hugging Face unless the model is already cached.

## Deploy the backend to Render

The repository includes a Render Blueprint in `render.yaml`. Create a Render Blueprint service from the repository and review the service plan before applying it. The configuration uses a Standard instance to provide more memory for the CPU embedding model and PyTorch; Render may charge for that plan.

Set these backend environment variables in Render:

| Variable | Value |
| --- | --- |
| `API_KEY` | Your OpenRouter key, entered only in Render's backend environment settings |
| `AI_PROVIDER` | `openrouter` |
| `AI_MODEL` | `openai/gpt-4o-mini` |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` |
| `FRONTEND_URL` | The deployed Vercel origin, e.g. `https://your-study-app.vercel.app` |

`PORT` is supplied by Render. The configured start command binds to `0.0.0.0` and uses that port. The health check is `/healthz`. `FRONTEND_URL` can contain multiple comma-separated origins when required. Local `localhost:5173` origins remain enabled for development. Hosted environment variables take precedence over values in `backend/.env`.

The default Blueprint plan is Standard because loading PyTorch and the embedding model can exceed the memory available to small instances. Review current Render pricing before creating a paid service.

## Deploy the frontend to Vercel

Import the repository into Vercel. Use the project root as the root directory, `npm run build` as the build command, and `dist` as the output directory.

Add this Vercel **frontend** environment variable, using the HTTPS URL of the deployed Render service:

```env
VITE_API_BASE_URL=https://your-studymate-backend.onrender.com
```

Do not add `API_KEY` or other provider credentials to Vercel. Vite variables are delivered to browser code and are not secret. Rebuild/redeploy the frontend after changing `VITE_API_BASE_URL`. Set the backend's `FRONTEND_URL` to the exact Vercel production origin and redeploy/restart the backend after changing it.

## Configuration and security

- `backend/.env` is for local backend development and is ignored by Git. Render configuration should be managed through Render's environment settings.
- `.env.example` and `backend/.env.example` contain templates only.
- CORS allows the local Vite origins plus origins explicitly listed in `FRONTEND_URL`; it does not use a wildcard.
- Health responses report whether a key is configured but never return the key itself.
- Rotate provider credentials immediately if they have ever been exposed; do not paste them into source files, commits, chat, logs, or frontend variables.
- This workspace may not have Git metadata available. Before publishing, verify that no secret-containing `.env` file is tracked or present in repository history.

## RAG storage limitation

Uploaded documents, extracted text, chunk metadata, embeddings, and FAISS indexes are held in backend process memory. They **disappear when the Render service restarts, redeploys, or scales to another instance**. The browser's local document metadata does not persist the backend document contents. Persistent storage or a database and a durable/shared vector index are required before relying on uploaded materials across restarts or multiple instances.

## Tests and checks

From the project root:

```powershell
python -m py_compile backend\main.py backend\rag_engine.py backend\tests\test_rag_engine.py
python -m unittest discover -s backend\tests -v
npm run build
```
