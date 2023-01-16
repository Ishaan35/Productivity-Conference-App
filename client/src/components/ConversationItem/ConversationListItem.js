import React, {useState, useEffect} from 'react'
import "./ConversationListItem.css"

export default function ConversationListItem({
  name,
  uid,
  setSelectedConversation,
  selectedConversation,
  newMessageOpened,
  preview,
}) {
  const [styleClass, setStyleClass] = useState("conversationListItem");
  const selectConversation = () => {
    setSelectedConversation(uid);
  };

  useEffect(() => {
    if (selectedConversation === uid) {
      setStyleClass("conversationListItemSelected");
    } else {
      setStyleClass("conversationListItem");
    }
  }, [selectedConversation]);


  function updateStyleClass(cls) {
    if (selectedConversation !== uid) {
      setStyleClass(cls);
    }
  }

  return (
    <div
      className={styleClass}
      onClick={selectConversation}
      onMouseEnter={() => updateStyleClass("conversationListItemHovering")}
      onMouseLeave={() => updateStyleClass("conversationListItem")}
    >
      <label
        className={newMessageOpened ? "" : "boldConversationName"}
        style={{ fontSize: "15px" }}
      >
        {name}
      </label>
      {preview && (
        <label
          className={newMessageOpened ? "" : "boldConversationName"}
          style={{
            fontSize: "12px",
            maxWidth: "85%",
            textOverflow: "ellipses",
            overflow: "hidden",
            margin: "5px",
            lineClamp:"2",
            WebkitLineClamp:"2",
            color: "#a1a1a1",
            textAlign:"center"
          }}
        >
          {preview}
        </label>
      )}
    </div>
  );
}
