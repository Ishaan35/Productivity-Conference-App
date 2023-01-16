import React, { useEffect, useState } from "react";
import "./Conversations.css";
import { UseConversations } from "../../../contexts/Conversations/ConversationsContext";
import ConversationListItem from "../../../components/ConversationItem/ConversationListItem";
import NewConversationModal from "../../../components/NewConversationModal/NewConversationModal";
import MessagesWindow from "../../../components/MessagesWindow/MessagesWindow";

export default function Conversations() {
  const {
    getAllConversations,
    allConversations,
    selectedConversation,
    setSelectedConversation,
    loading,
  } = UseConversations();

  const [newConversationUsers, setNewConversationUsers] = useState([]); //array of user emails who will be added to the chat

  const [creatingNewConversation, setCreatingNewConversation] = useState(false);
  return (
    <>
      <div className="mainConversationsComponentContainer">
        {loading && <h1>Loading Conversations</h1>}

        <div className="conversationsListDisplay">
          <button
            onClick={() => setCreatingNewConversation(true)}
            disabled={loading}
          >
            Create Conversation
          </button>
          <br></br>
          <br></br>
          <p style={{ textDecoration: "underline" }}>Your Chats:</p>
          {!loading &&
            allConversations &&
            allConversations.map((conv) => {
              console.log(conv)
              return (
                <ConversationListItem
                  name={conv.name}
                  uid={conv.uid}
                  setSelectedConversation={setSelectedConversation}
                  key={conv.uid}
                  selectedConversation={selectedConversation}
                  newMessageOpened={conv.newMessageOpened}
                  preview={conv.preview ? conv.preview : ""}
                ></ConversationListItem>
              );
            })}
        </div>

        {selectedConversation && (
          <div className="messagesWindow">
            <MessagesWindow></MessagesWindow>
          </div>
        )}

        {creatingNewConversation && (
          <NewConversationModal
            setCreatingNewConversation={setCreatingNewConversation}
          ></NewConversationModal>
        )}
      </div>
    </>
  );
}
