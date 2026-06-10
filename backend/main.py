from pydantic import BaseModel

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Depends,
    WebSocket,
    HTTPException
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)
from reportlab.lib.styles import (getSampleStyleSheet)
from reportlab.lib.pagesizes import (letter)
from reportlab.lib import colors
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import UploadFile, File
import pdfplumber
from docx import Document
from dotenv import load_dotenv
import os
from fastapi import Header

import cv2
import numpy as np
import tempfile
import base64
import subprocess
import google.generativeai as genai
import json
import random

from auth import *
from datetime import datetime
from cv_engine import analyze_face

from database import (
    SessionLocal,
    engine,
    Base
)


from models import (
    UserDB,
    InterviewHistory,
    CodingHistory
)

app = FastAPI()

load_dotenv()

genai.configure( api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel( "gemini-2.5-flash")

# CREATE DATABASE TABLES

Base.metadata.create_all(bind=engine)

# DATABASE SESSION

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()

# USER MODEL

class User(BaseModel):
    firstName: str = ""
    lastName: str = ""
    countryCode: str = ""
    phone: str = ""
    email: str
    password: str
    confirmPassword: str = ""
    verificationMethod: str = ""

class MockInterviewRequest(BaseModel):
    question: str
    answer: str
    
class CodeRequest(BaseModel):
    language: str
    code: str

class ReviewRequest(BaseModel):
    code: str

class ChatRequest(BaseModel):
    message: str

class InterviewData(BaseModel):
    confidence: int
    eye_contact: int
    engagement: int
    speech: int
# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HOME ROUTE

@app.get("/")
def home():

    return {
        "message":"AI Interview Platform Running"
    }


# REGISTER

@app.post("/register")
def register(
    user: User,
    db: Session = Depends(get_db)
):

    existing_user = db.query(
        UserDB
    ).filter(
        UserDB.email == user.email
    ).first()

    if existing_user:
        return {
            "error":"User already exists"
        }

    hashed = hash_password(
        user.password
    )

    new_user = UserDB(
        first_name=user.firstName,
        last_name=user.lastName,
        email=user.email,
        phone=user.phone,
        password=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message":"User registered successfully"
    }


# LOGIN

@app.post("/login")
def login(
    user: User,
    db: Session = Depends(get_db)
):

    db_user = db.query(
        UserDB
    ).filter(
        UserDB.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
    )

    if not verify_password( user.password,db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    token = create_access_token(
        data={
            "sub": user.email
        }
    )

    return {
        "access_token":token,
        "token_type":"bearer",
        "firstName":db_user.first_name,
        "lastName": db_user.last_name,
        "email": db_user.email
    }


# PROTECTED ROUTE

@app.get("/protected")
def protected(token: str):
    email = verify_token(token)
    if not email:
        return {
            "error":"Invalid token"
        }

    return {
        "message":f"Welcome {email}"
    }
    
    #PROFILE

@app.get("/profile")
def get_profile(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):

    token = authorization.replace(
        "Bearer ", ""
    )

    email = verify_token(token)

    if not email:
        return {
            "error":"Invalid token"
        }

    user = db.query(UserDB).filter(
        UserDB.email == email
    ).first()

    if not user:
        return {
            "error":"User not found"
        }

    return {
        "name":f"{user.first_name} {user.last_name}",
        "email":user.email
    }
# VIDEO ANALYSIS

@app.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...)
):

    contents = await file.read()
    nparr = np.frombuffer(
        contents,
        np.uint8
    )

    frame = cv2.imdecode(
        nparr,
        cv2.IMREAD_COLOR
    )

    analysis = analyze_face(frame)
    return {
        "status": "success",
        "analysis": analysis
    }

