import React, { useState, useRef, useLayoutEffect } from "react";
import { UseConversations } from "../../contexts/Conversations/ConversationsContext";
import { useAuth } from "../../contexts/authentication/AuthContext";
import "./MessagesWindow.css";
import uuid from "react-uuid";
import ConversationDetailsModal from "../ConversationDetailsModal/ConversationDetailsModal";
import { useEffect } from "react";
import { useUtility } from "../../contexts/Utility/UtilityContext";

export default function MessagesWindow() {
  const {
    messagesLoading,
    currentConversationMessages,
    sendMessageToConversation,
    sendFileToConversation,
    loadMoreMessages,
  } = UseConversations();
  const { currentUser } = useAuth();
  const [validTextToSend, setValidTextToSend] = useState(false);

  const [viewingConversationDetails, setViewingConversationDetails] =
    useState(false);

  const sendMessageTextRef = useRef();

  const [imageUploadLabelStyle, setImageUploadLabelStyle] =
    useState("imageUpload");
  const [fileUploadLabelStyle, setFileUploadLabelStyle] =
    useState("imageUpload");
  const [error, setError] = useState("");

  const [newImage, setNewImage] = useState(null);
  const [newImageTemporaryURL, setNewImageTemporaryURL] = useState("");

  const [newFile, setNewFile] = useState(null);
  const [newFileTemporaryURL, setNewFileTemporaryURL] = useState("");
  const [uploadingFileLoading, setUploadingFileLoading] = useState(false);

  const newImageBeforeCompressPreviewRef = useRef();
  const imageCanvasRef = useRef();
  const finalImageProcessedRef = useRef();
  const { compressImage } = useUtility();

  const messageColumnRef = useRef();

  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false); //when the load more messages btn is clicked

  useEffect(() => {
    if (error) console.log(error);
  }, [error]);

  useLayoutEffect(() => {
    messageColumnRef.current.scrollTo(
      0,
      messageColumnRef.current.scrollHeight + 1000000
    );
  });

  const validateText = (e) => {
    let text = sendMessageTextRef.current.value;
    text = text.trim();

    if (text.length > 0) {
      setValidTextToSend(true);
    } else {
      setValidTextToSend(false);
    }
  };

  const cancelImageUpload = async () => {
    setNewImage(null);
    setNewImageTemporaryURL(null);
    setError("");
  };

  //you have access to currentConversationMessages.LastEvaluatedKey. Use it to make a button that loads more messages and adds them to the array of all messages

  const cancelFileUpload = async () => {
    setNewFile(null);
    setNewFileTemporaryURL(null);
    setError("");
  };

  const imageFileInputChange = (e) => {
    if (e.target.files || e.target.files.length > 0) {
      sendMessageTextRef.current.value = "";
      if (e.target.files[0].type.indexOf("image") < 0) {
        setError("Images only!");
      } else {
        setNewImage(e.target.files[0]);
        setNewImageTemporaryURL(URL.createObjectURL(e.target.files[0]));
        setNewFile(null);
        setNewFileTemporaryURL(null);

        //takes the original file, compressed image width, the original img element ref, the canvas element ref, and the final output img element ref, as well as a callback function which runs when the image is finished processing, and data is returned through it
        compressImage(
          e.target.files[0],
          400,
          newImageBeforeCompressPreviewRef,
          imageCanvasRef,
          finalImageProcessedRef,
          function (result) {
            setNewImage(result.final_processed_image_file);
            setNewImageTemporaryURL(result.new_final_image_url);
          }
        );
      }
    }
  };

  const fileInputChange = (e) => {
    if (e.target.files || e.target.files.length > 0) {
      sendMessageTextRef.current.value = "";
      if (e.target.files[0].type.indexOf("image") >= 0) {
        setError("Use image upload to send images");
      } else {
        setNewFile(e.target.files[0]);
        setNewFileTemporaryURL(URL.createObjectURL(e.target.files[0]));
        setNewImage(null);
        setNewImageTemporaryURL(null);
      }
    }
  };

  const sendMessage = async () => {
    if (validTextToSend) {
      let message = {
        date: Date.now(),
        from: currentUser.email,
        text: sendMessageTextRef.current.value,
        conversation_id: currentConversationMessages.conversationUID,
        message_id: `${Date.now()} ${uuid()}`,
        type: "text",
      };
      sendMessageTextRef.current.value = "";
      setValidTextToSend(false);
      let response = await sendMessageToConversation(
        currentConversationMessages.conversationUID,
        message
      );
      if (!response.error) {
        console.log("message send success");
      } else {
        setError("Message send failed. Please try again or refresh the page");
      }
    }
  };

  const sendImageMessage = async () => {
    if (newImage) {
      let message = {
        date: Date.now(),
        from: currentUser.email,
        conversation_id: currentConversationMessages.conversationUID,
        message_id: `${Date.now()} ${uuid()}`,
        type: "image",
        file: null,
      };

      let formData = new FormData();

      formData.append("message_image", newImage);
      formData.append("message", JSON.stringify(message));
      formData.append(
        "conversationUID",
        currentConversationMessages.conversationUID
      );

      setUploadingFileLoading(true);
      let response = await sendFileToConversation(
        currentConversationMessages.conversationUID,
        message,
        formData
      );
      if (!response.error) {
        console.log("image send success");
        setNewImage(null);
        setNewImageTemporaryURL(null);
      } else {
        setError("Message send failed. Please try again or refresh the page");
      }
      setUploadingFileLoading(false);
    }
  };

  const sendFileMessage = async () => {
    if (newFile) {
      let message = {
        date: Date.now(),
        from: currentUser.email,
        conversation_id: currentConversationMessages.conversationUID,
        message_id: `${Date.now()} ${uuid()}`,
        type: "file",
        file: null,
      };

      let formData = new FormData();

      formData.append("message_file", newFile);
      formData.append("message", JSON.stringify(message));
      formData.append(
        "conversationUID",
        currentConversationMessages.conversationUID
      );

      setUploadingFileLoading(true);
      let response = await sendFileToConversation(
        currentConversationMessages.conversationUID,
        message,
        formData
      );
      if (!response.error) {
        console.log("file send success");
        setNewFile(null);
        setNewFileTemporaryURL(null);
      } else {
        setError("Message send failed. Please try again or refresh the page");
      }
      setUploadingFileLoading(false);
    }
  };

  const moreMessages = async () =>{
    setLoadingMoreMessages(true);

    //make an async call to the function in the conversation context, supplying the 
    await loadMoreMessages();
    setLoadingMoreMessages(false);
  }

  return (
    <div className="messagesWindow">
      {viewingConversationDetails && (
        <ConversationDetailsModal
          setViewingConversationDetails={setViewingConversationDetails}
        ></ConversationDetailsModal>
      )}
      {messagesLoading && <h1>Loading Messages...</h1>}

      <div className="messagesColumn">
        <p style={{ fontSize: "10px", color: "lightgray" }}>
          {currentConversationMessages &&
            currentConversationMessages.conversationUID}
        </p>

        <div className="messagesContainer" ref={messageColumnRef}>
          <button
            style={{ float: "right" }}
            onClick={() => setViewingConversationDetails(true)}
          >
            Conversation Details
          </button>

          <button style={{width:"50%", alignSelf:"center"}} onClick={() => moreMessages()}>
            Load More Messages
          </button>
          {loadingMoreMessages && <h5>Loading messages...</h5>}
          {currentConversationMessages &&
            currentConversationMessages.messages.map((m) => {
              if (m.from) {
                if (m.from === currentUser.email) {
                  if (!m.type || m.type === "text") {
                    return (
                      <div className="sentMessage" key={m.message_id}>
                        {m.text}{" "}
                        <p style={{ fontSize: "9px", color: "gray" }}>
                          {m.date}
                        </p>
                      </div>
                    );
                  } else if (m.type && m.type === "image") {
                    return (
                      <div className="sentMessage" key={m.message_id}>
                        <img
                          src={m.file}
                          style={{ width: "200px" }}
                          alt=""
                        ></img>
                      </div>
                    );
                  } else if (m.type && m.type === "file") {
                    return (
                      <div className="sentMessage" key={m.message_id}>
                        <div
                          style={{
                            width: "90px",
                            height: "130px",
                            background: "lightgray",
                            borderRadius: "3px",
                          }}
                        >
                          <a href={m.file} target="_blank" rel="noreferrer">
                            {m.filename}
                          </a>
                        </div>
                      </div>
                    );
                  }
                } else {
                  if (!m.type || m.type === "text") {
                    return (
                      <div className="receivedMessage" key={m.message_id}>
                        {m.text}
                        <p style={{ fontSize: "9px", color: "gray" }}>
                          {m.from}
                        </p>
                        <p style={{ fontSize: "9px", color: "gray" }}>
                          {m.date}
                        </p>
                      </div>
                    );
                  } else if (m.type && m.type === "image") {
                    return (
                      <div className="receivedMessage" key={m.message_id}>
                        <img
                          src={m.file}
                          style={{ width: "200px" }}
                          alt=""
                        ></img>
                      </div>
                    );
                  } else if (m.type && m.type === "file") {
                    return (
                      <div className="receivedMessage" key={m.message_id}>
                        <div
                          style={{
                            width: "90px",
                            height: "130px",
                            background: "lightgray",
                            borderRadius: "3px",
                          }}
                        >
                          <a href={m.file} target="_blank" rel="noreferrer">
                            {m.filename}
                          </a>
                        </div>
                      </div>
                    );
                  }
                }
              } else {
                if (m.type === "user-leave-or-enter") {
                  return (
                    <div
                      style={{ width: "100%", textAlign: "center" }}
                      key={Date.now()}
                    >
                      <hr></hr>
                      <p>{m.text}</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="receivedMessage" key={m.message_id}>
                      {m.text}
                      <br></br>
                      <p style={{ fontSize: "9px", color: "gray" }}>{m.date}</p>
                    </div>
                  );
                }
              }
            })}
        </div>

        <div className="newMessageDiv">
          {!newImage && !newFile && (
            <span>
              <textarea
                type="text"
                placeholder="Message"
                className="messageTextBox"
                ref={sendMessageTextRef}
                onChange={validateText}
              ></textarea>
              <button
                className="messageSubmitBtn"
                disabled={!validTextToSend}
                onClick={sendMessage}
              >
                Send
              </button>
            </span>
          )}

          {newImage && !newFile && (
            <span
              style={{
                display: "flex",
                background: "white",
                padding: "10px",
                width: "50%",
                height: "50px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", padding: "10px" }}>
                  <button
                    className="deleteImageBtn"
                    onClick={cancelImageUpload}
                  >
                    X
                  </button>
                  <img
                    src={newImageTemporaryURL}
                    alt=""
                    ref={finalImageProcessedRef}
                    width="100px"
                  ></img>
                </div>

                <button
                  className="messageSubmitBtn"
                  disabled={!newImage || uploadingFileLoading}
                  onClick={sendImageMessage}
                >
                  Send
                </button>
              </div>
            </span>
          )}

          {newFile && !newImage && (
            <span
              style={{
                display: "flex",
                background: "white",
                padding: "10px",
                width: "50%",
                height: "50px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", padding: "10px" }}>
                  <button className="deleteImageBtn" onClick={cancelFileUpload}>
                    X
                  </button>
                  <div
                    style={{
                      width: "80px",
                      height: "110px",
                      background: "lightgray",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "5px",
                      fontSize: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <a
                      href={newFileTemporaryURL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {newFile.name}
                    </a>
                  </div>
                </div>

                <button
                  className="messageSubmitBtn"
                  disabled={!newFile || uploadingFileLoading}
                  onClick={sendFileMessage}
                >
                  Send
                </button>
              </div>
            </span>
          )}

          <span>
            {!newFile && (
              <>
                <label
                  htmlFor="message_image"
                  className={imageUploadLabelStyle}
                  onMouseOver={() =>
                    setImageUploadLabelStyle("imageUploadHover")
                  }
                  onMouseOut={() => setImageUploadLabelStyle("imageUpload")}
                >
                  Upload Image
                </label>
                <input
                  onChange={imageFileInputChange}
                  type="file"
                  name="message_image"
                  id="message_image"
                  accept="image/*"
                  style={{ display: "none" }}
                ></input>
              </>
            )}

            {!newImage && (
              <>
                <label
                  htmlFor="message_file"
                  className={fileUploadLabelStyle}
                  onMouseOver={() =>
                    setFileUploadLabelStyle("imageUploadHover")
                  }
                  onMouseOut={() => setFileUploadLabelStyle("imageUpload")}
                >
                  Upload File
                </label>
                <input
                  onChange={fileInputChange}
                  type="file"
                  name="message_file"
                  id="message_file"
                  style={{ display: "none" }}
                ></input>
              </>
            )}
          </span>
        </div>

        <img src="" alt="" ref={newImageBeforeCompressPreviewRef} hidden></img>
        <canvas ref={imageCanvasRef} hidden></canvas>
      </div>
    </div>
  );
}
