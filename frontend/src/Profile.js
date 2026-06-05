import React, { useEffect, useState } from "react";
import "./Profile.css";

function Profile({ setCurrentPage }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("https://ai-interview-platform-6ftz.onrender.com/profile", {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
      })
      .catch(err => {
        console.log(err);
      });

  }, []);

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ← Dashboard
      </button>

      <div className="user-profile-card">
        <div className="user-profile-left">
          <div className="user-profile-avatar">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : "A"}
          </div>

          <div className="user-profile-details">
            <h1>
              {user?.name || "Loading..."}
            </h1>

            <p>
              AI Interview Platform User
            </p>

          </div>
        </div>

        <div className="user-profile-right">
          <div className="info-box">
            <span>Name</span>
            <h3>
              {user?.name || "Loading..."}
            </h3>
          </div>

          <div className="info-box">
            <span>Email</span>
            <h3>
              {user?.email || "Loading..."}
            </h3>
          </div>

          <div className="info-box">
            <span>Account Status</span>
            <h3>Active</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;