def calculate_ats_score(resume_text, skills):

    score = 50
    strengths = []
    improvements = []

    skill_score = min(len(skills) * 2, 20)
    score += skill_score

    if len(skills) >= 6:
        strengths.append("Strong technical skillset")
    else:
        improvements.append("Add more technical skills")

    # Projects

    if "project" in resume_text.lower():
        score += 10
        strengths.append("Projects section detected")
    else:
        improvements.append("Add strong projects")

    # Experience

    if "experience" in resume_text.lower():
        score += 10
        strengths.append("Experience section detected")
    else:
        improvements.append("Add internship or work experience")

    # Education

    if "education" in resume_text.lower():
        score += 10
        strengths.append("Education section present")
    else:
        improvements.append("Add education section")

    # Certifications

    if ("certification" in resume_text.lower() or "certificate" in resume_text.lower()):
        score += 10
        strengths.append("Certifications detected")
    else:
        improvements.append("Add certifications")

    # GitHub

    if "github" in resume_text.lower():
        score += 5
        strengths.append("GitHub profile detected")
    else:
        improvements.append("Add GitHub profile")

    # LinkedIn

    if "linkedin" in resume_text.lower():
        score += 5
        strengths.append("LinkedIn profile detected")
    else:
        improvements.append("Add LinkedIn profile")

    # Resume Length

    if len(resume_text) > 1200:
        score += 5
        strengths.append("Detailed resume content")
    else:
        improvements.append("Add more project details and achievements")

    score = min(score, 100)

    if len(improvements) == 0:
        improvements.append("Excellent resume. Minor formatting improvements can further improve ATS performance.")

    return {
        "ats_score": score,
        "strengths": strengths,
        "improvements": improvements
    }
   
# RESUME PARSER

@app.post("/parse-resume")
async def parse_resume(
    file: UploadFile = File(...)
):

    text = ""
    try:
        if file.filename.endswith(".pdf"):
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".pdf"
            ) as temp:
                temp.write(await file.read())
                temp_path = temp.name

            with pdfplumber.open(temp_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"


        elif file.filename.endswith(".docx"):
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".docx"
            ) as temp:

                temp.write(await file.read())
                temp_path = temp.name

            doc = Document(temp_path)
            for para in doc.paragraphs:
                text += para.text + "\n"

        else:
            return {
                "error":
                "Only PDF and DOCX files are supported"
            }

        # GEMINI ATS ANALYSIS

        prompt = f"""
        You are a professional ATS Resume Analyzer.
        Analyze the resume and return ONLY valid JSON.
        Format:
        {{
        "ats_score": 0,
        "skills": [],
        "strengths": [],
        "improvements": []
        }}

        Rules:
        - ATS score must be realistic (0-100)
        - Most resumes should score between 50-85
        - Give 5-10 detected skills
        - Give 3-5 strengths
        - Give 3-5 improvements
        - Do not return markdown
        - Return JSON only
        Resume:{text[:15000]}  
         """

        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        raw_text = raw_text.replace(
            "```json",
            ""
        )

        raw_text = raw_text.replace(
            "```",
            ""
        )

        try:
            result = json.loads(raw_text)

        except Exception:
            result = {
                "ats_score": 70,
                "skills": [],
                "strengths": ["Resume parsed successfully"],
                "improvements": ["AI ATS parser could not generate detailed feedback"]
            }

        return {
            "status": "success",
            "ats_score": result.get("ats_score",70),
            "skills": result.get("skills",[]),
            "strengths": result.get("strengths",[]),
            "improvements":  result.get("improvements",[])
        }

    except Exception as e:
        print("Resume Error:", e)
        return {
            "status": "error",
            "ats_score": 0,
            "skills": [],
            "strengths": [],
            "improvements": [
                str(e)
            ]
        }

# SAVE INTERVIEW HISTORY

@app.post("/save-interview")
def save_interview(
    data: dict,
    db: Session = Depends(get_db)
):

    new_history = InterviewHistory(
        user_email=data["user_email"],
        confidence=data["confidence"],
        eye_contact=data["eye_contact"],
        engagement=data["engagement"],
        speech=data["speech"],
        feedback=data["feedback"]
    )

    db.add(new_history)
    db.commit()
    db.refresh(new_history)

    return {
        "message":  "Interview saved successfully"
    }


# GET INTERVIEW HISTORY

