//This context contains the functions needed to modify or create user data on the rds database.
import React, { useContext, useState, useEffect } from "react";
import { useAuth } from "../authentication/AuthContext";
const UserContext = React.createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
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

  const value = {
    createUser,
    getUserDataFromDatabase,
    setUserDetails,
    updateUserInformationInDatabase,
  };

  function setUserDetails(firstName, lastName, dateCreated, profileImageLink, userConversationIdsList) {
    setUserFirstName(firstName);
    setUserLastName(lastName);
    setUserDateCreated(dateCreated);

    if (profileImageLink) {
      setUserProfileImageLink(profileImageLink);
    }
  }

  async function getUserDataFromDatabase(emailManual, uidManual) {
    let url;
    if (currentUser) {
      url =
        baseServerUrl + `/getUserData/${currentUser.email}/${currentUser.uid}`;
    } else {
      if (emailManual && uidManual) {
        url = baseServerUrl + `/getUserData/${emailManual}/${uidManual}`;
      } else {
        return {
          error: "CurrentUser is null and no manual parameters given",
        };
      }
    }
    try {
      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      response = await response.json();
      if (!response.error) {
        setUserLastName(response.user.last_name);
        setUserDateCreated(response.user.date_created);
        setUserProfileImageLink(response.user.profile_image);
        setUserFirstName(response.user.first_name);
        return response;
      } else {
        console.log("try catch error");
        return {
          error: response.error,
        };
      }
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  //fetch call to create intiial user inside the rds database
  async function createUser(email, uid, first_name, last_name) {
    let date = Date.now();
    try {
      const response = await fetch(baseServerUrl + "/signup", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          uid: uid,
          first_name: first_name,
          last_name: last_name,
          date_created: date,
        }),
      });
      const content = await response.json();
      if (content.message && content.message === "success") {
        setUserFirstName(first_name);
        setUserLastName(last_name);
        setUserDateCreated(date);
        setUserProfileImageLink(content.imageLink);
        return {
          message: "success",
        };
      } else {
        return {
          error: content.error,
        };
      }
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  async function updateUserInformationInDatabase(formData) {
    try {
      let response = await fetch(baseServerUrl + "/updateUserInformation", {
        method: "POST",
        body: formData,
      });
      return response;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
