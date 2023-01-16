import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useAuth } from "../../contexts/authentication/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { UseConversations } from "../../contexts/Conversations/ConversationsContext";

import "./Navbar.css"



export default function Navbar() {
  const { logout, userFirstName, userProfileImageLink, clearStates } =
    useAuth();


  const {sendLastSeenData} = UseConversations();

  const [error, setError] = useState(""); //idk maybe display this somewhere later?
  const navigate = useNavigate();

  const navBarRef = useRef();


  async function handleLogout() {
    sendLastSeenData();
    clearStates();
    navigate("/login");
    window.location.reload();
    try {
      await logout();
    } catch {
      setError("failed to log out");
    }
  }

  return (
    <div className="navbar" ref={navBarRef}>
      <Link to="/">
        <h2 style={{ color: "white" }}>Productivity App</h2>
      </Link>
      <button onClick={handleLogout}>Log Out</button>

      <Link to="profile">
        <div className="profileButtonDiv">
          <p>{userFirstName}</p>
          <img className="userIcon" src={userProfileImageLink} alt=""></img>
        </div>
      </Link>
    </div>
  );
}
