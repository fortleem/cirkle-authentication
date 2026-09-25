// Circle Brain — multi-provider AI mesh with automatic model fallback.
// When a model fails (out of credit, deprecated, rate-limited), the provider
// tries its other models in priority order, then dynamically discovers and
// tries the provider's full model catalog until one works. The working model
// is cached per provider for subsequent calls.

export interface ProviderResult {
  id: string
  name: string
  model: string
  color: string
  ok: boolean
  answer: string | null
  error: string | null
  latencyMs: number
  triedModels?: string[]
}

interface TryResult {
  ok: boolean
  answer: string | null
  error: string | null
  status: number
  body: string
}

export interface Provider {
  id: string
  name: string
  color: string
  call(userPrompt: string, systemPrompt: string, timeoutMs: number): Promise<ProviderResult>
}

const SYSTEM_DEFAULT =
  'You are Circle Brain, the central intelligence of the Cirkle ecosystem. ' +
  'Answer the user concisely and accurately. You are part of a consensus mesh of AI providers.'

// Per-provider working model cache (survives across requests in the process)
const workingModel: Record<string, string> = {}

function timedFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

/** Decide whether an error is model-specific (worth trying another model) vs account/network-level. */
function isModelError(status: number, body: string): boolean {
  const b = (body || '').toLowerCase()
  // Account-level / region errors → do NOT retry other models
  if (b.includes('user location is not supported')) return false
  if (b.includes('function') && b.includes('not found for account')) return false
  if (status === 401 || status === 403) {
    // 403/401 only counts as a model error if the body explicitly blames the model
    return b.includes('model') || b.includes('deprecated')
  }
  // 404 (model not found), 400 (bad/deprecated model), 429 (rate limit per model), 402 (out of credit)
  if (status === 404 || status === 400 || status === 429 || status === 402) return true
  // Body-level signals of credit/quota/model issues
  if (/credit|quota|limit|exhausted|deprecated|no longer available|insufficient|billing|payment/.test(b)) return true
  return false
}

/** Single OpenAI-compatible chat attempt against one model. */
async function tryOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  extraHeaders: Record<string, string> | undefined,
  timeoutMs: number,
): Promise<TryResult> {
  try {
    const res = await timedFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...(extraHeaders ?? {}) },
      body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 800 }),
    }, timeoutMs)
    const body = await res.text().catch(() => '')
    if (!res.ok) return { ok: false, answer: null, error: `HTTP ${res.status}: ${body.slice(0, 120)}`, status: res.status, body }
    const data = body ? JSON.parse(body) : {}
    const answer = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null
    if (!answer) return { ok: false, answer: null, error: 'Empty response', status: res.status, body }
    return { ok: true, answer: String(answer).trim(), error: null, status: res.status, body }
  } catch (e) {
    return { ok: false, answer: null, error: e instanceof Error ? e.message : 'Request failed', status: 0, body: '' }
  }
}

/** Dynamically discover a provider's available chat models via its /models endpoint. */
async function discoverOpenAIModels(listUrl: string, apiKey: string, timeoutMs = 8000): Promise<string[]> {
  try {
    const res = await timedFetch(listUrl, { headers: { Authorization: `Bearer ${apiKey}` } }, timeoutMs)
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    const ids: string[] = (data?.data ?? data?.models ?? []).map((m: { id?: string; name?: string }) => m.id ?? m.name).filter(Boolean)
    // Heuristic: prefer instruct/chat/larger models first
    return ids.sort((a: string, b: string) => scoreModel(b) - scoreModel(a))
  } catch {
    return []
  }
}

function scoreModel(id: string): number {
  const s = id.toLowerCase()
  let score = 0
  if (/70b|70B/.test(id)) score += 5
  if (/instruct|chat|it\b/.test(s)) score += 4
  if (/llama-3|llama3/.test(s)) score += 3
  if (/flash|mini|8b|7b/.test(s)) score += 1
  if (/embed|rerank|vision|guard|moderation|diffusion|whisper|audio|tts|image|code/.test(s)) score -= 5
  return score
}

