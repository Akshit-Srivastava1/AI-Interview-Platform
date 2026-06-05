import React, { useState } from 'react';

import Dashboard from './Dashboard';
import Login from './Login';
import Signup from './Signup';
import CodingInterview from './CodingInterview';

import Profile from './Profile';
import ResumeAnalysis from './ResumeAnalysis';
import AIFeedback from './AIFeedback';
import MockInterview from './MockInterview';
import Progress from './Progress';
import InterviewSessions from './InterviewSessions';

function App() {

  const [loggedIn, setLoggedIn] = useState(
    sessionStorage.getItem('token')
      ? true
      : false
  );

  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] =
    useState("dashboard");

  if (!loggedIn) {
    return isLogin ? (
      <Login setLoggedIn={setLoggedIn} setIsLogin={setIsLogin}/>
    ) : (
      <Signup setIsLogin={setIsLogin}/>
    );
  }

  switch (currentPage) {
    case "coding":
      return (
        <CodingInterview setCurrentPage={setCurrentPage}/>
      );

    case "profile":
      return (
        <Profile setCurrentPage={setCurrentPage}/>
      );

    case "resume":
      return (
        <ResumeAnalysis setCurrentPage={setCurrentPage}/>
      );

    case "feedback":
      return (
        <AIFeedback setCurrentPage={setCurrentPage}/>
      );

    case "mock":
      return (
        <MockInterview setCurrentPage={setCurrentPage}/>
      );

    case "progress":
      return (
        <Progress setCurrentPage={setCurrentPage}/>
      );

    case "sessions":
      return (
        <InterviewSessions setCurrentPage={setCurrentPage}/>
      );

    default:
      return (
        <Dashboard setLoggedIn={setLoggedIn} setCurrentPage={setCurrentPage}/>
      );
  }
}

export default App;