@app.get("/interview-history/{email}")
def get_history(
    email: str,
    db: Session = Depends(get_db)
):

    history = db.query(
        InterviewHistory
    ).filter(
        InterviewHistory.user_email == email
    ).all()

    results = []

    for item in history:
        results.append({
            "id": item.id,
            "created_at": str(item.created_at),
            "confidence": item.confidence,
            "eye_contact": item.eye_contact,
            "engagement": item.engagement,
            "speech": item.speech,
            "feedback": item.feedback
        })

    return results

# PDF REPORT GENERATION

@app.get("/generate-report/{email}")
def generate_report(
    email: str,
    db: Session = Depends(get_db)
):

    history = db.query(
        InterviewHistory
    ).filter(
        InterviewHistory.user_email == email
    ).all()

    if not history:

        return {
            "error":  "No interview history found"
        }
    latest = history[-1]
    filename = f"{email}_report.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    elements = []
    title = Paragraph(
        """
        <font size=24>
        <b>AI Interview Performance Report</b>
        </font>
        """,
        styles['Title']
    )

    elements.append(title)
    elements.append( Spacer(1, 20))

    current_date = datetime.now().strftime( "%d %B %Y | %I:%M %p")

    date_para = Paragraph(
        f"""
        <font size=11 color='grey'>
        Generated on: {current_date}
        </font>
        """,
        styles['Normal']
    )

    elements.append(date_para)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable())
    elements.append(Spacer(1, 20))

    user_info = Paragraph(
        f"""
        <font size=15>
        <b>Candidate Email:</b> {email}
        </font>
        """,
        styles['BodyText']
    )

    elements.append(user_info)
    elements.append(Spacer(1, 25))

    table_data = [
        ["Performance Metric", "Score"],
        ["Confidence", f"{latest.confidence}%"],
        ["Eye Contact", f"{latest.eye_contact}%"],
        ["Engagement", f"{latest.engagement}%"],
        ["Speech Clarity", f"{latest.speech}%"]
    ]

    table = Table(table_data, colWidths=[300, 150])

    table.setStyle(
        TableStyle([
            (
                'BACKGROUND',
                (0, 0),
                (-1, 0),
                colors.HexColor("#0f172a")
            ),

            (
                'TEXTCOLOR',
                (0, 0),
                (-1, 0),
                colors.white
            ),

            (
                'FONTNAME',
                (0, 0),
                (-1, 0),
                'Helvetica-Bold'
            ),

            (
                'FONTSIZE',
                (0, 0),
                (-1, 0),
                14
            ),

            (
                'BOTTOMPADDING',
                (0, 0),
                (-1, 0),
                12
            ),

            (
                'BACKGROUND',
                (0, 1),
                (-1, -1),
                colors.HexColor("#e2e8f0")
            ),

            (
                'GRID',
                (0, 0),
                (-1, -1),
                1,
                colors.grey
            ),

            (
                'FONTSIZE',
                (0, 1),
                (-1, -1),
                12
            ),

            (
                'BOTTOMPADDING',
                (0, 1),
                (-1, -1),
                10
            ),

        ])
    )

    elements.append(table)

    elements.append(
        Spacer(1, 30)
    )

    feedback_title = Paragraph(
        """
        <font size=18>
        <b>AI Feedback</b>
        </font>
        """,
        styles['Heading2']
    )

    elements.append(feedback_title)
    elements.append(Spacer(1, 10))
    feedback = Paragraph(
        f"""
        <font size=12>
        {latest.feedback}
        </font>
        """,
        styles['BodyText']
    )

    elements.append(feedback)
    elements.append(Spacer(1, 25))
    summary_title = Paragraph(
        """
        <font size=18>
        <b>Performance Summary</b>
        </font>
        """,
        styles['Heading2']
    )

    elements.append(summary_title)
    elements.append(Spacer(1, 10))

    summary = Paragraph(
        """
        <font size=12>
        The candidate demonstrated good communication
        skills, stable confidence levels, and strong
        engagement during the interview session.
        Eye contact and speech clarity indicate
        strong interview readiness.
        </font>
        """,
        styles['BodyText']
    )

    elements.append(summary)
    elements.append(Spacer(1, 25))

    recommendation_title = Paragraph(
        """
        <font size=18>
        <b>Recommendations</b>
        </font>
        """,
        styles['Heading2']
    )

    elements.append(recommendation_title)
    elements.append(Spacer(1, 10))

    recommendations = Paragraph(
        """
        • Maintain stronger eye contact.<br/>
        • Practice more technical mock interviews.<br/>
        • Improve answer structuring using STAR method.<br/>
        • Continue improving communication confidence.
        """,
        styles['BodyText']
    )

    elements.append(recommendations)
    elements.append(Spacer(1, 40))

    footer = Paragraph(
        """
        <font size=10 color='grey'>
        Generated by AI Interview Coach Platform
        </font>
        """,
        styles['Normal']
    )

    elements.append(footer)
    doc.build(elements)
    return FileResponse(
        path=filename,
        filename=filename,
        media_type='application/pdf'
    )