function makeOpenAICompatibleProvider(opts: {
  id: string
  name: string
  color: string
  models: string[]
  endpoint: string
  apiKey: string | undefined
  listModelsUrl?: string
  extraHeaders?: Record<string, string>
}): Provider {
  return {
    id: opts.id,
    name: opts.name,
    color: opts.color,
    async call(userPrompt, systemPrompt, timeoutMs): Promise<ProviderResult> {
      const start = Date.now()
      if (!opts.apiKey) {
        return { id: opts.id, name: opts.name, model: opts.models[0], color: opts.color, ok: false, answer: null, error: 'No API key configured', latencyMs: 0 }
      }
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]
      const tried: string[] = []
      // Candidate order: cached working model first, then the priority list
      const candidates = [...(workingModel[opts.id] ? [workingModel[opts.id]] : []), ...opts.models]

      for (const model of candidates) {
        if (tried.includes(model)) continue
        tried.push(model)
        const r = await tryOpenAICompatible(opts.endpoint, opts.apiKey, model, messages, opts.extraHeaders, timeoutMs)
        if (r.ok) {
          workingModel[opts.id] = model
          return { id: opts.id, name: opts.name, model, color: opts.color, ok: true, answer: r.answer, error: null, latencyMs: Date.now() - start, triedModels: tried }
        }
        // Non-model error (account/region/network) → don't bother trying other models
        if (!isModelError(r.status, r.body)) {
          return { id: opts.id, name: opts.name, model, color: opts.color, ok: false, answer: null, error: r.error, latencyMs: Date.now() - start, triedModels: tried }
        }
        // Model error → try next model
      }

      // All hardcoded models failed → dynamically discover the provider's catalog
      if (opts.listModelsUrl) {
        const discovered = await discoverOpenAIModels(opts.listModelsUrl, opts.apiKey)
        for (const model of discovered) {
          if (tried.includes(model)) continue
          tried.push(model)
          const r = await tryOpenAICompatible(opts.endpoint, opts.apiKey, model, messages, opts.extraHeaders, timeoutMs)
          if (r.ok) {
            workingModel[opts.id] = model
            return { id: opts.id, name: opts.name, model, color: opts.color, ok: true, answer: r.answer, error: null, latencyMs: Date.now() - start, triedModels: tried }
          }
          if (!isModelError(r.status, r.body)) break
        }
      }

      return { id: opts.id, name: opts.name, model: tried[tried.length - 1] ?? opts.models[0], color: opts.color, ok: false, answer: null, error: 'All models exhausted — provider unavailable', latencyMs: Date.now() - start, triedModels: tried }
    },
  }
}

/** Single Gemini native-API attempt against one model. */
async function tryGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string, timeoutMs: number): Promise<TryResult> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await timedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      }),
    }, timeoutMs)
    const body = await res.text().catch(() => '')
    if (!res.ok) return { ok: false, answer: null, error: `HTTP ${res.status}: ${body.slice(0, 120)}`, status: res.status, body }
    const data = body ? JSON.parse(body) : {}
    const answer = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ?? null
    if (!answer) return { ok: false, answer: null, error: 'Empty response', status: res.status, body }
    return { ok: true, answer: String(answer).trim(), error: null, status: res.status, body }
  } catch (e) {
    return { ok: false, answer: null, error: e instanceof Error ? e.message : 'Request failed', status: 0, body: '' }
  }
}

/** Discover Gemini models that support generateContent. */
async function discoverGeminiModels(apiKey: string, timeoutMs = 8000): Promise<string[]> {
  try {
    const res = await timedFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {}, timeoutMs)
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    const models = (data?.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m: { name?: string }) => (m.name ?? '').replace(/^models\//, ''))
      .filter(Boolean)
    return models.sort((a: string, b: string) => scoreModel(b) - scoreModel(a))
  } catch {
    return []
  }
}

