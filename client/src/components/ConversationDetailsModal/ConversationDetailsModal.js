import React, { useEffect, useState } from "react";
import ReactDom from "react-dom";


import "./ConversationDetailsModal.css";

import { UseConversations } from "../../contexts/Conversations/ConversationsContext";
import { useAuth } from "../../contexts/authentication/AuthContext";

export default function ConversationDetailsModal({
  setViewingConversationDetails,
}) {
  const {
    currentConversationUsers,
    currentConversationName,
    currentConversationAdmin,
    getConversationUsersFromEmails,
    leaveConversation,
    selectedConversation,
  } = UseConversations();
  const {currentUser} = useAuth()

  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() =>{

    async function getUsers(){
        if (currentConversationUsers) {
            if(!currentConversationUsers[0].profile_image){
                setLoading(true);
                let userEmails = [];
                for (let i = 0; i < currentConversationUsers.length; i++) {
                  userEmails.push(currentConversationUsers[i].email);
                }
                await getConversationUsersFromEmails(userEmails);
                setLoading(false);
            }     
        }
    }
    getUsers();
    
  }, [])

  const leaveConversationProcess = () =>{
    setLoading(true);
    leaveConversation(selectedConversation);
  }
  return ReactDom.createPortal(
    <div className="newConversationModalContainer">
      <div className="modalContent">
        <span
          className="close"
          onClick={() => setViewingConversationDetails(false)}
        >
          &times;
        </span>
        {loading && <h1>Loading...</h1>}
        {currentConversationUsers &&
          currentConversationName &&
          currentConversationAdmin &&
          !loading && (
            <div>
              <h1>{currentConversationName}</h1>
              <div className="userList">
                {currentConversationUsers.map((user) => (
                  <li key={user.email}>
                    <img
                      src={user.profile_image}
                      alt={`${user.first_name}'s profile pic`}
                      style={{ width: "50px", height: "50px" }}
                    ></img>
                    {`${user.first_name} ${user.last_name}, ${user.email}`}

                    {currentUser.email === currentConversationAdmin && user.email !== currentUser.email && (
                      <button>X</button>
                    )}
                  </li>
                ))}
              </div>
              <br></br>
              <button onClick={() => setConfirmDelete(true)}>Leave</button>
            </div>
          )}
      </div>

      <div className="confirmationLeaveModal" hidden={!confirmDelete}>
        <div className="confirmationLeaveModalContent">
          <div style={{ textAlign: "center" }}>
            <p>Are you sure you want to leave </p>
            <b>{currentConversationName}</b> ?
          </div>

          <button onClick={leaveConversationProcess} disabled={loading}>
            Yes
          </button>
          <button onClick={() => setConfirmDelete(false)} disabled={loading}>
            No
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("conversationPortal")
  );
}