@app.get("/coding-question")
def coding_question():

    return {

        "title": "Two Sum",
        "difficulty": "Easy",
        "question": "Given an array of integers nums and an integer target, return indices of two numbers that add up to target."
    }

@app.post("/run-code")
def run_code(
    request: CodeRequest
):

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".py"
        ) as temp:
            temp.write(request.code.encode())

            temp_path = temp.name
        result = subprocess.run(
            ["python3", temp_path],
            capture_output=True,
            text=True,
            timeout=5
        )

        return {
            "output":
                result.stdout
                if result.stdout
                else result.stderr
        }

    except Exception as e:
        return {
            "output": str(e)
        }
        
@app.post("/review-code")
def review_code(request: ReviewRequest):

    try:

        prompt = f"""
        You are a Senior Software Engineer conducting a coding interview.

        Coding Question:
        Given an array of integers nums and an integer target,
        return indices of two numbers that add up to target.

        Candidate Code:
        {request.code}

        Evaluate:

        1. Correctness (0-40)
        2. Code Quality (0-20)
        3. Time Complexity (0-20)
        4. Best Practices (0-20)

        Return ONLY valid JSON:

        {{
          "score": 85,
          "complexity": "O(n)",
          "feedback": [
            "Uses hash map efficiently",
            "Good code structure",
            "Handles edge cases"
          ]
        }}
        """

        response = model.generate_content(prompt)

        text = response.text.strip()

        text = text.replace("```json", "")
        text = text.replace("```", "")

        try:
            result = json.loads(text)

            return {
                "score": result.get("score", 70),
                "complexity": result.get("complexity", "Unknown"),
                "feedback": result.get("feedback", [])
            }

        except Exception:

            return {
                "score": 70,
                "complexity": "Unknown",
                "feedback": [
                    "AI evaluation completed",
                    "Unable to parse detailed feedback"
                ]
            }

    except Exception as e:

        return {
            "score": 0,
            "complexity": "N/A",
            "feedback": [str(e)]
        }

@app.post("/generate-hr-feedback")
def generate_hr_feedback(data: dict):

    confidence = data["confidence"]
    eye_contact = data["eye_contact"]
    engagement = data["engagement"]
    speech = data["speech"]

    strengths = []
    improvements = []

    if confidence >= 75:
        strengths.append("Demonstrated strong confidence")
    else:
        improvements.append("Improve confidence while answering")

    if eye_contact >= 75:
        strengths.append("Maintained good eye contact")
    else:
        improvements.append("Maintain better eye contact")

    if engagement >= 75:
        strengths.append("Stayed engaged throughout interview")
    else:
        improvements.append("Show more enthusiasm")

    if speech >= 75:
        strengths.append("Communicated clearly")
    else:
        improvements.append("Improve speech clarity")

    overall = int((confidence + eye_contact +  engagement + speech) / 4)

    recommendation = (
        "Recommended for Next Round"
        if overall >= 75
        else
        "Needs Improvement"
    )

    return {
        "overall_score": overall,
        "strengths": strengths,
        "improvements": improvements,
        "recommendation": recommendation
    }

