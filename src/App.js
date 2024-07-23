import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3000");

const App = () => {
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState("");

  console.log("users ", users);

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

    socket.on("message", (data) => {
      setMessages((prevMessages) => {
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

    socket.on("groupUpdate", (data) => {
      setGroups((prevGroups) => {
        const groupExists = prevGroups.some((grp) => grp.group === data.group);
        if (!groupExists) {
          return [...prevGroups, { group: data.group, members: data.members }];
        }
        return prevGroups.map((grp) =>
          grp.group === data.group ? { ...grp, members: data.members } : grp
        );
      });
    });

    return () => {
      socket.off("connect");
      socket.off("users");
      socket.off("message");
      socket.off("groupUpdate");
    };
  }, []);

  const sendMessage = () => {
    if (
      message.trim() !== "" &&
      (recipient.trim() !== "" || currentGroup.trim() !== "")
    ) {
      const newMessage = currentGroup
        ? { from: currentUser, to: currentGroup, message, type: "group" }
        : { from: currentUser, to: recipient, message, type: "direct" };

      setMessages((prevMessages) => [...prevMessages, newMessage]);

      socket.emit("message", newMessage);

      setMessage("");
    }
  };

  const joinGroup = () => {
    if (group.trim() !== "") {
      socket.emit("joinGroup", { group });
      setCurrentGroup(group);
      setGroup("");
    }
  };

  const leaveGroup = () => {
    if (currentGroup.trim() !== "") {
      const confirmation = window.confirm(
        "Are you sure you want to leave the group?"
      );
      if (confirmation) {
        socket.emit("leaveGroup", { group: currentGroup });
        setCurrentGroup("");
      }
    }
  };

  return (
    <div className="app container">
      <div className="users">
        <p className=" py-2 px-3  text-white bg-green-700 rounded-xl m-4">
          Total users connected: {userCount}
        </p>
        <p className="py-2 px-3  text-white bg-green-700 rounded-xl m-4">
          Online users:
        </p>
        <ul>
          {users.map((user) => (
            <li
              key={user}
              className={user === currentUser ? "current-user" : "user"}
            >
              <span>{user}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="groups ">
        <ul>
          {groups.map((grp, index) => (
            <li key={index} className="group">
              <span>{grp.group}</span>
              <ul>
                {grp.members.map((member) => (
                  <li key={member} className="member">
                    <div className="avatar"></div>
                    <span>{member}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Group Name"
          className="outline-none text-3xl px-3 py-2"
        />
        <button
          onClick={joinGroup}
          className="py-2 px-3  text-white bg-green-700 rounded-xl m-4"
        >
          Join Group
        </button>
        <button
          onClick={leaveGroup}
          className="py-2 px-3  text-white bg-red-600 rounded-xl hover:bg-gray-700 m-4"
        >
          Leave Group
        </button>
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
            placeholder="Recipient User ID "
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message......"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default App;
