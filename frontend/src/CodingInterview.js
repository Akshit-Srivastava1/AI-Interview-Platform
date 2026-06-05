import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./CodingInterview.css";

function CodingInterview({ setCurrentPage }) {

  const [question, setQuestion] = useState({});
  const [code, setCode] = useState(
`# Write your solution here

def solve():
    pass

solve()
`
  );

  const [output, setOutput] = useState("");
  const [review, setReview] = useState(null);

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {

    try {
      const res = await fetch(
        "https://ai-interview-platform-6ftz.onrender.com/coding-question"
      );

      const data = await res.json();
      setQuestion(data);

    } catch (err) {
      console.log(err);
    }
  };

  const runCode = async () => {
    try {
      const res = await fetch(
        "https://ai-interview-platform-6ftz.onrender.com/run-code",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            language: "python",
            code
          })
        }
      );

      const data = await res.json();
      setOutput(
        data.output || "No Output"
      );

    } catch (err) {
      console.log(err);
      setOutput(
        "Execution Error"
      );
    }
  };

  const reviewCode = async () => {
    try {
      const res = await fetch(
        "https://ai-interview-platform-6ftz.onrender.com/review-code",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            code
          })
        }
      );

      const data = await res.json();
      setReview(data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="coding-page">
      <div className="coding-header">
        <h1>
          Coding Interview Mode
        </h1>

        <button className="back-btn" onClick={() =>setCurrentPage("dashboard")}>
          Back
        </button>

      </div>
      <div className="question-card">
        <h2>
          {question.title}
        </h2>

        <p>
          Difficulty:
          {" "}
          {question.difficulty}
        </p>

        <p>
          {question.question}
        </p>

      </div>

      <div className="editor-card">
        <Editor
          height="500px"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(value) =>
            setCode(value)
          }
        />

      </div>

      <div className="action-buttons">

        <button className="run-btn" onClick={runCode}>
          Run Code
        </button>

        <button className="submit-btn" onClick={reviewCode}>
          Submit Solution
        </button>

      </div>

      <div className="output-card">
        <h2>
          Output
        </h2>

        <pre>
          {output}
        </pre>

      </div>

      {
        review && (
          <div className="review-card">
            <h2>
              AI Code Review
            </h2>

            <h1>
              Score:
              {" "}
              {review.score}/100
            </h1>

            <p>

              <strong>
                Time Complexity:
              </strong>
              {" "}
              {review.complexity}

            </p>

            <h3>
              Feedback
            </h3>

            <ul>
              {
                review.feedback.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>

                  )
                )
              }

            </ul>
          </div>
        )
      }
    </div>
  );
}

export default CodingInterview;