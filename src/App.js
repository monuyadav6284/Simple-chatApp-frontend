import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css"; // Import custom CSS for WhatsApp-like styling

const socket = io("http://localhost:3000");

const App = () => {
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(""); 

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to the server");
      setCurrentUser(socket.id); 
    });

    socket.on("users", (users) => {
      setUsers(users);
      setUserCount(users.length);
      console.log(`Total users connected: ${users.length}`);
    });

    // Listen for new messages
    socket.on("message", (data) => {
      setMessages((prevMessages) => {
        // Check if the message is already in the state
        const messageExists = prevMessages.some(
          (msg) =>
            msg.message === data.message &&
            msg.from === data.from &&
            msg.to === data.to
        );
        if (!messageExists) {
          return [...prevMessages, data];
        }
        return prevMessages;
      });
    });

    // Cleanup on component unmount
    return () => {
      socket.off("connect");
      socket.off("users");
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "" && recipient.trim() !== "") {
      // Add the sent message to local state immediately
      const newMessage = { from: currentUser, to: recipient, message };
      setMessages((prevMessages) => [...prevMessages, newMessage]);

      // Emit the message to the server
      socket.emit("message", newMessage);

      // Clear the message input field
      setMessage("");
    }
  };

  return (
    <div className="app">
      <div className="users">
        <p>Total users connected: {userCount}</p>
        <p>Online users:</p>
        <ul>
          {users.map((user) => (
            <li key={user} className="user">
              <div className="avatar"></div>
              <span>{user}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="chat">
        <div className="message-list">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.from === currentUser ? "sent" : "received"
              }`}
            >
              <div className="bubble">{msg.message}</div>
            </div>
          ))}
        </div>
        <div className="message-input">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient User ID"
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default App;
