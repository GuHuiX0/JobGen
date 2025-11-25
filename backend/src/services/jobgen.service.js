import { ApiError } from '../types/index.js'

export class JobGenService {
  /**
   * Fetch user snapshot from external API
   */
  async fetchUserSnapshot(jwtToken) {
    try {
      const response = await fetch('https://jobgen.ai/version-test/api/1.1/wf/jobgen_interview_prep', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.status === 'success' && data.response.status === '200') {
        return data.response
      } else if (data.response.status === '403') {
        throw new ApiError({
          message: 'Unauthorized access to user profile',
          code: 'USER_PROFILE_UNAUTHORIZED',
          statusCode: 403
        })
      } else {
        throw new ApiError({
          message: 'Failed to fetch user profile',
          code: 'USER_PROFILE_FETCH_ERROR',
          statusCode: 500
        })
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError({
        message: 'Network error while fetching user profile',
        code: 'USER_PROFILE_NETWORK_ERROR',
        statusCode: 500,
        details: error
      })
    }
  }
}

// Export singleton instance
export const jobGenService = new JobGenService()
