import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/authentication/AuthContext";
import "./NewConversationModal.css";
import uuid from "react-uuid";
import { UseConversations } from "../../contexts/Conversations/ConversationsContext";
import ReactDom from "react-dom";

export default function NewConversationModal({ setCreatingNewConversation }) {
  const currentUserAddingRef = useRef();
  const conversationNameRef = useRef();
  const {currentUser} = useAuth();

  const [addedUsers, setAddedUsers] = useState([]);
  const [stateLoad, setStateLoad] = useState(false);
  const [error, setError] = useState("");

  const { createNewConversation } = UseConversations();
  const [loading, setLoading] = useState(false);

  const addUserToList = (e) => {
    let user = currentUserAddingRef.current.value;
    if (user.trim() !== "" && validateEmail(user)) {
      if (!addedUsers.includes(user)) {
        if (
          currentUser &&
          currentUser.email.toLowerCase() !== user.toLowerCase()
        ) {
          setError("");
          let updatedArr = [...addedUsers, user.toLowerCase()];
          currentUserAddingRef.current.value = "";
          setAddedUsers(updatedArr);
        } else {
          setError("Cannot add yourself as a recipient");
        }
        
      }
    } else {
      setError("Enter a valid email address");
    }
  };

  useEffect(() => {
    setStateLoad(false);
  }, [addedUsers]);

  //retreved from stackoverflow
  function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  const deleteUser = (user) => {
    let copy = [...addedUsers];
    var index = copy.indexOf(user);
    if (index !== -1) {
      copy.splice(index, 1);
      setAddedUsers(copy);
    }
  };

  const createConversation = async () => {
    if (addedUsers.length < 1) {
      setError("Enter at least one recipient");
    } else if (conversationNameRef.current.value.trim() === "") {
      setError("Enter a name for the conversation");
    } else {
      setLoading(true);
      setStateLoad(true);
      let data = await createNewConversation(
        conversationNameRef.current.value,
        uuid(),
        [...addedUsers]
      );
      if (!data.error) {
        setLoading(false);
        setCreatingNewConversation(false);
      } else {
        setError(
          "There was an error when processing your request. Please refresh the page and try again. " +
            data.error
        );
        console.log(data.error);
      }
    }
  };

  const validateName = (e) => {
    let str = e.target.value;
    if (
      str.indexOf("'") >= 0 ||
      str.indexOf('"') >= 0 ||
      str.indexOf("/") >= 0 ||
      str.indexOf('`') >= 0
    ) {
      str = str.replace(/'/g, "");
      str = str.replace(/"/g, "");
      str = str.replace(/\//g, "");
      str = str.replace(/`/g, "");

      conversationNameRef.current.value = str;
    }
  };

  return ReactDom.createPortal(
    <div className="newConversationModalContainer">
      <div className="modalContent">
        <span
          className="close"
          onClick={() => setCreatingNewConversation(false)}
        >
          &times;
        </span>
        <p>New Conversation</p>

        {loading && <h2>Loading...</h2>}

        <input
          placeholder="conversation name"
          ref={conversationNameRef}
          disabled={loading}
          onChange={validateName}
        ></input>
        <br></br>
        <input
          placeholder="add user by email"
          ref={currentUserAddingRef}
          disabled={loading}
        ></input>
        <button onClick={addUserToList} disabled={stateLoad || loading}>
          Add User
        </button>
        <label>{error}</label>
        <br></br>
        <br></br>
        <div className="usersToAdd">
          {addedUsers.map((user) => (
            <div className="addedUserItem" key={user}>
              {user}
              <button
                className="deleteUserBtn"
                onClick={() => deleteUser(`${user}`)}
              >
                X
              </button>
            </div>
          ))}
        </div>

        <br></br>
        <br></br>
        <button onClick={createConversation} disabled={loading}>
          Create Conversation
        </button>
      </div>
    </div>,
    document.getElementById("conversationPortal")
  );
}
