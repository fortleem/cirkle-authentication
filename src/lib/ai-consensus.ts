// Circle Brain consensus engine.
// Round 1: query all providers in parallel.
// Round 2: pick the fastest successful provider and ask it to synthesize a
// consensus answer that reconciles the responses. Falls back gracefully.

import { PROVIDERS, SYSTEM_PROMPT, type ProviderResult } from './ai-providers'

export interface ConsensusResult {
  prompt: string
  consensus: string
  consensusModel: string | null
  agreed: boolean
  providers: ProviderResult[]
  successCount: number
  totalCount: number
}

const SYNTHESIS_PROMPT = (question: string, answers: { name: string; model: string; answer: string }[]) =>
  `You are the consensus arbiter for Circle Brain. Different AI models answered the same question.
Reconcile their answers into ONE definitive consensus answer.
- If they agree, state the consensus clearly.
- If they disagree, resolve it using your best judgment and note the resolution briefly.
- Be concise and accurate.
- Output ONLY the final consensus answer (no preamble, no quotes).

Question:
${question}

Model answers:
${answers.map((a, i) => `(${i + 1}) ${a.name} (${a.model}):\n${a.answer}`).join('\n\n')}
`

export async function runConsensus(
  prompt: string,
  perProviderTimeoutMs = 20000,
): Promise<ConsensusResult> {
  // Round 1: query all providers in parallel
  const results = await Promise.all(
    PROVIDERS.map((p) => p.call(prompt, SYSTEM_PROMPT, perProviderTimeoutMs)),
  )

  const successful = results.filter((r): r is ProviderResult & { answer: string } => r.ok && r.answer !== null)
  const successCount = successful.length

  // No providers responded — return a graceful failure as the "consensus"
  if (successCount === 0) {
    return {
      prompt,
      consensus: 'No AI providers were able to respond. Check that the provider API keys are configured and reachable from this environment.',
      consensusModel: null,
      agreed: false,
      providers: results,
      successCount: 0,
      totalCount: PROVIDERS.length,
    }
  }

  // Single responder — that answer IS the consensus (no synthesis needed)
  if (successCount === 1) {
    const only = successful[0]
    return {
      prompt,
      consensus: only.answer,
      consensusModel: `${only.name} · ${only.model}`,
      agreed: false,
      providers: results,
      successCount: 1,
      totalCount: PROVIDERS.length,
    }
  }

  // Round 2: pick the synthesizer (prefer Groq → OpenRouter → HuggingFace → NVIDIA → Gemini
  // for speed/quality). The synthesizer reconciles all successful answers.
  const priority = ['groq', 'openrouter', 'huggingface', 'nvidia', 'gemini']
  const synthesizer =
    priority
      .map((id) => successful.find((r) => r.id === id))
      .find(Boolean) ?? successful[0]

  const synthProvider = PROVIDERS.find((p) => p.id === synthesizer.id)!
  const synthResult = await synthProvider.call(
    SYNTHESIS_PROMPT(prompt, successful.map((r) => ({ name: r.name, model: r.model, answer: r.answer! }))),
    'You are the consensus arbiter of Circle Brain. Output only the final reconciled answer.',
    perProviderTimeoutMs,
  )

  // Replace the synthesizer's round-1 entry with the round-2 synthesis in the
  // returned providers list? No — keep round-1 answers for transparency, but
  // surface the synthesis as the consensus.
  const consensus = synthResult.ok && synthResult.answer
    ? synthResult.answer
    : // Synthesis failed — fall back to the first successful answer
      successful[0].answer

  return {
    prompt,
    consensus,
    consensusModel: `${synthProvider.name} · ${synthProvider.model}`,
    agreed: synthResult.ok,
    providers: results,
    successCount,
    totalCount: PROVIDERS.length,
  }
}

export async function probeProviders(timeoutMs = 8000): Promise<ProviderResult[]> {
  const results = await Promise.all(
    PROVIDERS.map((p) => p.call('Reply with exactly: OK', 'Reply with exactly: OK.', timeoutMs)),
  )
  return results
}
