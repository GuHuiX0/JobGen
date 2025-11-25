import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GPTService } from '../../src/services/gpt.service.js'
import { ApiError } from '../../src/types/index.js'

describe('GPTService', () => {
  let service

beforeEach(() => {
  service = new GPTService()
  jest.clearAllMocks()
})

afterEach(() => {
  jest.restoreAllMocks()
})

  describe('createFeedbackPrompt', () => {
    it('embeds behavioral and voice-specific guidance when needed', () => {
      const prompt = service.createFeedbackPrompt(
        {
          type: 'behavioral',
          text: 'Tell me about a time you resolved a production incident.'
        },
        {
          question_id: 'q1',
          input_mode: 'voice',
          elapsed_seconds: 90,
          transcript: 'I took ownership and coordinated the fix.',
          voice_analysis: {
            pauses: { total_pause_count: 3, total_pause_duration: 4.5 },
            speech_rate: { words_per_minute: 120 },
            scores: { confidence_score: 4.2, hesitation_score: 1.1 },
            prosody: { rms_std: 0.42, pitch_std_hz: 220 }
          }
        }
      )

      expect(prompt).toContain('Voice Analysis Data')
      expect(prompt).toContain('"voice_analysis":')
      expect(prompt).toContain('Special Focus for Behavioral Questions')
      expect(prompt).toContain('Special Considerations for Voice Responses')
    })
  })

  describe('parseFeedbackResult', () => {
    it('normalises scores and filters noisy payloads', () => {
      const payload = JSON.stringify({
        star: {
          score: 1.7,
          breakdown: { s: -1, t: 0.5, a: 2, r: 0.3 },
          tips: [' Tighten closing metric ', 42]
        },
        good_answer: '  Example response  ',
        analysis: {
          clarity: { score: 3, comment: '  too vague ' },
          example: { score: 'NaN', comment: 'Add metric' },
          keywords: { score: 0.8, comment: 'ok' },
          pauses: { assessment: '  long  ', severity: ' high ' },
          confidence: { score: 0.1, comment: 'solid tone' }
        },
        missing_points: ['  impact  ', 5],
        improvements: ['Add customer impact', '', null],
        keyword_frequency: [
          { keyword: 'leadership', count: '2' },
          { term: 'impact', count: 'NaN' }
        ],
        filler_words: { count: -3, top: ['um', 4] },
        confidence: { score: 4, prosody: -1, fluency: 2 },
        keywords: { matched: ['deployment'], missing: ['stakeholder'] },
        voice_analysis: {
          fluency_score: 2.5,
          pause_analysis: '  good control ',
          speech_rate_assessment: 'balanced',
          prosody_feedback: ''
        }
      })

      const result = service.parseFeedbackResult(payload)

      expect(result.star.score).toBe(1)
      expect(result.star.breakdown.s).toBe(0)
      expect(result.star.breakdown.t).toBe(0.5)
      expect(result.star.breakdown.a).toBe(1)
      expect(result.good_answer).toBe('Example response')
      expect(result.analysis.clarity.score).toBe(1)
      expect(result.analysis.clarity.comment).toBe('too vague')
      expect(result.keyword_frequency).toEqual([
        { keyword: 'leadership', count: 2 },
        { keyword: 'impact', count: 0 }
      ])
      expect(result.filler_words.count).toBe(0)
      expect(result.confidence.prosody).toBe(0)
      expect(result.voice_analysis?.fluency_score).toBe(1)
      expect(result.missing_points).toEqual(['impact'])
      expect(result.improvements).toEqual(['Add customer impact'])
    })

    it('returns a safe fallback structure when parsing fails', () => {
      const result = service.parseFeedbackResult('not json at all')

      expect(result.star.score).toBe(0.5)
      expect(result.analysis.clarity.comment).toContain('Clarify the Situation')
      expect(result.good_answer.length).toBeGreaterThan(0)
    })
  })

  describe('parseQuestionHintResult', () => {
    it('truncates hints that exceed the 15 word limit', () => {
      const longHint = {
        hint: 'use concrete metrics to show initiative and describe the specific stakeholders impacted by your action plan'
      }
      const raw = `\`\`\`json
${JSON.stringify(longHint)}
\`\`\``

      const trimmed = service.parseQuestionHintResult(raw, { category: 'Leadership' }, 'Need help')
      expect(trimmed.split(' ').length).toBeLessThanOrEqual(15)
      expect(trimmed).toContain('metrics')
    })

    it('returns a contextual fallback when hint payload is invalid', () => {
      const fallback = service.parseQuestionHintResult('::::', { category: 'Risk' }, 'escalations')
      expect(fallback).toContain('escalations')
    })
  })

  describe('extractJsonPayload', () => {
    it('extracts JSON between fenced code blocks', () => {
      const payload = service.extractJsonPayload('Random preface ```json { "hint": "focus" } ``` trailing text')
      expect(payload).toBe('{ "hint": "focus" }')
    })
  })

  describe('parseQuestionResult', () => {
    it('falls back to default behavioral questions when payload is invalid', () => {
      const defaults = service.parseQuestionResult('not-json')
      expect(defaults).toHaveLength(5)
      expect(defaults[0].type).toBe('behavioral')
    })
  })

  describe('generateQuestionHint', () => {
    it('returns the parsed hint from GPT output', async () => {
      jest.spyOn(service, 'callGPT').mockResolvedValue(
        JSON.stringify({ hint: 'Highlight customer impact within 10 seconds.' })
      )

      const hint = await service.generateQuestionHint({ text: 'Tell me about a launch.' }, 'impact')
      expect(hint).toBe('Highlight customer impact within 10 seconds.')
    })

    it('wraps GPT failures in an ApiError', async () => {
      jest.spyOn(service, 'callGPT').mockRejectedValue(new Error('downstream'))

      await expect(
        service.generateQuestionHint({ text: 'Tell me about a risk.' }, 'Need guidance')
      ).rejects.toBeInstanceOf(ApiError)
    })
  })
})

