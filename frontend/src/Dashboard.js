import React, { useEffect, useRef, useState } from 'react';
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import './Dashboard.css';
import Chatbot from "./Chatbot";

const data = [
  { time: 1, confidence: 65 },
  { time: 2, confidence: 72 },
  { time: 3, confidence: 80 },
  { time: 4, confidence: 76 },
  { time: 5, confidence: 82 }
];

function Dashboard({ setLoggedIn, setCurrentPage }) {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  // HISTORY TOGGLE
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChatbot, setShowChatbot] =useState(false);
  // USER NAME

  const userName = sessionStorage.getItem('userName') || 'User';

  // PROFILE LETTER

  const firstLetter = userName.charAt(0).toUpperCase();
  const [hrFeedback, setHrFeedback] = useState(null);

  // LIVE ANALYSIS

  const [analysis, setAnalysis] = useState({
    eye_contact: 0,
    confidence: 0,
    engagement: 0,
    speech: 0,
  });

  const generateHRFeedback = async () => {
    try {
      const response = await axios.post(
        "https://ai-interview-platform-production-9ae2.up.railway.app/generate-hr-feedback",
        {
          confidence: analysis.confidence,
          eye_contact: analysis.eye_contact,
          engagement: analysis.engagement,
          speech: analysis.speech
        }
      );
      setHrFeedback(response.data);
    } catch (error) {
      console.log(error);
      alert("Unable to generate HR feedback");
    }
  };

  const [interviewHistory, setInterviewHistory] = useState([]);
  // START CAMERA + WEBSOCKET

  useEffect(() => {
    startCamera();
    fetchHistory();

    socketRef.current = new WebSocket("wss://ai-interview-platform-production-9ae2.up.railway.app/ws/video");

    socketRef.current.onopen = () => {
      console.log("WebSocket Connected");
    };

    socketRef.current.onerror = (error) => {
      console.log("WebSocket Error:", error);
    };

    socketRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("LIVE DATA:", data);
      setAnalysis({
        eye_contact: data.eye_contact,
        confidence: data.confidence,
        engagement: data.engagement,
        speech: data.speech,
      });

      // AUTO SAVE INTERVIEW

    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

  }, []);

  // START CAMERA

  const startCamera = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // SEND FRAME EVERY SECOND

      intervalRef.current = setInterval(() => {
        sendFrame();
      }, 1000);
    } catch (err) {
      console.log(err);
      alert("Camera permission denied");
    }
  };

  // SEND VIDEO FRAME

  const sendFrame = () => {
    if (
      !videoRef.current ||
      !socketRef.current
    ) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current,0, 0);
    canvas.toBlob((blob) => {
  if (socketRef.current.readyState === 1) {
    const reader = new FileReader();
    reader.onloadend = () => {
      socketRef.current.send(reader.result);
    };

    reader.readAsDataURL(blob);
  }}, "image/jpeg");
  };

  // SAVE INTERVIEW

  const saveInterview = async (data) => {
    try {
      await fetch(
        'https://ai-interview-platform-production-9ae2.up.railway.app/save-interview',
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            user_email:
              sessionStorage.getItem('userEmail'),

            confidence: data.confidence,
            eye_contact: data.eye_contact,
            engagement: data.engagement,
            speech: data.speech,
            feedback: data.feedback
          })
        }
      );

      fetchHistory();

    } catch (err) {
      console.log(err);
    }
  };

  const endInterview = async () => {
    if(saved) return;

  // Generate AI feedback first
    const aiResponse = await fetch(
      "https://ai-interview-platform-production-9ae2.up.railway.app/generate-ai-feedback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
        confidence: analysis.confidence,
        eye_contact: analysis.eye_contact,
        engagement: analysis.engagement,
        speech: analysis.speech
      })
    }
  );

  const aiData = await aiResponse.json();

  // Save interview with AI feedback
  await saveInterview({
    confidence: analysis.confidence,
    eye_contact: analysis.eye_contact,
    engagement: analysis.engagement,
    speech: analysis.speech,
    feedback: aiData.feedback
  });

  await fetchHistory();
  alert("Interview Saved");
};

  // FETCH HISTORY

  const fetchHistory = async () => {
    try {
      const email = sessionStorage.getItem('userEmail');
      const res = await fetch(
        `https://ai-interview-platform-production-9ae2.up.railway.app/interview-history/${email}`
      );
      const data = await res.json();
      setInterviewHistory(data);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteInterview = async (id) => {
    try {
      await fetch(
        `https://ai-interview-platform-production-9ae2.up.railway.app/delete-interview/${id}`,
        {
          method: "DELETE"
        }
      );
      fetchHistory();
    } catch (err) {
      console.log(err);
      alert("Unable to delete interview");
    }
  };
  // LOGOUT

  const logout = () => {
    sessionStorage.clear();
    setLoggedIn(false);
  };

  // DOWNLOAD REPORT

  const downloadReport = () => {
    const email = sessionStorage.getItem('userEmail');
    window.open(
      `https://ai-interview-platform-production-9ae2.up.railway.app/generate-report/${email}`, '_blank'
    );
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h1 className="logo">
          AI Interview Coach
        </h1>

        <div className="menu-item" onClick={() => setCurrentPage("profile")}>
          Profile
        </div>

        <div className="menu-item" onClick={() => setCurrentPage("sessions")}>
          Interview Sessions
        </div>

        <div className="menu-item" onClick={() => setCurrentPage("resume")}>
          Resume Analysis
        </div>

        <div className="menu-item" onClick={() => setCurrentPage("feedback")}>
          AI Feedback
        </div>

        <div className="menu-item" onClick={() => setCurrentPage("mock")}>
          Mock Interview
        </div>

        <div className="menu-item" onClick={() => setCurrentPage("coding")}>
          Coding Interview
        </div>

        <div className="menu-item" onClick={() => setCurrentPage("progress")}>
          Progress
        </div>

        {/* HISTORY */}

        <div className="menu-item" onClick={() => setShowHistory(!showHistory)}>
          Interview History
        </div>

        {/* LOGOUT */}

        <div className="logout-button" onClick={logout}>
          Logout
        </div>

      </div>

      {/* MAIN */}

      <div className="main-content">
        {/* PROFILE */}

        <div className="profile-card">
          <div>
            <h2>
              Welcome Back, {userName} 👋
            </h2>

            <p className="profile-subtitle">
              AI Engineer • Interview Preparation Mode
            </p>

          </div>
          <div className="profile-avatar">
            {firstLetter}
          </div>

        </div>

        {/* TITLE */}

        <h1 className="dashboard-title">
          AI Interview Intelligence Dashboard
        </h1>

        {/* PDF */}

        <div className="resume-actions">
          <button className="report-button" onClick={downloadReport}>
            Download PDF Report
          </button>

          <button className="report-button" onClick={generateHRFeedback}>
            Generate HR Feedback
          </button>

          <button className="report-button" onClick={endInterview} disabled={saved}>
            {saved ? "Saved" : "End Interview"}
          </button>
        </div>

        {/* HISTORY */}

        {
          showHistory && (
            <div className="history-box">
              <h2>
                Interview History
              </h2>

              {
                interviewHistory.map((item, index) => (
                  <div key={index} className="history-card">
                    <h3>
                      {
                        new Date(item.created_at).toLocaleDateString("en-GB", {timeZone: "Asia/Kolkata"})
                      }
                    </h3>

                    <p>
                      Confidence: {item.confidence}%
                    </p>

                    <p>
                      Eye Contact: {item.eye_contact}%
                    </p>

                    <p>
                      Engagement: {item.engagement}%
                    </p>

                    <p>
                      Focus Score: {item.speech}%
                    </p>

                    <button className="delete-btn" onClick={() => deleteInterview(item.id)}>
                      Delete Interview
                    </button>
                  </div>
                ))
              }
            </div>
          )
        }

        {/* TOP */}

        <div className="top-section">
          {/* VIDEO */}
          <div className="video-panel">

            <h2>
              Live Interview Analysis
            </h2>

            <video ref={videoRef} autoPlay muted playsInline className="video-feed"/>
          </div>

          {/* SCORES */}
          <div className="score-panel">
            <div className="card">
              <h2>
                Eye Contact
              </h2>

              <h1>
                {analysis.eye_contact}%
              </h1>

            </div>

            <div className="card">
              <h2>
                Confidence
              </h2>

              <h1>
                {analysis.confidence}%
              </h1>

            </div>

            <div className="card">
              <h2>
                Engagement
              </h2>

              <h1>
                {analysis.engagement}%
              </h1>

            </div>

            <div className="card">
              <h2>
                Focus Score
              </h2>

              <h1>
                {analysis.speech}%
              </h1>

            </div>
          </div>
        </div>
        {/* GRAPH */}

        <div className="analytics-section">
          <h2>
            Performance Analytics
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="confidence" stroke="#4ade80" strokeWidth={3}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {
          hrFeedback && (
            <div className="hr-feedback-card">
              <h2>
                HR Feedback Report
              </h2>

              <h3>
                Overall Score:
                {hrFeedback.overall_score}/100
              </h3>

              <h3>Strengths</h3>
                <ul> {
                  hrFeedback.strengths.map(
                    (item, index) => (
                      <li key={index}>
                        ✅ {item}
                      </li>
                    )
                  )
                }
                </ul>

              <h3>Areas of Improvement</h3>
                <ul> {
                  hrFeedback.improvements.map(
                    (item, index) => (
                      <li key={index}>
                        ⚠️ {item}
                      </li>
                    )
                  )
                }
                </ul>

              <h3>
                Recommendation:
              </h3>

               <p>
              {
                hrFeedback.recommendation
               }
              </p>

            </div>
          )
        }

        {/* BOTTOM */}

        <div className="bottom-section">
          <div className="feedback-box">

            <h2>
              Feedback
            </h2>

            <ul className="feedback-list">

              <li>
                Good confidence during interview
              </li>

              <li>
                Maintain stronger eye contact
              </li>

              <li>
                Improve structured answers
              </li>

              <li>
                Communication clarity is excellent
              </li>

              <li>
                Try STAR method for behavioral answers
              </li>

            </ul>

          </div>

          {/* TRANSCRIPT */}

          <div className="transcript-box">

            <h2>
              Interview Transcript
            </h2>

            <div className="transcript-content">

              <p>
                <strong>
                  Interviewer:
                </strong>

                Tell me about yourself.
              </p>

              <p>
                <strong>
                  You:
                </strong>

                I am a final year Information Technology student
                passionate about AI systems and software engineering...
              </p>

              <p>
                <strong>
                  Interviewer:
                </strong>

                Explain your AI project.
              </p>

              <p>
                <strong>
                  You:
                </strong>

                I developed an AI-powered interview intelligence
                platform using OpenCV, FastAPI, NLP and React...
              </p>
            </div>
          </div>
        </div>
      </div>
      {
        showChatbot &&
        <Chatbot />
      }
      <button className="chatbot-float" onClick={() => setShowChatbot(
            !showChatbot
          )
        }>
        💬
      </button>
    </div>
  );
}

export default Dashboard;