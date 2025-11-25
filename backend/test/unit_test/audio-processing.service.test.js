import { jest } from '@jest/globals';
import * as s3 from '../../src/services/s3.service.js';
import * as whisper from '../../src/services/whisper.service.js';
import { audioProcessingService } from '../../src/services/audio-processing.service.js';
import { describe, beforeEach, afterAll, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wavPath = path.join(__dirname, 'utils/wav_samples/converted_interview.wav')

const wavSample = fs.readFileSync(wavPath).toString('base64');

describe('audioProcessingService.processAudioResponse', () => {
  let getAudioFileKeySpy;
  let uploadAudioFileSpy;
  let validateAudioFileSpy;
  let transcribeAudioFromBufferSpy;
  let runVoiceAnalysisSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    getAudioFileKeySpy = jest
      .spyOn(s3.s3Service, 'getAudioFileKey')
      .mockReturnValue('mock/s3key.wav');
    uploadAudioFileSpy = jest
      .spyOn(s3.s3Service, 'uploadAudioFile')
      .mockResolvedValue('success');
    validateAudioFileSpy = jest
      .spyOn(whisper.whisperService, 'validateAudioFile')
      .mockReturnValue(true);
    transcribeAudioFromBufferSpy = jest
      .spyOn(whisper.whisperService, 'transcribeAudioFromBuffer')
      .mockResolvedValue('transcript text');
    runVoiceAnalysisSpy = jest
      .spyOn(audioProcessingService, 'runVoiceAnalysis')
      .mockResolvedValue({ scores: { overall_fluency_score: 4 } });
  });

  afterAll(() => {
    // Restore helpers
    if (getAudioFileKeySpy) getAudioFileKeySpy.mockRestore();
    if (uploadAudioFileSpy) uploadAudioFileSpy.mockRestore();
    if (validateAudioFileSpy) validateAudioFileSpy.mockRestore();
    if (transcribeAudioFromBufferSpy) transcribeAudioFromBufferSpy.mockRestore();
    if (runVoiceAnalysisSpy) runVoiceAnalysisSpy.mockRestore();
  });

  it('should process audio and return transcript and a voice analysis payload', async () => {
    const result = await audioProcessingService.processAudioResponse(
      {
        question_id: 'q1',
        audio_data: wavSample,
        audio_mime_type: 'audio/webm',
        elapsed_seconds: 3
      },
      'user1',
      'intvw1'
    );
    
    expect(result.voice_analysis).toBeDefined();
    expect(result.voice_analysis.scores).toBeDefined();
    expect(result.text).toBe('transcript text');
    expect(uploadAudioFileSpy).toHaveBeenCalled();
    expect(transcribeAudioFromBufferSpy).toHaveBeenCalled();
  });

  it('should propagate error if Whisper fails', async () => {
    whisper.whisperService.transcribeAudioFromBuffer.mockRejectedValue(new Error('fail'));
    await expect(audioProcessingService.processAudioResponse({
      question_id: 'q2',
      audio_data: wavSample,
      audio_mime_type: 'audio/webm',
      elapsed_seconds: 1
    }, 'user2', 'intvw2')).rejects.toThrow();
  });

  it('should handle voice analysis CLI failure and return warning analysis', async () => {
    runVoiceAnalysisSpy.mockResolvedValue({ warning: 'Voice analysis failed or unavailable' });
    const result = await audioProcessingService.processAudioResponse(
      {
        question_id: 'q3',
        audio_data: wavSample,
        audio_mime_type: 'audio/webm',
        elapsed_seconds: 1
      },
      'user3',
      'intvw3'
    );
    expect(result.voice_analysis).toBeDefined();
    expect(result.voice_analysis).toHaveProperty('warning');
  });

  it('should throw ApiError if validateAudioFile returns false', async () => {
    whisper.whisperService.validateAudioFile.mockReturnValue(false);
    await expect(
      audioProcessingService.processAudioResponse(
        {
          question_id: 'q4',
          audio_data: wavSample,
          audio_mime_type: 'audio/webm',
          elapsed_seconds: 1
        },
        'user4',
        'intvw4'
      )
    ).rejects.toThrow('Invalid audio file format or size too large (max 25MB)');
  });

  it('should still respond when audio_data is not base64 but mark analysis as warning', async () => {
    runVoiceAnalysisSpy.mockResolvedValue({ warning: 'Voice analysis failed or unavailable' });
    const result = await audioProcessingService.processAudioResponse(
      {
        question_id: 'q5',
        audio_data: 'notbase64!!!###',
        audio_mime_type: 'audio/webm',
        elapsed_seconds: 2
      },
      'user5',
      'intvw5'
    );
    expect(result.voice_analysis).toBeDefined();
    expect(result.voice_analysis.prosody_feedback).toContain('No speech detected');
    expect(result.text).toContain('[No speech detected');
  });
});
