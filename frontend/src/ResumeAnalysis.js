import React, { useState } from "react";
import "./ResumeAnalysis.css";

function ResumeAnalysis({ setCurrentPage }) {
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setResumeData(null);

    try {
      const response = await fetch(
        "https://ai-interview-platform-production-9ae2.up.railway.app/parse-resume",
        {
          method: "POST",
          body: formData
        }
      );
      const data = await response.json();
      setResumeData(data);
    } catch (error) {
      console.log(error);
      alert("Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-page">
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ← Dashboard
      </button>

      <h1>
        📄 Resume Analysis
      </h1>

      <div className="upload-card">
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload}/>
      </div>

      {loading && (
        <div className="analysis-card loading-card">
          <div className="loader"></div>
          <h2>
            🤖 Analyzing Resume...
          </h2>
          <p>
            Calculating ATS Score
          </p>

          <p>
            Extracting Skills
          </p>

          <p>
            Finding Strengths
          </p>

          <p>
            Generating Improvements
          </p>

          <p>
            Please wait...
          </p>

        </div>
      )}

      {!loading && resumeData && (
        <div className="analysis-card">
          <div className="ats-score">
            <h2>
              ATS Score
            </h2>

            <h1>
              {resumeData.ats_score}%
            </h1>

          </div>

          <div className="section">
            <h2>
              Skills Detected
            </h2>

            <div className="skills-container">
              {resumeData.skills?.map(
                (skill, index) => (
                  <span key={index} className="skill-badge" >
                    {skill}
                  </span>

                )
              )}
            </div>
          </div>

          <div className="section">
            <h2>
              Strengths
            </h2>

            <ul>
              {resumeData.strengths?.map(
                (item, index) => (
                  <li key={index}>
                    ✅ {item}
                  </li>

                )
              )}

            </ul>
          </div>

          <div className="section">
            <h2>
              Improvements
            </h2>

            <ul>
              {resumeData.improvements?.map( (item, index) => (
                  <li key={index}>
                    ⚠️ {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeAnalysis;