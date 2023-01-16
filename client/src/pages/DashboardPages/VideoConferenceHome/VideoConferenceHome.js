import React, { useState, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import "./VideoConferenceHome.css";
import uuid from "react-uuid";

export default function VideoConferenceHome() {
  const [meetLink, setMeetLink] = useState("");
  const [error, setError] = useState("");

  const codeRef = useRef();
  const navigate = useNavigate();


  const generateVideoLink = () => {
    let link = uuid();
    setMeetLink(
      process.env.REACT_APP_BASE_FRONTEND_URL + "/video-meet/" + link
    );
    console.log(
      process.env.REACT_APP_BASE_FRONTEND_URL + "/video-meet/" + link
    );
  };

  function copyToClipboard(link) {
    navigator.clipboard.writeText(link);
  }

  function joinWithCode() {
    if(codeRef.current.value.indexOf(process.env.REACT_APP_BASE_FRONTEND_URL + "/video-meet") >= 0){
        //link entered
        window.open(codeRef.current.value, "_blank");
    }
    else if(codeRef.current.value.indexOf(process.env.REACT_APP_BASE_FRONTEND_URL) < 0){
        //code entered 
        window.open(`/video-meet/` + codeRef.current.value, "_blank");
    }
    else{
        setError("Please enter a valid meeting code or link")
    }
  }



  return (
    <div>
      <div>
        <div>Create a new video meeting:</div>
        <button onClick={generateVideoLink} disabled={meetLink}>
          Generate Link
        </button>

        <br></br>
        <br></br>

        {meetLink && (
          <div>
            <b>Share this link with others: </b>
            <a href={meetLink} target="_blank" rel="noreferrer">
              {meetLink}
            </a>
            <span>
              <button onClick={() => copyToClipboard(meetLink)}>Copy</button>
            </span>
          </div>
        )}
      </div>

      <br></br>
      <br></br>
      <div>Have a code? Enter it here:</div>
      <input type="text" placeholder="" ref={codeRef}></input>
      <button onClick={joinWithCode}>Go</button>
    </div>
  );
}
