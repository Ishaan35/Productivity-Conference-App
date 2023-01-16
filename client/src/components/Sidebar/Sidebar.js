import React, { useEffect, useState } from "react";
import {Link } from 'react-router-dom'
import "./Sidebar.css";
import { UseConversations } from "../../contexts/Conversations/ConversationsContext";

export default function Sidebar({ navbarHeightState }) {


  const { allConversations } = UseConversations();

  const [newMessages, setNewMessages] = useState(false);

  useEffect(() =>{
    if(allConversations){
      for (let i = 0; i < allConversations.length; i++) {
        if (!allConversations[i].newMessageOpened) {
          setNewMessages(true);
          break;
        }
      }
    }
    
  })

    
  return (
    <div className="sidebarContainer">
      <div className="linkListSidebar">
        <Link to="conversations">
          Conversations
          {newMessages && (
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "red",
              }}
            ></div>
          )}
        </Link>
        <Link to="forms">
          Build Forms
        </Link>

        {/* <Link to="video-conference-home">
          Video Chat
        </Link> */}
      </div>
    </div>
  );
}
