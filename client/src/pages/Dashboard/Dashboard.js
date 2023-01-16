import React, { useState, useEffect, useLayoutEffect } from "react";
import { useAuth } from "../../contexts/authentication/AuthContext";
import { useUser } from "../../contexts/USER_CONTEXT/UserContext";

import { useNavigate, Outlet } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";

import "./Dashboard.css";

export default function Dashboard() {
  const {
    currentUser,
    userFirstName,
    userLastName,
    userDateCreated,
    clearStates,
  } = useAuth();
  const { getUserDataFromDatabase, setUserDetails } = useUser();

  const navigate = useNavigate(); //for going to different routes
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser === undefined || currentUser === null) {
      clearStates();
      navigate("./login");
    }
  }, [currentUser, navigate]);

  //if data missing for some reason, refetch it
  useEffect(() => {
    async function verifyAndGetData() {
      console.log(currentUser, userFirstName, userLastName, userDateCreated);
      if (
        currentUser &&
        (!userFirstName || !userLastName || !userDateCreated)
      ) {
        console.log("refetching data")
        setLoading(true);
        let database_response = await getUserDataFromDatabase();
        setLoading(false);
        if (database_response.error) {
          console.log("Data refetch error");
        }
      }
    }

    verifyAndGetData();
  }, []);

  return (
    <>
      {currentUser && (
        <>
          {loading && <h1>Loading</h1>}
          {/* Header. Contains logout button */}
          <Navbar></Navbar>
          <div className="bodyContainerDashboard">
            <Sidebar></Sidebar>

            <div className="activeSectionOfApp">
              <Outlet></Outlet>
            </div>
          </div>
        </>
      )}
    </>
  );
}
