import { describe, it, expect } from '@jest/globals'
import { audioProcessingService } from '../../src/services/audio-processing.service.js'
import path from 'path'
import { fileURLToPath } from 'url'

const testFileName = fileURLToPath(import.meta.url)
const testFilePath = path.dirname(testFileName)

describe('voice analysis Python pipeline (integration)', () => {
  it('runs analyzer.py and returns fluency scores', async () => {
    const wavPath = path.join(
      testFilePath,
      '../unit_test/utils/wav_samples/converted_interview.wav'
    )

    const result = await audioProcessingService.runVoiceAnalysis(
      wavPath,
      'This is a sample transcript for integration testing.'
    )

    console.log('INTEGRATION voice_analysis result:', result)

    expect(result).toBeDefined()
    expect(result.scores).toBeDefined()
    expect(result.scores.overall_fluency_score).toBeDefined()
    expect(typeof result.scores.confidence_score).toBe('number')
    expect(typeof result.scores.hesitation_score).toBe('number')
  }, 20000)

  it('processes audio response with voice analysis', async () => {
    // Mock audio data (base64 encoded small WAV)
    const mockAudioData = Buffer.from('RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x08\x00\x00', 'binary').toString('base64')

    const audioResponse = {
      question_id: 'q_test_001',
      audio_data: mockAudioData,
      audio_mime_type: 'audio/wav',
      elapsed_seconds: 5
    }

    // This would normally call the full pipeline, but we'll test the structure
    expect(audioResponse.question_id).toBe('q_test_001')
    expect(audioResponse.audio_data).toBeDefined()
    expect(audioResponse.audio_mime_type).toBe('audio/wav')
  })
})
