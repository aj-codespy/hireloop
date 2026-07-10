# HireLoop

HireLoop is a modern, AI-powered hiring and candidate interviewing platform. It features an interactive candidate interview flow and a comprehensive admin dashboard for managing jobs, candidates, and interview settings.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Python](https://www.python.org/downloads/) (v3.9 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Setup Instructions

### 1. Environment Configuration

You will need to configure environment variables for both the backend (API) and frontend (Web). We have provided `.env.example` files to make this easy.

**API Environment Variables**
Copy the example file to `.env` in the `apps/api` directory:
```bash
cp apps/api/.env.example apps/api/.env
```
Open `apps/api/.env` and fill in the required keys:
- `GEMINI_API_KEY`: Your Gemini API key for AI features.
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY`: Your Supabase database credentials.
- `INTERVIEW_INTERNAL_SECRET`: A secure random string for internal authentication.

**Web Environment Variables**
Copy the example file to `.env.local` in the `apps/web` directory:
```bash
cp apps/web/.env.example apps/web/.env.local
```
Open `apps/web/.env.local` and fill in the required keys:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase public credentials.
- `SUPABASE_SECRET_KEY`: Your Supabase secret key.
- `INTERVIEW_INTERNAL_SECRET`: Must match the secret in the API `.env`.

### 2. Backend Setup (API)

The backend is built with Python and FastAPI.

1. Navigate to the API directory:
   ```bash
   cd apps/api
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

### 3. Frontend Setup (Web)

The frontend is built with Next.js, React, and Tailwind CSS.

1. Open a new terminal window and navigate to the Web directory:
   ```bash
   cd apps/web
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Running the Application

Once both servers are running:
- Open [http://localhost:3000](http://localhost:3000) to access the **Web Application**.
- The **API** is running on [http://localhost:8001](http://localhost:8001).

You can access the admin dashboard by navigating to `/admin/login` on the Web Application.
