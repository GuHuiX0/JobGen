# AI Interview Coach
A full-stack, containerized AI interview coaching application designed to help users practice interviews with real-time feedback.

## Project Overview

This application simulates a real interview environment where users can answer questions via **voice** or **text**. It leverages **OpenAI Whisper** for high-accuracy speech-to-text transcription and a custom **Python-based voice analysis pipeline** to evaluate speaking fluency, emotion, and pacing.

**Key Features:**
- **Interactive Interview Sessions**: Support for various interview types (Behavioral, Technical, etc.).
- **Voice & Text Input**: Record answers directly in the browser or type them out.
- **AI-Powered Feedback**:
  - **Transcription**: Automatic speech-to-text using OpenAI Whisper.
  - **Voice Analysis**: Python NLP pipeline analyzes prosody, fluency, and filler words.
  - **Content Review**: (Future/Mock) AI feedback on the quality of the answer.
- **Dashboard & History**: Track progress, view past sessions, and analyze improvement over time.
- **Dockerized Deployment**: One-command setup for the entire stack (Frontend, Backend, Database).

## Tech Stack

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS, CSS Modules
- **HTTP Client**: Axios
- **Features**: Real-time audio recording (MediaRecorder API), 3D Scene rendering (React Three Fiber).

### Backend
- **Runtime**: Node.js (Express)
- **Language**: JavaScript (ES Modules)
- **Voice Processing**: Python 3.11 (invoked as a child process for analysis)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Storage**: AWS S3 (for audio file persistence)

### AI & ML
- **OpenAI Whisper**: Speech-to-text transcription.
- **Python Libraries**: `numpy`, `librosa` (audio analysis), `textblob` (sentiment).

## Quick Start (Docker)

The easiest way to run the application is using Docker Compose. This will set up the Frontend, Backend, and MongoDB database automatically.

### Prerequisites
- Docker Desktop (with Docker Compose v2)
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "capstone-project-25t3-9900-f09c-almond"
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```
   *Note: The first build may take a few minutes to install both Node.js and Python dependencies.*

3. **Access the Application**
   - **Frontend (UI)**: [http://localhost:8080](http://localhost:8080)
   - **Backend (API)**: [http://localhost:8081](http://localhost:8081)

4. **Default Accounts**
   - **Admin**: `admin` / `password123`
   - **User**: `user` / `password456`

## Environment Variables

The application comes with default values in `docker-compose.yml` for immediate testing. For production or custom configuration, create a `.env` file in the root directory:

```env
# Backend Configuration
PORT=5000
NODE_ENV=production
JWT_SECRET_KEY=your-secure-secret-key

# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/ai-coach?authSource=admin

# AI Services
OPENAI_API_KEY=sk-your-openai-key

# AWS S3 (Optional for local dev, required for persistent audio storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
```

## Project Structure

```
.
├── docker-compose.yml          # Service orchestration
├── backend/
│   ├── Dockerfile              # Multi-stage build (Node.js + Python)
│   ├── package.json            # Node.js dependencies
│   ├── requirements.txt        # Python dependencies (for voice analysis)
│   ├── src/
│   │   ├── app.js              # Express entry point
│   │   ├── routes/             # API Endpoints
│   │   ├── services/           # Business logic (Whisper, S3, MongoDB)
│   │   └── middleware/         # Auth & Error handling
│   └── test/                   # Jest Unit & Integration tests
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/         # React components (ChatOverlay, CameraFeed)
│   │   ├── pages/              # Page layouts
│   │   └── services/           # API integration
│   └── public/                 # Static assets
└── voice_analysis/             # Python module for audio processing
    ├── analyzer.py             # Main analysis script
    └── audio_features.py       # Audio feature extraction logic
```

## API Documentation

The backend exposes a RESTful API. Key endpoints include:

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`
- **Interviews**: `POST /api/interviews` (Create session), `GET /api/interviews/history`
- **Submission**: `POST /api/interviews/:id/submit` (Submit audio/text responses)
- **Feedback**: `GET /api/interviews/:id/feedback` (Retrieve AI analysis)

Full API documentation (Swagger/OpenAPI) is available at `backend/swagger.yaml`.

## Testing

The project uses **Jest** for backend testing, covering both Unit and Integration levels.

### Running Tests (Backend)

1. **Install Dependencies** (Local):
   ```bash
   cd backend
   npm install
   ```

2. **Run Unit Tests**:
   ```bash
   npm run test:unit
   ```

3. **Run Integration Tests**:
   ```bash
   npm run test:integration
   ```

*Note: Integration tests may require a running MongoDB instance or properly mocked services.*

> **Integration prerequisites**
>
> - `test/integration/race-condition.test.js` assumes a reachable MongoDB defined by `MONGODB_URI`. Without a database the helper `MongoDBService.createInterviewSession` will throw `MONGODB_SESSION_ERROR`.
> - `test/integration/voice-analysis.integration.test.js` shells out to the Python pipeline under `voice_analysis/`. Install the dependencies listed in `voice_analysis_requirements.md` (e.g. `librosa`) and expose a usable `python` executable before running this suite.

### Backend Test Coverage Overview

- **Unit tests (`backend/test/unit_test/`)**:
  - **Middleware**: `validation.middleware` and `error.middleware` are covered with tests that assert correct validation behaviour, error shaping, and HTTP status codes.
  - **Core services**: Dedicated test files exist for `audio-processing.service`, `gpt.service`, `mongodb.service`, and `response-validation.service`, exercising typical success paths and key failure branches.
- **Integration tests (`backend/test/integration/`)**:
  - **HTTP flows**: `question.routes.test.js` and `race-condition.test.js` use Supertest against the Express app to validate REST endpoints and concurrent interview-session creation behaviour.
  - **End‑to‑end voice analysis**: `voice-analysis.integration.test.js` drives the Node API through to the Python `voice_analysis` module, ensuring realistic audio + transcript requests are processed correctly.
- **CI-friendly commands**:
  - Run the full backend suite locally with `npm run test:all`.
  - Run linting + formatting checks + all tests (the configuration used in CI) with `npm run test:ci`.

This combination of unit, integration, and end‑to‑end tests gives coverage over:

- Request validation and error handling at the HTTP boundary.
- Business logic in core services (MongoDB persistence, GPT interaction, audio processing, and response validation).
- Cross‑service behaviour for key user flows (question fetching, session concurrency, and voice analysis round‑trip).

### Voice Analysis (Python) Tests

The standalone `voice_analysis/` module is tested separately using **pytest**:

- **Location**: Tests live under `voice_analysis/tests/`.
- **How to run**:
  ```bash
  # From the project root (after installing Python dependencies)
  pytest voice_analysis/tests
  ```
- **Coverage focus**:
  - Filler-word detection and normalization.
  - Speech-rate computation.
  - Pause detection on synthetic audio.
  - Scoring logic and an end‑to‑end `analyze_voice` flow on a small generated signal.

## License

[License Name]
