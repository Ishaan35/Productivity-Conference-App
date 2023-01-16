import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authentication/AuthContext";
import { useUser } from "../../contexts/USER_CONTEXT/UserContext";

export default function Login() {
  const { login, currentUser, clearStates, userFirstName, logout } = useAuth();
  const { getUserDataFromDatabase } = useUser();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const navigate = useNavigate();

  useEffect(
    () => {
        async function process() {
          //if user is not null (signed in automatically), then redirect to dashboard route. null is the default state
          if (!currentUser && currentUser !== undefined && currentUser != null) {
            navigate("/");
          } else if (currentUser && !userFirstName && !loading) {
            ///if there is no loading state from when the user submits login form, and no user data, but the currentUser auth object exists, we can re-fetch the data for auto login
            console.log("hey");

            setLoading(true);
            let database_response = await getUserDataFromDatabase();
            console.log(database_response);
            if(database_response.error){
              setError("We are having trouble logging you in. Please refresh the page and try again!")
            }
          }
        }
        process();
      },
    [currentUser]
  );

  useEffect(() => {
    if (userFirstName) {
      setLoading(false);
      console.log("navigated 34");
      navigate("/");
    }
  }, [userFirstName, navigate]);

  //setters for the state for email and password inputs
  const handleEmailInput = (e) => {
    setEmailInput(e.target.value);
  };
  const handlePasswordInput = (e) => {
    setPasswordInput(e.target.value);
  };

  //tries to login with firebase
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      if (currentUser) {
        clearStates();
      }
      const loginFirebaseResponse = await login(emailInput.toLowerCase(), passwordInput); //logged in through firebase authentication
      if (loginFirebaseResponse.user) {
        //now we get the information of the user through the database. If the response has an error message, then failed to log in and we do not do anything
        let database_response = await getUserDataFromDatabase(
          loginFirebaseResponse.user.email,
          loginFirebaseResponse.user.uid
        );
        if (database_response.error) {
          setError("There was an error connecting to the database");
          logout();
        }
      }
    } catch (err) {
      console.log(err);
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        {error && <h4 style={{ color: "red" }}>{error}</h4>}
        {currentUser && currentUser.email}
        <br></br>

        <label>Email</label>
        <input type="email" onChange={handleEmailInput} required></input>

        <br></br>
        <label>Password</label>
        <input type="password" onChange={handlePasswordInput} required></input>
        <br></br>
        <button type="submit" onClick={handleSubmit} disabled={loading}>
          Log In
        </button>
      </form>

      <br></br>
      <div>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
      <br></br>
      <div>
        Need an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
