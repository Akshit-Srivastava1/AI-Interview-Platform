import React, { useState } from "react";
import "./MockInterview.css";

function MockInterview({ setCurrentPage }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const generateQuestion = async () => {
    try {
      const response = await fetch(
        "https://ai-interview-platform-6ftz.onrender.com/mock-question"
      );
      const data = await response.json();
      setQuestion(data.question);
      setFeedback("");
      setAnswer("");

    } catch (error) {
      console.log(error);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    try {
      const response = await fetch(
        "https://ai-interview-platform-6ftz.onrender.com/mock-feedback",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question, answer
          })
        }
      );

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="mock-page">
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ← Dashboard
      </button>

      <h1>🎤 Mock Interview</h1>

      <button className="generate-btn" onClick={generateQuestion}>
        Generate Question
      </button>

      {
        question && (
          <div className="question-card">
            <h2>
              Interview Question
            </h2>

            <p>
              {question}
            </p>

          </div>

        )
      }

      {
        question && (
          <div className="answer-card">
            <textarea placeholder="Write your answer here..." value={answer} onChange={(e) => setAnswer( e.target.value)}/>

            <button className="submit-btn" onClick={submitAnswer}>
              Get AI Feedback
            </button>

          </div>
        )
      }

      {
        feedback && (
          <div className="feedback-card">
            <h2>
              AI Feedback
            </h2>

            <p>
              {feedback}
            </p>
          </div>
        )
      }
    </div>
  );
}

export default MockInterview;