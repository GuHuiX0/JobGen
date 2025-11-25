import OpenAI from 'openai'
import { config } from '../config/index.js'
import { ApiError } from '../types/index.js'

export class GPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    })
  }

  /**
   * Generate feedback for interview responses
   */
  async generateFeedback(questions, responses) {
    try {
      const feedbackPrompts = questions.map((question, _index) => {
        const response = responses.find((r) => r.question_id === question.question_id)
        if (!response) {
          throw new Error(`No response found for question ${question.question_id}`)
        }

        return this.createFeedbackPrompt(question, response)
      })

      const feedbackResults = await Promise.all(
        feedbackPrompts.map((prompt) => this.callGPT(prompt))
      )

      return feedbackResults.map((result, index) => {
        const response = responses[index]
        const question = questions[index]

        console.log(`🎯 Processing feedback for ${response.question_id}: input_mode=${response.input_mode}, has_transcript=${!!response.transcript}, text_length=${response.text?.length || 0}`);

        // For voice responses, use transcript as the answer text
        // If transcript is '[Response processing failed]', use it directly
        const answerText = response.input_mode === 'voice'
          ? (response.transcript || '[Response processing failed]')
          : (response.text || '[Response processing failed]')

        console.log(`📝 Final answer for ${response.question_id}: "${answerText.substring(0, 100)}..."`);

        return {
          question_id: response.question_id,
          question: question.text,
          answer: answerText,
          input_mode: response.input_mode || 'text',
          feedback: this.parseFeedbackResult(result)
        }
      })
    } catch (error) {
      throw new ApiError({
        message: 'Failed to generate feedback using GPT',
        code: 'GPT_FEEDBACK_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }

  /**
   * Generate dashboard insights for readiness trend
   */
  async generateReadinessTrendInsights(points) {
    try {
      const prompt = `
You are a professional interview coach. Based on the user's readiness trend data, provide a concise summary and improvement recommendations.

Data:
${JSON.stringify(points, null, 2)}

Return in JSON format:
{
  "summary": "Concise trend summary (1-2 sentences)",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Requirements:
1. Analyze score change trends
2. Identify key improvement areas
3. Provide specific actionable recommendations
4. Use concise and professional language
`

      const result = await this.callGPT(prompt)
      return JSON.parse(result)
    } catch (error) {
      throw new ApiError({
        message: 'Failed to generate readiness trend insights',
        code: 'GPT_INSIGHTS_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }

  /**
   * Generate dashboard insights for type radar
   */
  async generateTypeRadarInsights(scores) {
    try {
      const prompt = `
You are a professional interview coach. Based on the user's performance scores across different interview types, provide detailed analysis.

Scores:
- Behavioral interviews: ${scores.behavioral}/100
- Technical interviews: ${scores.technical}/100  
- Psychometric assessments: ${scores.psychometric}/100

Return in JSON format:
{
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Area for improvement 1", "Area for improvement 2"],
  "suggested_focus": ["Specific recommendation 1", "Specific recommendation 2"]
}

Requirements:
1. Analyze strengths and weaknesses based on scores
2. Provide targeted improvement recommendations
3. Recommendations should be specific and actionable
4. Use professional and concise language
`

      const result = await this.callGPT(prompt)
      return JSON.parse(result)
    } catch (error) {
      throw new ApiError({
        message: 'Failed to generate type radar insights',
        code: 'GPT_INSIGHTS_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }

  /**
   * Create feedback prompt for a specific question-response pair
   */
  createFeedbackPrompt(question, response) {
    const isBehavioral = question.type === 'behavioral'
    const isVoiceResponse = response.input_mode === 'voice'
    const hasVoiceAnalysis = response.voice_analysis
    const answerText =
      response.input_mode === 'voice'
        ? response.transcript || response.text || '[Response processing failed]'
        : response.text || response.transcript || '[Response processing failed]'

    let prompt = `
You are a professional interview coach. Please analyze the following interview response and provide detailed feedback.

Question Type: ${question.type}
Question: ${question.text}
Response: ${answerText}
Response Time: ${response.elapsed_seconds} seconds
Input Mode: ${response.input_mode || 'text'}
`

    // Add voice analysis data if available
    if (isVoiceResponse && hasVoiceAnalysis) {
      const va = response.voice_analysis
      prompt += `

Voice Analysis Data:
- Pauses: ${va.pauses?.total_pause_count || 0} total pauses, ${va.pauses?.total_pause_duration?.toFixed(1) || 0}s total duration
- Speech Rate: ${va.speech_rate?.words_per_minute || 0} words per minute
- Fluency Scores: Confidence ${va.scores?.confidence_score?.toFixed(1) || 0}/5, Hesitation ${va.scores?.hesitation_score?.toFixed(1) || 0}/5
- Prosody: Energy variation ${va.prosody?.rms_std?.toFixed(3) || 0}, Pitch variation ${va.prosody?.pitch_std_hz?.toFixed(0) || 0}Hz
`
    }

    prompt += `
Return analysis results in JSON format:
{
  "star": {
    "score": 0.85,
    "breakdown": {
      "s": 0.9,
      "t": 0.8,
      "a": 0.85,
      "r": 0.85
    },
    "tips": ["Improvement suggestion 1", "Improvement suggestion 2"]
  },
  "good_answer": "Deliver a concise 4-5 sentence improved answer that models the perfect STAR response for this situation.",
  "analysis": {
    "clarity": {
      "score": 0.9,
      "comment": "Explain how clearly the storyline flowed."
    },
    "example": {
      "score": 0.82,
      "comment": "Highlight whether the STAR example had metrics."
    },
    "keywords": {
      "score": 0.75,
      "comment": "Call out the presence or absence of domain keywords."
    },
    "pauses": {
      "assessment": "Describe filler words, pauses, or hesitations.",
      "severity": "low | medium | high"
    },
    "confidence": {
      "score": 0.8,
      "comment": "Tone, conviction, and closing energy."
    }
  },
  "missing_points": ["Point the candidate failed to mention"],
  "improvements": ["Actionable improvement 1", "Actionable improvement 2"],
  "keyword_frequency": [
    {"keyword": "leadership", "count": 2},
    {"keyword": "stakeholder", "count": 1}
  ],
  "keywords": {
    "matched": ["Matched keyword 1", "Matched keyword 2"],
    "missing": ["Missing keyword 1", "Missing keyword 2"]
  },
  "filler_words": {
    "count": 5,
    "top": ["um", "like"]
  },
  "confidence": {
    "score": 0.8,
    "prosody": 0.75,
    "fluency": 0.85
  }
`

    // Add voice analysis section for voice responses
    if (isVoiceResponse) {
      prompt += `,
  "voice_analysis": {
    "fluency_score": 0.8,
    "pause_analysis": "Analysis of pause patterns",
    "speech_rate_assessment": "Assessment of speaking pace",
    "prosody_feedback": "Analysis of voice modulation and energy"
  }
`
    }

    prompt += `}
Scoring Criteria:
- STAR scoring: Completeness of Situation(S), Task(T), Action(A), Result(R)
- Keywords: Match relevant professional vocabulary based on question type
- Filler words: Count frequency of words like "um", "like", etc.
- Confidence: Fluency and logical flow of the response
- Good Answer: Provide an aspirational example the candidate can imitate
- Analysis dimensions: clarity, example quality, keyword usage, pauses/fillers, confidence
- Missing points: Mention concrete facts or numbers that were absent
- Improvements: Provide actionable, interview-specific coaching
- Keyword frequency: Highlight the most relevant terms the candidate actually used
`

    if (isVoiceResponse) {
      prompt += `
- Voice Analysis: For voice responses, incorporate speech patterns, fluency, and delivery quality
- Pause patterns: Analyze if pauses are natural thinking breaks or hesitation indicators
- Speech rate: Assess if pace is appropriate for professional communication
- Prosody: Evaluate voice modulation, energy, and engagement level
`
    }

    prompt += `
Requirements:
1. Score range 0-1
2. Provide specific improvement suggestions
3. Analysis should be objective and professional
4. Use clear and concise language
5. good_answer must be in the same language as the provided response and stay under 5 sentences
6. missing_points and improvements should each contain 2-3 short items
7. When the response is weak or incomplete, explicitly mention that in the analysis and good_answer
`

    if (isBehavioral) {
      prompt += `
Special Focus for Behavioral Questions:
- STAR structure completeness
- Specific examples and quantified results
- Personal reflection and learning
`
    }

    if (isVoiceResponse) {
      prompt += `
Special Considerations for Voice Responses:
- Consider that this was spoken delivery, not written
- Account for natural speech patterns and filler words
- Evaluate communication clarity in spoken form
- Assess professional presentation skills
`
    }

    return prompt
  }

  /**
   * Parse GPT feedback result
   */
  parseFeedbackResult(result) {
    try {
      const parsed = JSON.parse(result)
      const clamp01 = (value) => {
        const num = Number(value)
        if (!Number.isFinite(num)) return 0
        return Math.max(0, Math.min(1, num))
      }
      const textOrEmpty = (value) => (typeof value === 'string' ? value.trim() : '')
      const parseScoreComment = (section) => ({
        score: clamp01(section?.score ?? 0),
        comment: textOrEmpty(section?.comment)
      })
      const toStringArray = (arr) =>
        Array.isArray(arr) ? arr.map((item) => textOrEmpty(item)).filter((item) => item.length > 0) : []

      const analysis = parsed.analysis || {}
      const keywordFrequency = Array.isArray(parsed.keyword_frequency)
        ? parsed.keyword_frequency
            .map((freq) => ({
              keyword: textOrEmpty(freq?.keyword || freq?.term),
              count: Number(freq?.count) || 0
            }))
            .filter((freq) => freq.keyword)
        : []

      return {
        star: {
          score: clamp01(parsed.star?.score || 0),
          breakdown: {
            s: clamp01(parsed.star?.breakdown?.s || 0),
            t: clamp01(parsed.star?.breakdown?.t || 0),
            a: clamp01(parsed.star?.breakdown?.a || 0),
            r: clamp01(parsed.star?.breakdown?.r || 0)
          },
          tips: Array.isArray(parsed.star?.tips) ? parsed.star.tips : []
        },
        good_answer: textOrEmpty(parsed.good_answer),
        analysis: {
          clarity: parseScoreComment(analysis.clarity || {}),
          example: parseScoreComment(analysis.example || {}),
          keywords: parseScoreComment(analysis.keywords || {}),
          pauses: {
            assessment: textOrEmpty(analysis.pauses?.assessment),
            severity: textOrEmpty(analysis.pauses?.severity)
          },
          confidence: parseScoreComment(analysis.confidence || {})
        },
        missing_points: toStringArray(parsed.missing_points),
        improvements: toStringArray(parsed.improvements),
        keyword_frequency: keywordFrequency,
        keywords: {
          matched: Array.isArray(parsed.keywords?.matched) ? parsed.keywords.matched : [],
          missing: Array.isArray(parsed.keywords?.missing) ? parsed.keywords.missing : []
        },
        filler_words: {
          count: Math.max(0, parsed.filler_words?.count || 0),
          top: Array.isArray(parsed.filler_words?.top) ? parsed.filler_words.top : []
        },
        confidence: {
          score: clamp01(parsed.confidence?.score || analysis.confidence?.score || 0),
          prosody: clamp01(parsed.confidence?.prosody || 0),
          fluency: clamp01(parsed.confidence?.fluency || 0)
        },
        voice_analysis: parsed.voice_analysis
          ? {
              fluency_score: clamp01(parsed.voice_analysis.fluency_score || 0),
              pause_analysis: parsed.voice_analysis.pause_analysis || '',
              speech_rate_assessment: parsed.voice_analysis.speech_rate_assessment || '',
              prosody_feedback: parsed.voice_analysis.prosody_feedback || ''
            }
          : null
      }
    } catch (error) {
      // Fallback to default structure if parsing fails
      return {
        star: {
          score: 0.5,
          breakdown: { s: 0.5, t: 0.5, a: 0.5, r: 0.5 },
          tips: ['Response needs to be more specific']
        },
        good_answer: 'Consider framing a clearer STAR response that highlights metrics and your contribution.',
        analysis: {
          clarity: { score: 0.5, comment: 'Clarify the Situation and Task before diving into actions.' },
          example: { score: 0.5, comment: 'Add concrete examples or metrics to strengthen credibility.' },
          keywords: { score: 0.5, comment: 'Reference relevant competencies or industry terms.' },
          pauses: { assessment: '', severity: 'medium' },
          confidence: { score: 0.5, comment: 'Deliver the ending with more conviction.' }
        },
        missing_points: [],
        improvements: ['Provide more detail for each STAR phase.'],
        keyword_frequency: [],
        keywords: {
          matched: [],
          missing: ['Relevant professional vocabulary']
        },
        filler_words: {
          count: 0,
          top: []
        },
        confidence: {
          score: 0.5,
          prosody: 0.5,
          fluency: 0.5
        },
        voice_analysis: null
      }
    }
  }

  /**
   * Create a meaningful interview-level summary
   */
  async generateFeedbackSummary(feedbackItems) {
    try {
      const condensed = feedbackItems.map((item) => ({
        question: item.question,
        score: Math.round((item.feedback?.star?.score || 0) * 100),
        clarity_comment: item.feedback?.analysis?.clarity?.comment || '',
        keyword_comment: item.feedback?.analysis?.keywords?.comment || '',
        improvements: item.feedback?.improvements || [],
        missing_points: item.feedback?.missing_points || [],
        input_mode: item.input_mode || 'text'
      }))

      const prompt = `
You are an elite interview coach. Create an overall summary for a mock interview based on the structured evaluations below.

Data:
${JSON.stringify(condensed, null, 2)}

Return JSON:
{
  "strengths": ["Strength 1", "Strength 2"],
  "needs_improvement": ["Need 1", "Need 2"],
  "next_steps": "1-2 sentences with actionable guidance"
}

Requirements:
1. Use a professional yet encouraging tone.
2. Each strengths / needs_improvement entry must be a single sentence referencing a concrete observation.
3. next_steps should give 2-3 concise, actionable recommendations.
4. Respond in English only, keeping the language concise and specific.
`

      const result = await this.callGPT(prompt)
      const parsed = JSON.parse(result)
      return {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        needs_improvement: Array.isArray(parsed.needs_improvement) ? parsed.needs_improvement : [],
        next_steps: typeof parsed.next_steps === 'string' ? parsed.next_steps.trim() : ''
      }
    } catch (error) {
      console.error('Failed to generate interview summary:', error)
      return {
        strengths: [],
        needs_improvement: [],
        next_steps: ''
      }
    }
  }

  /**
   * Generate customized questions based on user profile and question type
   */
  async generateQuestions(questionType, userProfile, questionCount = 5) {
    try {
      const prompt = this.createQuestionPrompt(questionType, userProfile, questionCount)
      const result = await this.callGPT(prompt)

      const questions = this.parseQuestionResult(result)

      // Validate that we have the right number of questions
      if (questions.length !== questionCount) {
        console.warn(`Expected ${questionCount} questions, got ${questions.length}`)
      }

      return questions.slice(0, questionCount) // Ensure we don't exceed requested count
    } catch (error) {
      throw new ApiError({
        message: 'Failed to generate questions using GPT',
        code: 'QUESTION_GENERATION_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }

  /**
   * Generate a concise hint for a specific interview question
   */
  async generateQuestionHint(question, userPrompt) {
    try {
      const prompt = this.createQuestionHintPrompt(question, userPrompt)
      const result = await this.callGPT(prompt)
      return this.parseQuestionHintResult(result, question, userPrompt)
    } catch (error) {
      throw new ApiError({
        message: 'Failed to generate question hint using GPT',
        code: 'QUESTION_HINT_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }

  /**
   * Create prompt for question generation based on user profile
   */
  createQuestionPrompt(questionType, userProfile, questionCount) {
    const { personal_info, work_preferences, skills, education, experience } = userProfile

    // Parse JSON strings from JobGen API
    let personalInfo = {}
    let workPrefs = {}
    let userSkillsArray = []
    let educationArray = []
    let experienceArray = []

    try {
      personalInfo = typeof personal_info === 'string' ? JSON.parse(personal_info) : (personal_info || {})
      workPrefs = typeof work_preferences === 'string' ? JSON.parse(work_preferences) : (work_preferences || {})
      userSkillsArray = typeof skills === 'string' ? JSON.parse(skills) : (skills || [])
      educationArray = typeof education === 'string' ? JSON.parse(education) : (education || [])
      experienceArray = typeof experience === 'string' ? JSON.parse(experience) : (experience || [])
    } catch (error) {
      console.warn('Failed to parse user profile data:', error.message)
    }

    // Extract relevant information for context
    const jobTitle = workPrefs?.job_title || 'Professional'
    const industry = workPrefs?.industry || 'General'
    const workingType = workPrefs?.preferred_working_type || 'Full-time'
    const userSkills = userSkillsArray
      ?.filter(skill => skill.name && skill.name.trim())
      ?.map(skill => `${skill.name} (${skill.years_of_experience || 'N/A'} years)`)
      ?.join(', ') || 'General skills'
    const firstName = personalInfo?.first_name || 'Candidate'

    let prompt = `
You are a professional interviewer. Generate ${questionCount} ${questionType} interview questions for candidate ${firstName}.

Candidate Information:
- Target Position: ${jobTitle}
- Industry: ${industry}
- Work Type: ${workingType}
- Skills: ${userSkills}
`

    // Add education context if available
    if (educationArray && educationArray.length > 0) {
      const educationInfo = educationArray.map(edu =>
        `${edu.degree || 'Degree'} from ${edu.institute || edu.institution || 'Institution'}`
      ).join(', ')
      prompt += `- Education: ${educationInfo}\n`
    }

    // Add experience context if available
    if (experienceArray && experienceArray.length > 0) {
      const experienceInfo = experienceArray.map(exp =>
        `${exp.title || exp.job_title || 'Position'} at ${exp.company_name || exp.company || 'Company'}`
      ).join(', ')
      prompt += `- Work Experience: ${experienceInfo}\n`
    }

    // Type-specific instructions
    switch (questionType) {
      case 'behavioral':
        prompt += `
Generate ${questionCount} behavioral interview questions with these requirements:
1. Questions should be tailored to the candidate's background and target position
2. Encourage STAR method responses (Situation, Task, Action, Result)
3. Cover core competencies like leadership, teamwork, problem-solving, adaptability
4. Questions should be specific and relevant
`
        break

      case 'technical':
        prompt += `
Generate ${questionCount} technical interview questions with these requirements:
1. Based on candidate's skills and target position
2. Cover theoretical knowledge and practical application
3. Include problem-solving and system design thinking
4. Moderate difficulty with both basic and advanced concepts
`
        break

      case 'psychometric':
        prompt += `
Generate ${questionCount} psychometric assessment questions with these requirements:
1. Assess candidate's personality traits and work style
2. Understand values and motivations
3. Evaluate performance under pressure
4. Questions should be open-ended with no standard answers
`
        break

      default:
        prompt += `
Generate ${questionCount} general interview questions with these requirements:
1. Suitable for candidate's background and position
2. Cover professional abilities and soft skills
3. Questions should be targeted
4. Encourage detailed responses
`
    }

    prompt += `
Return the questions in JSON format:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question content",
      "type": "${questionType}",
      "category": "Question category",
      "difficulty": "easy|medium|hard",
      "expected_duration": 120
    }
  ]
}

Requirements:
1. Each question must have a unique ID
2. Questions should be clear and specific
3. Categories should be accurate
4. Expected response time should be 60-180 seconds
5. Questions should have progressive difficulty
`

    return prompt
  }

  /**
   * Create prompt for question hint generation
   */
  createQuestionHintPrompt(question, userPrompt) {
    const baseQuestionText = question?.text || question?.question_text || 'Question text not available'
    const questionType = question?.type || question?.question_type || 'general'
    const category = question?.category || 'General'
    const difficulty = question?.difficulty || 'medium'

    return `
You are a helpful interview coach providing concise hints.

Interview Question Type: ${questionType}
Question Category: ${category}
Difficulty: ${difficulty}
Question: ${baseQuestionText}

Candidate Prompt/Request: ${userPrompt || ''}

Provide a single short hint in JSON format:
{
  "hint": "..."
}

Requirements:
1. Hint must be actionable and relevant.
2. Use no more than 12 words (target ~10 words).
3. Do not reveal the full answer; only give a nudge.
4. Use professional, encouraging tone.
`
  }

  /**
   * Parse hint result from GPT response
   */
  parseQuestionHintResult(result, question, userPrompt) {
    try {
      const payload = this.extractJsonPayload(result)
      const parsed = JSON.parse(payload)
      const hint = typeof parsed?.hint === 'string' ? parsed.hint.trim() : ''

      if (!hint) {
        throw new Error('Missing hint in response')
      }

      const wordCount = hint.split(/\s+/).filter(Boolean).length

      if (wordCount > 15) {
        return hint
          .split(/\s+/)
          .slice(0, 15)
          .join(' ')
          .trim()
      }

      return hint
    } catch (error) {
      console.warn('Failed to parse question hint result, using fallback:', {
        error: error instanceof Error ? error.message : error,
        raw: result
      })

      const baseHint = 'Highlight your concrete actions and measurable results.'
      if (userPrompt && typeof userPrompt === 'string' && userPrompt.trim().length > 0) {
        return `${baseHint} Relate it to "${userPrompt.trim()}".`
      }

      const questionTopic =
        question?.category || question?.question_type || question?.type || 'the scenario'
      return `${baseHint} Tie the story back to ${questionTopic.toLowerCase()}.`
    }
  }

  extractJsonPayload(rawContent = '') {
    const content = rawContent.trim()
    if (!content) {
      throw new Error('Empty response content')
    }

    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch && fenceMatch[1]) {
      return fenceMatch[1].trim()
    }

    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return content.slice(firstBrace, lastBrace + 1)
    }

    return content
  }

  /**
   * Parse GPT question generation result
   */
  parseQuestionResult(result) {
    try {
      const parsed = JSON.parse(result)

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid question format: missing questions array')
      }

      return parsed.questions.map((question, index) => ({
        id: question.id || `q${index + 1}`,
        text: question.text || 'Question text not available',
        type: question.type || 'general',
        category: question.category || 'General',
        difficulty: question.difficulty || 'medium',
        expected_duration: Math.max(60, Math.min(180, question.expected_duration || 120))
      }))
    } catch (error) {
      console.error('Failed to parse question result:', error)

      // Fallback to default questions if parsing fails
      return this.getDefaultQuestions('general', 5)
    }
  }

  /**
   * Get default questions as fallback
   */
  getDefaultQuestions(questionType, questionCount) {
    const defaultQuestions = {
      behavioral: [
        {
          id: 'default_b1',
          text: 'Describe a time when you faced a significant challenge at work. How did you resolve it?',
          type: 'behavioral',
          category: 'Problem Solving',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_b2',
          text: 'Tell me about a time when you had to collaborate with team members to complete a project.',
          type: 'behavioral',
          category: 'Teamwork',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_b3',
          text: 'Describe a situation where you had to complete a task under a tight deadline.',
          type: 'behavioral',
          category: 'Time Management',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_b4',
          text: 'Share an example of when you proactively took on additional responsibilities.',
          type: 'behavioral',
          category: 'Initiative',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_b5',
          text: 'Tell me about a time when you had to learn a new skill to complete your work.',
          type: 'behavioral',
          category: 'Learning Agility',
          difficulty: 'medium',
          expected_duration: 120
        }
      ],
      technical: [
        {
          id: 'default_t1',
          text: 'Explain the main features and advantages of your most familiar programming language.',
          type: 'technical',
          category: 'Programming',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_t2',
          text: 'How would you optimize a slow-running database query?',
          type: 'technical',
          category: 'Database',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_t3',
          text: 'Describe your understanding of the software development lifecycle.',
          type: 'technical',
          category: 'Software Development',
          difficulty: 'easy',
          expected_duration: 120
        },
        {
          id: 'default_t4',
          text: 'How do you ensure code quality and maintainability?',
          type: 'technical',
          category: 'Code Quality',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_t5',
          text: 'Explain the best practices for API design.',
          type: 'technical',
          category: 'API Design',
          difficulty: 'hard',
          expected_duration: 120
        }
      ],
      psychometric: [
        {
          id: 'default_p1',
          text: 'What motivates you most to stay productive at work?',
          type: 'psychometric',
          category: 'Motivation',
          difficulty: 'easy',
          expected_duration: 90
        },
        {
          id: 'default_p2',
          text: 'How do you handle work pressure and emergency situations?',
          type: 'psychometric',
          category: 'Stress Management',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_p3',
          text: 'Describe your ideal work environment.',
          type: 'psychometric',
          category: 'Work Environment',
          difficulty: 'easy',
          expected_duration: 90
        },
        {
          id: 'default_p4',
          text: 'How do you balance personal goals with team objectives?',
          type: 'psychometric',
          category: 'Goal Alignment',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'default_p5',
          text: 'When facing uncertainty, how do you typically make decisions?',
          type: 'psychometric',
          category: 'Decision Making',
          difficulty: 'hard',
          expected_duration: 120
        }
      ]
    }

    const questions = defaultQuestions[questionType] || defaultQuestions.behavioral
    return questions.slice(0, questionCount)
  }

  /**
   * Call GPT API with error handling
   */
  async callGPT(prompt) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional interview coach who excels at analyzing interview responses and providing constructive feedback. Always return results in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Empty response from GPT')
      }

      return content
    } catch (error) {
      throw new ApiError({
        message: 'GPT API call failed',
        code: 'GPT_API_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }
}

// Export singleton instance
export const gptService = new GPTService()
