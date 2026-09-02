# CoAct.AI - Backend API

This is the FastAPI-based backend for the CoAct.AI platform. It provides endpoints for session management, audio transcription, reasoning, and report generation.

## Architecture

The backend handles the core logic of the CoAct.AI application:
- **Speech-to-Text (STT)**: Utilizes Groq API (`whisper-large-v3-turbo`) for near-instant audio transcription.
- **Reasoning**: Powered by Groq API (`llama-3.3-70b-versatile`) to generate intelligent responses.
- **Text-to-Speech (TTS)**: Streams AI responses using Sarvam AI (`bulbul:v3`) or OpenAI.
- **Database**: MongoDB for all persistent application data.

## Setup & Running Locally

### Prerequisites
- Python 3.10+
- `.env` file configured with required API keys.

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or venv\Scripts\activate on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file from the example:
   ```env
   # .env
   GROQ_API_KEY=your_groq_key
   OPENAI_API_KEY=your_openai_key
   SARVAM_API_KEY=your_sarvam_key
   ```

### Running the Server

Start the FastAPI application:
```bash
python app.py
```
The server will be available at `http://localhost:8000`.

## API Documentation
Once the server is running, you can access the interactive API documentation (Swagger UI) at:
`http://localhost:8000/docs`