@app.post("/chat")
def chat(request: ChatRequest):

    try:
        prompt = f"""
        You are an expert AI Interview Coach.

        Your responsibilities:
        - Resume Reviews
        - ATS Optimization
        - HR Interview Preparation
        - Technical Interview Preparation
        - Coding Interview Guidance
        - Career Advice

        Rules:
        1. Always answer using Markdown.
        2. Use headings and subheadings.
        3. Use bullet points.
        4. Use numbered steps when appropriate.
        5. Keep answers concise but detailed.
        6. Give examples when useful.
        7. Never return one large paragraph.

        User Question:
        {request.message}
        """

        response = model.generate_content(prompt)

        return { "response":response.text}

    except Exception as e:
        return {
            "response":str(e)
        }
        
        #MOCK INTERVIEW
        
@app.get("/mock-question")
def mock_question():

    topics = [
        "HR",
        "Behavioral",
        "Projects",
        "OOPs",
        "DBMS",
        "Operating Systems",
        "Networking",
        "AI/ML"
    ]

    topic = random.choice(topics)

    prompt = f"""
    Generate ONE interview question for a fresher Software Engineer.

    Topic: {topic}

    Return ONLY the question.
    """

    response = model.generate_content(prompt)

    return {
        "question": response.text.strip()
    }

@app.post("/mock-feedback")
def mock_feedback(request: MockInterviewRequest):
    try:

        prompt = f"""
        You are a senior technical interviewer.

        Interview Question:
        {request.question}

        Candidate Answer:
        {request.answer}

        Your task is to REVIEW the candidate's answer.

        Do NOT answer the interview question yourself.

        Evaluate the candidate's response and return ONLY in this format:

        Score: X/10

        Strengths:
        - point 1
        - point 2

        Weaknesses:
        - point 1
        - point 2

        Suggestions:
        - point 1
        - point 2

        Improved Answer:
        (write a better version of the candidate's answer)
        """

        response = model.generate_content(prompt)

        return {
            "feedback": response.text
        }

    except Exception as e:
        print("MOCK FEEDBACK ERROR:", str(e))

        return {
            "feedback": f"ERROR: {str(e)}"
        }
    
# REAL-TIME WEBSOCKET VIDEO ANALYSIS

@app.websocket("/ws/video")
async def websocket_video(
    websocket: WebSocket
):

    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            image_data = data.split(",")[1]
            image_bytes = base64.b64decode(image_data)

            nparr = np.frombuffer(image_bytes, np.uint8)

            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            analysis = analyze_face(frame)
            print("ANALYSIS:", analysis)
            await websocket.send_json({
                "eye_contact": analysis["eye_contact"],
                "confidence": analysis["confidence"],
                "engagement": analysis["engagement"],
                "speech":  analysis["speech"],
                "face_visibility": analysis["face_visibility"],
                "fidget": analysis["fidget"]
            })

        except Exception as e:
            print("WebSocket Error:", e)
            break
        
@app.post("/generate-ai-feedback")
async def generate_ai_feedback(data: InterviewData):

    try:
        prompt = f"""
        You are an expert interview coach.

        Candidate Performance:
        Confidence: {data.confidence}%
        Eye Contact: {data.eye_contact}%
        Engagement: {data.engagement}%
        Speech: {data.speech}%

        Give:
        - Overall Assessment
        - Strengths
        - Weaknesses
        - 3 Improvement Suggestions

        Keep it under 150 words.
        """

        response = model.generate_content(prompt)

        return {
            "feedback": response.text
        }

    except Exception as e:
        print("AI FEEDBACK ERROR:", str(e))

        return {
            "feedback": f"ERROR: {str(e)}"
        }
        
@app.delete("/delete-interview/{interview_id}")
def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db)
):

    interview = db.query(
        InterviewHistory
    ).filter(
        InterviewHistory.id == interview_id
    ).first()

    if not interview:
        return {
            "error": "Interview not found"
        }

    db.delete(interview)
    db.commit()

    return {
        "message": "Interview deleted successfully"
    }