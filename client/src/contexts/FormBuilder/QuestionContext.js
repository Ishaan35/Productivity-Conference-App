//This context contains the functions needed to modify or create user data on the rds database.
import React, { useContext, useState, useEffect } from "react";
import { useAuth } from "../authentication/AuthContext";
const QuestionContext = React.createContext();

export function useQuestionContext() {
  return useContext(QuestionContext);
}

export function QuestionProvider({ children }) {
  const {
    currentUser,

    userFirstName,
    setUserFirstName,
    userLastName,
    setUserLastName,
    userDateCreated,
    setUserDateCreated,
    userProfileImageLink,
    setUserProfileImageLink,
    baseServerUrl,
  } = useAuth();

  const [formElements, setFormElements] = useState({
    elements: [],
  });
  const [FormName, SetFormName] = useState("Untitled Form");
  const [FormID, setFormId] = useState(-1);

  const value = {
    
  };

 
  

  

  

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
}
