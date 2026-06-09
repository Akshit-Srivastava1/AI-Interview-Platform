import React, { useEffect, useState } from "react";
import "./Progress.css";

function Progress({ setCurrentPage }) {
  const [stats, setStats] = useState({
    total_interviews: 0,
    confidence: 0,
    eye_contact: 0,
    engagement: 0,
    speech: 0
  });

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    fetch(
      `https://ai-interview-platform-production-9ae2.up.railway.app/interview-history/${email}`
    )
      .then(res => res.json())
      .then(data => {

        if (!data.length) return;
        const total = data.length;
        const confidence =
          Math.round(data.reduce((sum, item) =>sum + item.confidence,0) / total);

        const eyeContact =
          Math.round(data.reduce((sum, item) => sum + item.eye_contact,  0) / total);

        const engagement =
          Math.round(data.reduce((sum, item) =>sum + item.engagement,0) / total);

        const speech =
          Math.round(
            data.reduce((sum, item) =>sum + item.speech,0) / total);

        setStats({
          total_interviews: total,
          confidence,
          eye_contact: eyeContact,
          engagement,
          speech
        });

      })
      .catch(err =>
        console.log(err)
      );

  }, []);
  return (
    <div className="progress-page">
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")} >
        ← Dashboard
      </button>

      <h1>
        📈 Progress Tracker
      </h1>

      <div className="stats-grid">

        <div className="stat-card">
          <h2>
            {stats.total_interviews}
          </h2>
          <p>
            Total Interviews
          </p>
        </div>

        <div className="stat-card">
          <h2>
            {stats.confidence}%
          </h2>
          <p>
            Avg Confidence
          </p>
        </div>

        <div className="stat-card">
          <h2>
            {stats.eye_contact}%
          </h2>
          <p>
            Avg Eye Contact
          </p>
        </div>

      </div>

      <div className="progress-card">
        <h3>Confidence</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{width: `${stats.confidence}%`}} ></div>
        </div>

        <h3>Eye Contact</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.eye_contact}%`}}></div>
        </div>

        <h3>Engagement</h3>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${stats.engagement}%`}}></div>
        </div>

        <h3>Speech</h3>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.speech}%`}}></div>
        </div>

      </div>
    </div>
  );
}

export default Progress;