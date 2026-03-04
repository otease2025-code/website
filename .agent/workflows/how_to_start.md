---
description: How to start the OTES Trauma Management System
---

# How to Start the Application

To run the OTES Trauma Management System, you need to start both the backend API server and the frontend development server.

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL (or ensure your database connection is configured)

## 1. Start the Backend Server

Open a terminal and navigate to the `server` directory:

```powershell
cd server
```

Create and activate a virtual environment (Recommended):

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Start the FastAPI server:

```powershell
python -m uvicorn main:app --reload
```

The backend API will be available at `http://localhost:8000`.
You can view the API documentation at `http://localhost:8000/docs`.

## 2. Start the Frontend Server

Open a new terminal window and navigate to the root directory of the project:

```powershell
cd c:\FREELANCING\otease
```

Install dependencies (if you haven't already):

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

The frontend application will be available at `http://localhost:5173` (or the port shown in the terminal).

## 3. Access the Application

Open your browser and go to `http://localhost:5173`.
You can now log in as a Patient, Therapist, or Caregiver.
