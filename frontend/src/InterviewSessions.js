import React, { useEffect, useState } from "react";
import "./InterviewSessions.css";

function InterviewSessions({ setCurrentPage }) {
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    const email = sessionStorage.getItem(
    "userEmail"
    );
    fetch(`https://ai-interview-platform-6ftz.onrender.com/interview-history/${email}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  return (
    <div className="sessions-page">
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ← Dashboard
      </button>

      <h1>📅 Interview Sessions</h1>

      <div className="sessions-container">
        {
          sessions.length === 0 ? (
            <div className="empty-card">
              No interview sessions found.
            </div>

          ) : (
            sessions.slice(-10).reverse().map((session, index) => (
              <div key={index} className="session-card">

                <h3>
                  Session #{index + 1}
                </h3>

                <p>
                  <strong>Date:</strong>{" "}
                    {session.created_at ? new Date(session.created_at).toLocaleDateString(): "N/A"}
                </p>

                <p>
                  <strong>Confidence:</strong>{" "}
                  {session.confidence}%
                </p>

                <p>
                  <strong>Eye Contact:</strong>{" "}
                  {session.eye_contact}%
                </p>

                <p>
                  <strong>Speech Clarity:</strong>{" "}
                  {session.speech}%
                </p>

              </div>
            ))
          )
        }
      </div>
    </div>
  );
}

export default InterviewSessions;