# AI Interview Intelligence Platform

An AI-powered interview coaching platform that analyzes candidate behavior in real-time using Computer Vision and AI techniques.

## Features

### Real-Time Interview Analysis

* Eye Contact Detection
* Confidence Scoring
* Engagement Analysis
* Face Visibility Tracking
* Fidget Detection
* Focus Score Monitoring

### AI-Powered Feedback

* AI-generated Interview Feedback
* HR-style Performance Evaluation
* Improvement Suggestions
* Personalized Recommendations

### Interview Management

* Mock Interview Sessions
* Coding Interview Module
* Interview History Tracking
* Progress Analytics Dashboard
* PDF Report Generation

### Computer Vision

Built using OpenCV and MediaPipe Face Mesh for:

* Facial Landmark Detection
* Eye Tracking
* Head Position Analysis
* Face Visibility Measurement
* Movement Analysis

## Tech Stack

### Frontend

* React.js
* CSS3
* Chart.js

### Backend

* FastAPI
* Python
* WebSockets
* JWT Authentication

### Database

* PostgreSQL
* SQLAlchemy

### AI / Computer Vision

* OpenCV
* MediaPipe
* Gemini AI

### Deployment

* Vercel (Frontend)
* Railway (Backend)

## Project Architecture

Frontend (React)
↓
FastAPI Backend
↓
OpenCV + MediaPipe Analysis Engine
↓
PostgreSQL Database
↓
AI Feedback Generation

## Key Metrics Tracked

| Metric          | Description                       |
| --------------- | --------------------------------- |
| Eye Contact     | Measures attention towards camera |
| Confidence      | Based on posture and facial cues  |
| Engagement      | Measures interview involvement    |
| Focus Score     | Overall concentration indicator   |
| Face Visibility | Tracks face presence in frame     |
| Fidget Control  | Detects excessive head movement   |

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Live Demo

Frontend:
https://ai-interview-platform-pink-eight.vercel.app

## Author

Akshit Srivastava

GitHub:
https://github.com/Akshit-Srivastava1

## Future Enhancements

* Voice Analysis
* Emotion Recognition
* Resume-Based Question Generation
* Interview Question Recommendation Engine
* Advanced Behavioral Analytics
