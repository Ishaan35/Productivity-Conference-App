//This context contains the functions needed to modify or create user data on the rds database.
import React, { useContext, useState, useEffect } from "react";
import { useAuth } from "../authentication/AuthContext";
const FormsContext = React.createContext();

export function useFormsContext() {
  return useContext(FormsContext);
}

export function FormsProvider({ children }) {
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

  const [allForms, setAllForms] = useState([]);

  

  const value = {};

  return (
    <FormsContext.Provider value={value}>{children}</FormsContext.Provider>
  );
}