function makeGeminiProvider(opts: { id: string; name: string; color: string; models: string[]; apiKey: string | undefined }): Provider {
  return {
    id: opts.id,
    name: opts.name,
    color: opts.color,
    async call(userPrompt, systemPrompt, timeoutMs): Promise<ProviderResult> {
      const start = Date.now()
      if (!opts.apiKey) {
        return { id: opts.id, name: opts.name, model: opts.models[0], color: opts.color, ok: false, answer: null, error: 'No API key configured', latencyMs: 0 }
      }
      const tried: string[] = []
      const candidates = [...(workingModel[opts.id] ? [workingModel[opts.id]] : []), ...opts.models]

      for (const model of candidates) {
        if (tried.includes(model)) continue
        tried.push(model)
        const r = await tryGemini(opts.apiKey, model, systemPrompt, userPrompt, timeoutMs)
        if (r.ok) {
          workingModel[opts.id] = model
          return { id: opts.id, name: opts.name, model, color: opts.color, ok: true, answer: r.answer, error: null, latencyMs: Date.now() - start, triedModels: tried }
        }
        if (!isModelError(r.status, r.body)) {
          return { id: opts.id, name: opts.name, model, color: opts.color, ok: false, answer: null, error: r.error, latencyMs: Date.now() - start, triedModels: tried }
        }
      }

      // Dynamic discovery for Gemini
      const discovered = await discoverGeminiModels(opts.apiKey)
      for (const model of discovered) {
        if (tried.includes(model)) continue
        tried.push(model)
        const r = await tryGemini(opts.apiKey, model, systemPrompt, userPrompt, timeoutMs)
        if (r.ok) {
          workingModel[opts.id] = model
          return { id: opts.id, name: opts.name, model, color: opts.color, ok: true, answer: r.answer, error: null, latencyMs: Date.now() - start, triedModels: tried }
        }
        if (!isModelError(r.status, r.body)) break
      }

      return { id: opts.id, name: opts.name, model: tried[tried.length - 1] ?? opts.models[0], color: opts.color, ok: false, answer: null, error: 'All Gemini models exhausted', latencyMs: Date.now() - start, triedModels: tried }
    },
  }
}

export const PROVIDERS: Provider[] = [
  makeOpenAICompatibleProvider({
    id: 'groq',
    name: 'Groq',
    color: '#f55036',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768'],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    listModelsUrl: 'https://api.groq.com/openai/v1/models',
  }),
  makeOpenAICompatibleProvider({
    id: 'openrouter',
    name: 'OpenRouter',
    color: '#8b5cf6',
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY,
    listModelsUrl: 'https://openrouter.ai/api/v1/models',
    extraHeaders: { 'HTTP-Referer': 'https://cirkle-authentication.app', 'X-Title': 'Cirkle Circle Brain' },
  }),
  makeOpenAICompatibleProvider({
    id: 'nvidia',
    name: 'NVIDIA NIM',
    color: '#76b900',
    models: [
      'mistralai/mistral-7b-instruct-v0.3',
      'meta/llama-3.3-70b-instruct',
      'meta/llama-3.1-70b-instruct',
      'google/gemma-3-12b-it',
      'microsoft/phi-3.5-moe-instruct',
      'z-ai/glm-5.3-flash',
    ],
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    apiKey: process.env.NVIDIA_API_KEY,
    listModelsUrl: 'https://integrate.api.nvidia.com/v1/models',
  }),
  makeGeminiProvider({
    id: 'gemini',
    name: 'Gemini',
    color: '#1da1f2',
    models: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'],
    apiKey: process.env.GEMINI_API_KEY,
  }),
  makeOpenAICompatibleProvider({
    id: 'huggingface',
    name: 'HuggingFace',
    color: '#ffb000',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct',
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'meta-llama/Meta-Llama-3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'HuggingFaceH4/zephyr-7b-beta',
    ],
    endpoint: 'https://router.huggingface.co/v1/chat/completions',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    listModelsUrl: 'https://router.huggingface.co/v1/models',
  }),
]

export const SYSTEM_PROMPT = SYSTEM_DEFAULT

/** Reset the working-model cache (useful for the health/probe flow). */
export function resetModelCache() {
  for (const k of Object.keys(workingModel)) delete workingModel[k]
}
