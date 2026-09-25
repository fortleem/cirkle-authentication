// Circle Brain — multi-provider AI mesh.
// Each provider is an adapter so the consensus engine can query them uniformly.

export interface ProviderResult {
  id: string
  name: string
  model: string
  color: string
  ok: boolean
  answer: string | null
  error: string | null
  latencyMs: number
}

export interface Provider {
  id: string
  name: string
  model: string
  color: string
  call(userPrompt: string, systemPrompt: string, timeoutMs: number): Promise<ProviderResult>
}

const SYSTEM_DEFAULT =
  'You are Circle Brain, the central intelligence of the Cirkle ecosystem. ' +
  'Answer the user concisely and accurately. You are part of a consensus mesh of AI providers.'

function timedFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

/** Shared helper for OpenAI-compatible providers (Groq, OpenRouter, NVIDIA, HuggingFace). */
function makeOpenAICompatibleProvider(opts: {
  id: string
  name: string
  model: string
  color: string
  endpoint: string
  apiKey: string | undefined
  extraHeaders?: Record<string, string>
}): Provider {
  return {
    id: opts.id,
    name: opts.name,
    model: opts.model,
    color: opts.color,
    async call(userPrompt, systemPrompt, timeoutMs): Promise<ProviderResult> {
      const start = Date.now()
      if (!opts.apiKey) {
        return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: 'No API key configured', latencyMs: 0 }
      }
      try {
        const res = await timedFetch(opts.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
            ...(opts.extraHeaders ?? {}),
          },
          body: JSON.stringify({
            model: opts.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 800,
          }),
        }, timeoutMs)
        const latencyMs = Date.now() - start
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: `HTTP ${res.status}: ${txt.slice(0, 120)}`, latencyMs }
        }
        const data = await res.json()
        const answer = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null
        if (!answer) {
          return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: 'Empty response', latencyMs }
        }
        return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: true, answer: String(answer).trim(), error: null, latencyMs }
      } catch (e) {
        return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: e instanceof Error ? e.message : 'Request failed', latencyMs: Date.now() - start }
      }
    },
  }
}

/** Gemini adapter — uses the native generateContent API with ?key= query param. */
function makeGeminiProvider(opts: { id: string; name: string; model: string; color: string; apiKey: string | undefined }): Provider {
  return {
    id: opts.id,
    name: opts.name,
    model: opts.model,
    color: opts.color,
    async call(userPrompt, systemPrompt, timeoutMs): Promise<ProviderResult> {
      const start = Date.now()
      if (!opts.apiKey) {
        return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: 'No API key configured', latencyMs: 0 }
      }
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${encodeURIComponent(opts.apiKey)}`
        const res = await timedFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
          }),
        }, timeoutMs)
        const latencyMs = Date.now() - start
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: `HTTP ${res.status}: ${txt.slice(0, 120)}`, latencyMs }
        }
        const data = await res.json()
        const answer = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ?? null
        if (!answer) {
          return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: 'Empty response', latencyMs }
        }
        return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: true, answer: String(answer).trim(), error: null, latencyMs }
      } catch (e) {
        return { id: opts.id, name: opts.name, model: opts.model, color: opts.color, ok: false, answer: null, error: e instanceof Error ? e.message : 'Request failed', latencyMs: Date.now() - start }
      }
    },
  }
}

export const PROVIDERS: Provider[] = [
  makeOpenAICompatibleProvider({
    id: 'groq',
    name: 'Groq',
    model: 'llama-3.3-70b-versatile',
    color: '#f55036',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
  }),
  makeOpenAICompatibleProvider({
    id: 'openrouter',
    name: 'OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    color: '#8b5cf6',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY,
    extraHeaders: {
      'HTTP-Referer': 'https://cirkle-authentication.app',
      'X-Title': 'Cirkle Circle Brain',
    },
  }),
  makeOpenAICompatibleProvider({
    id: 'nvidia',
    name: 'NVIDIA NIM',
    model: 'mistralai/mistral-7b-instruct-v0.3',
    color: '#76b900',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    apiKey: process.env.NVIDIA_API_KEY,
  }),
  makeGeminiProvider({
    id: 'gemini',
    name: 'Gemini',
    model: 'gemini-3.8-flash',
    color: '#1da1f2',
    apiKey: process.env.GEMINI_API_KEY,
  }),
  makeOpenAICompatibleProvider({
    id: 'huggingface',
    name: 'HuggingFace',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    color: '#ffb000',
    endpoint: 'https://router.huggingface.co/v1/chat/completions',
    apiKey: process.env.HUGGINGFACE_API_KEY,
  }),
]

export const SYSTEM_PROMPT = SYSTEM_DEFAULT
