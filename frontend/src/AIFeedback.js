import React, { useEffect, useState } from "react";
import "./AIFeedback.css";

function AIFeedback({ setCurrentPage }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const email = sessionStorage.getItem("UserEmail");
        const response = await fetch(
          `https://ai-interview-platform-production-9ae2.up.railway.app/interview-history/${email}`
        );

        const data = await response.json();

        setFeedback(data);
      } catch (error) {
        console.log("Feedback Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, []);

  return (
    <div className="feedback-page">
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ← Dashboard
      </button>

      <h1>🤖 AI Feedback</h1>

      {loading ? (
        <div className="empty-card">Loading feedback...</div>
      ) : (
        <div className="feedback-container">
          {feedback.length === 0 ? (
            <div className="empty-card">
              No feedback available yet.
            </div>
          ) : (
            feedback.map((item, index) => (
              <div key={index} className="feedback-card">
                <h3>Interview #{index + 1}</h3>
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
                    {item.feedback || "No AI feedback generated for this interview."}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AIFeedback;