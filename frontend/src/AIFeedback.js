import React, { useEffect, useState } from "react";
import "./AIFeedback.css";

function AIFeedback({ setCurrentPage }) {
  const [feedback, setFeedback] = useState([]);
  useEffect(() => {
    fetch(
      `https://ai-interview-platform-6ftz.onrender.com/interview-history/${
        sessionStorage.getItem("UserEmail")
      }`
    )
      .then(res => res.json())
      .then(data => {
        setFeedback(data);
      })
      .catch(err => console.log(err));

  }, []);
  return (
    <div className="feedback-page">

      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ← Dashboard
      </button>

      <h1>🤖 AI Feedback</h1>

      <div className="feedback-container">
        {
          feedback.length === 0 ? (

            <div className="empty-card">
              No feedback available yet.
            </div>
          ) : (
            feedback.map((item, index) => (
              <div key={index} className="feedback-card">
                <h3>
                  Interview #{index + 1}
                </h3>

                <div className="score-grid">

                  <div className="score-box">
                    <span>Confidence</span>
                    <h2>{item.confidence}%</h2>
                  </div>

                  <div className="score-box">
                    <span>Eye Contact</span>
                    <h2>{item.eye_contact}%</h2>
                  </div>

                  <div className="score-box">
                    <span>Engagement</span>
                    <h2>{item.engagement}%</h2>
                  </div>

                  <div className="score-box">
                    <span>Speech</span>
                    <h2>{item.speech}%</h2>
                  </div>

                </div>

                <div className="feedback-text">
                  <h4>AI Suggestions</h4>

                  <p>
                    {item.feedback}
                  </p>

                </div>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
}

export default AIFeedback;