import "./App.css";
import React from "react";
import { BrowserRouter as Router, Route, Routes} from "react-router-dom";
import { AuthProvider } from "./contexts/authentication/AuthContext";
import { UserProvider } from "./contexts/USER_CONTEXT/UserContext";
import { UtilityProvider } from "./contexts/Utility/UtilityContext";
import { SocketProvider } from "./contexts/Socket/SocketProvider";
import { ConversationsProvider } from "./contexts/Conversations/ConversationsContext";

///Components imported
import Dashboard from "./pages/Dashboard/Dashboard";
import Signup from "./pages/Signup/Signup";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Profile from "./pages/Profile/Profile";
import VideoConferenceHome from "./pages/DashboardPages/VideoConferenceHome/VideoConferenceHome";
import VideoConferenceMeeting from "./pages/VideoConferenceMeeting/VideoConferenceMeeting";



//components
import Login from "./pages/Login/Login";
import Conversations from "./pages/DashboardPages/Conversations/Conversations.js";
import FormBuilderWindow from "./pages/DashboardPages/FormBuilderWindow/FormBuilderWindow";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <UserProvider>
          <ConversationsProvider>
            <UtilityProvider>
              <div className="MAIN_APP">
                <Router>
                  <Routes>
                    <Route path="/" element={<Dashboard></Dashboard>}>
                      <Route
                        path="conversations"
                        element={<Conversations></Conversations>}
                      ></Route>
                      <Route
                        path="forms"
                        element={<FormBuilderWindow></FormBuilderWindow>}
                      ></Route>
                      <Route
                        path="profile"
                        element={<Profile></Profile>}
                      ></Route>
                      <Route
                        path="video-conference-home"
                        element={<VideoConferenceHome></VideoConferenceHome>}
                      ></Route>
                    </Route>
                    <Route path="login" element={<Login></Login>}></Route>
                    <Route path="signup" element={<Signup></Signup>}></Route>
                    <Route
                      path="forgot-password"
                      element={<ForgotPassword></ForgotPassword>}
                    ></Route>
                    <Route
                      path="video-meet/:id"
                      element={
                        <VideoConferenceMeeting></VideoConferenceMeeting>
                      }
                    ></Route>
                  </Routes>
                </Router>
              </div>
            </UtilityProvider>
          </ConversationsProvider>
        </UserProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
