import React, { useState } from 'react';
import axios from 'axios';

import './Signup.css';

function Signup({ setIsLogin }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+91',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationMethod: 'email'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const signup = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please fill all fields");
      return;
    }

    if (formData.phone.length < 10) {
      alert("Invalid phone number");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password should be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        'https://ai-interview-platform-6ftz.onrender.com/register',
        formData
      );

      alert(`Verification OTP sent to your ${formData.verificationMethod}`);
      setIsLogin(true);

    } catch (err) {
    console.log(err);
  alert(
    err.response?.data?.error ||
    "Signup failed"
    );
    }finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      signup();
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-box">
        <h1 className="auth-title">
          Create Account
        </h1>

        {/* FIRST + LAST NAME */}

        <div className="row">
          <input type="text" placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onKeyDown={handleKeyPress} className="auth-input"/>
          <input type="text" placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onKeyDown={handleKeyPress} className="auth-input"/>

        </div>
        {/* PHONE */}
        <div className="row">
          <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="country-code">
            <option value="+91">+91</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
          </select>

          <input type="text" placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} onKeyDown={handleKeyPress} className="auth-input"/>
        </div>

        {/* EMAIL */}
        <input type="email" placeholder="Email Address" name="email" value={formData.email} onChange={handleChange} onKeyDown={handleKeyPress} className="auth-input full-width"/>

        {/* PASSWORD */}
        <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} onKeyDown={handleKeyPress} className="auth-input full-width"/>
        <input type="password" placeholder="Verify Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onKeyDown={handleKeyPress} className="auth-input full-width"/>

        {/* VERIFICATION METHOD */}
        <div className="verification-box">
          <p>Choose Verification Method</p>
          <div className="verification-options">
            <label>
              <input type="radio" name="verificationMethod" value="email" checked={formData.verificationMethod === 'email'} onChange={handleChange}/>
              Email OTP

            </label>

            <label>
              <input type="radio" name="verificationMethod" value="phone" checked={formData.verificationMethod === 'phone'} onChange={handleChange}/>
              Phone OTP

            </label>
          </div>
        </div>

        {/* BUTTON */}

        <button onClick={signup} className="auth-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* LOGIN */}

        <p onClick={() => setIsLogin(true)} className="auth-switch">
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Signup;