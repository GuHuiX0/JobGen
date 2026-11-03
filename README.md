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
- **User context**: Requests use the `x-user-id` header; the Express entry point does not register login or registration routes.
- **Storage**: AWS S3 (for audio file persistence)

### AI & ML
- **OpenAI Whisper**: Speech-to-text transcription.
- **Python Libraries**: `numpy`, `librosa` (audio analysis), `textblob` (sentiment).

## Quick Start (Docker)

Docker Compose defines the frontend, backend, and MongoDB services. The backend validates external-service credentials at startup, so configure the environment before starting the stack.

### Prerequisites
- Docker Desktop (with Docker Compose v2)
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/GuHuiX0/JobGen.git
   cd JobGen
   ```

2. **Configure the backend**

   Create `backend/.env` using the variables below. The Compose bind mount exposes this file at `/app/.env`, where the backend loads it with dotenv. Supply valid OpenAI and AWS credentials for the corresponding features. Set `PORT=5000` to match the container port mapping.

3. **Start the application**
   ```bash
   docker compose up --build
   ```
   *Note: The first build may take a few minutes to install both Node.js and Python dependencies.*

4. **Access the Application**
   - **Frontend (UI)**: [http://localhost:8080](http://localhost:8080)
   - **Backend (API)**: [http://localhost:8081](http://localhost:8081)

The MongoDB initialization script creates collections and indexes, but does not seed application login accounts. The MongoDB root credentials in Compose are database credentials, not application accounts.

Check the backend at [http://localhost:8081/health](http://localhost:8081/health) and inspect the API documentation at [http://localhost:8081/api-docs](http://localhost:8081/api-docs). A successful health response alone does not verify OpenAI or S3 operations.

## Environment Variables

Create `backend/.env` for the supplied Compose setup. The configuration module requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `OPENAI_API_KEY`, and `MONGODB_URI` on startup:

```env
# Backend Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/ai-coach?authSource=admin

# AI Services
OPENAI_API_KEY=sk-your-openai-key

# AWS S3 (required by the current startup configuration)
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

The Express entry point registers these routes and route groups:

- `GET /health`: process health.
- `GET /interview/types`: available interview types.
- `/interviews`: interview and question routes.
- `/signed-url`: audio-storage URL routes.
- `/dashboard`: dashboard routes.
- `/story-bank`: story routes.

Requests use `x-user-id` for user context. Consult [the route implementations](backend/src/routes) and [Swagger specification](backend/swagger.yaml) for individual operations. The current entry point does not mount the `/api/auth/login` or `/api/auth/register` endpoints previously listed here.

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
