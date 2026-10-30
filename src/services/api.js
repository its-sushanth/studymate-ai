export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const CHAT_TIMEOUT_MS = 210_000;
const SUMMARY_TIMEOUT_MS = 390_000;
const QUIZ_TIMEOUT_MS = 180_000;

function backendUrl(path) {
  if (!API_BASE_URL) {
    throw new Error('Backend URL is not configured. Set VITE_API_BASE_URL and rebuild the frontend.');
  }
  return `${API_BASE_URL}${path}`;
}

async function postJson(path, payload, timeoutMs, operation) {
  let res;
  try {
    res = await fetch(backendUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error(`${operation} timed out. Please retry.`);
    }
    throw new Error(`Could not reach the backend for ${operation}: ${err.message}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`${operation} failed: the backend returned an invalid response.`);
  }
  if (!res.ok) {
    throw new Error(data.detail || `${operation} failed (HTTP ${res.status}).`);
  }
  return data;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(backendUrl('/api/health'), { method: 'GET' });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function uploadDocumentToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(backendUrl('/api/upload'), {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return await res.json();
}

export async function fetchBackendDocuments() {
  const res = await fetch(backendUrl('/api/documents'));
  if (!res.ok) throw new Error('Failed to fetch documents from backend');
  return await res.json();
}

export async function deleteBackendDocument(docId) {
  const res = await fetch(backendUrl(`/api/documents/${docId}`), {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete document from backend');
  return await res.json();
}

export async function sendChatMessageToBackend(message, docId = 'ALL') {
  const data = await postJson(
    '/api/chat',
    { message, doc_id: docId },
    CHAT_TIMEOUT_MS,
    'AI chat'
  );
  if (typeof data.answer !== 'string' || !data.answer.trim()) {
    throw new Error('AI chat failed: the backend returned no complete answer.');
  }
  return data;
}

export async function summarizeDocumentBackend(docId, length = 'medium') {
  const data = await postJson(
    '/api/summarize',
    { doc_id: docId, length },
    SUMMARY_TIMEOUT_MS,
    'document summary'
  );
  if (length === 'detailed' && (typeof data.summary_text !== 'string' || !data.summary_text.trim())) {
    throw new Error('Detailed summary failed: the backend returned no complete summary.');
  }
  return data;
}

export async function generateQuizBackend(
  docId = null,
  subject = 'Computer Science',
  topic = 'Operating Systems',
  count = 3,
  difficulty = 'Medium'
) {
  return postJson(
    '/api/quiz',
    { doc_id: docId, subject, topic, count, difficulty },
    QUIZ_TIMEOUT_MS,
    'quiz generation'
  );
}

export async function searchContentBackend(query) {
  const res = await fetch(backendUrl('/api/search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errorData.detail || 'Search query failed');
  }

  return await res.json();
}
