import React, {useState, useRef, useEffect} from "react";

import "./Chatbot.css";
import ReactMarkdown from "react-markdown";

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi 👋 I'm your AI Interview Coach. Ask me anything."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth"
      });
  }, [messages, loading]);
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = {
      role: "user",
      text: input
    };

    setMessages(prev => [
      ...prev,
      userMessage
    ]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch(
        "https://ai-interview-platform-6ftz.onrender.com/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message: input
          })
        }
      );

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: data.response
        }
      ]);

    } catch (error) {

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text:
            "❌ Unable to connect to AI Coach."
        }
      ]);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        🤖 AI Interview Coach
      </div>

      <div className="chatbot-messages">

        {
          messages.map(
            (msg, index) => (

              <div key={index} className={
                  msg.role === "user"
                    ? "user-message"
                    : "bot-message"
                }
              >

                {
                  msg.role === "user"
                    ? msg.text
                    : (
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    )
                }
              </div>
            )
          )
        }

        {
            loading && (
                <div className="bot-message typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            )
        }

        <div ref={messagesEndRef}></div>
      </div>

      <div className="chatbot-input">

        <input type="text" placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}/>

       <button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;