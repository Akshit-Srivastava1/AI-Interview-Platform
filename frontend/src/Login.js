import React, { useState } from 'react';
import axios from 'axios';

import './Login.css';

function Login({ setLoggedIn, setIsLogin }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post( 'https://ai-interview-platform-6ftz.onrender.com/login', { email, password});
      console.log("LOGIN RESPONSE:", res.data);
      
      if (!res.data.access_token) {
        alert("Invalid credentials");
        return;
      }
      sessionStorage.setItem('token',res.data.access_token);
      sessionStorage.setItem('userName',res.data.firstName);
      sessionStorage.setItem('userEmail',email);
      sessionStorage.setItem('lastName',res.data.lastName);
      // LOGIN SUCCESS

      setLoggedIn(true);
    } catch (err) {
      alert(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      login();
    }
  };

  return (

    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">
          Login
        </h1>

        {/* EMAIL */}

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyPress} className="auth-input"/>

        {/* PASSWORD */}

        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyPress} className="auth-input"/>

        {/* LOGIN BUTTON */}

        <button onClick={login} className="auth-button" disabled={loading}>
          {
            loading
              ? 'Logging in...'
              : 'Login'
          }

        </button>

        {/* SIGNUP SWITCH */}

        <p onClick={() => setIsLogin(false)} className="auth-switch">
          Don't have an account? Signup
        </p>
      </div>
    </div>
  );
}

export default Login;