import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authentication/AuthContext";
import { useUser } from "../../contexts/USER_CONTEXT/UserContext";

export default function Login() {
  const {
    signup,
    currentUser,
    deleteUser,
    reauthenticate,

    userFirstName,
    userLastName,
    userDateCreated,
    userProfileImageLink,
  } = useAuth();

  const { createUser, setUserDetails, getUserDataFromDatabase } = useUser();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  //input state refs
  const firstNameInputRef = useRef();
  const lastNameInputRef = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const passwordConfirmInputRef = useRef();


  useEffect(() => {
    //!currentUser ?

    //if user is not null (signed in automatically), then redirect to dashboard route
    if (
      currentUser &&
      currentUser !== undefined &&
      currentUser != null &&
      userFirstName
    ) {
      setLoading(false);
      console.log("navigated 44");
      navigate("/");
    }
  }, [currentUser, navigate, userFirstName]);

  useEffect(() => {
    async function process() {
      //if user is not null (signed in automatically), then redirect to dashboard route. null is the default state
      if (!currentUser && currentUser !== undefined && currentUser != null) {
        navigate("/");
      } else if (currentUser && !userFirstName && !loading) {
        ///if there is no loading state from when the user submits login form, and no user data, but the currentUser auth object exists, we can re-fetch the data for auto login
        console.log("hey");
        setLoading(true);
        let database_response = await getUserDataFromDatabase();
        if (database_response.error) {
          console.log(database_response.error)
          setError(
            "We are having trouble logging you in. Please refresh the page and try again!"
          );
        }
      }
    }
    process();
  }, [currentUser]);

  const validateNameString = (str) => {
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
    }
    return str;
  };

  //setters for the state for email confirmEmail and password inputs
  const handleEmailInput = (e) => {
    let str = validateNameString(e.target.value);
    emailInputRef.current.value = str;
  };
  const handlePasswordInput = (e) => {
    //nothing yet
  };
  const handleFirstNameInput = (e) => {
    let str = validateNameString(e.target.value);
    firstNameInputRef.current.value = str;
  };
  const handleLastNameInput = (e) => {
    let str = validateNameString(e.target.value);
    lastNameInputRef.current.value = str;
  };
  const handlePasswordConfirmInput = (e) => {
    //do nothing yet
  };

  //tries to sign up with firebase
  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordInputRef.current.value !== passwordConfirmInputRef.current.value) {
      return setError("Passwords do not match");
    }
    if (passwordInputRef.current.value.length < 6) {
      return setError("Password must be a minimum of 6 characters in length");
    }

    try {
      setError("");
      setLoading(true);
      let databaseUserCreateError = false;

      const info = await signup(emailInputRef.current.value.toLowerCase(), passwordInputRef.current.value); //initially try authenticating with firebase

      //only try adding to database if there was no error with firebase on creating the account
      if (!info.error) {
        //now we sign up on the database
        try {
          const result = await createUser(
            info.email,
            info.uid,
            firstNameInputRef.current.value,
            lastNameInputRef.current.value
          ); //call the createUser function from the userContext file to store data in the rds database. this function returns an object with success message or error essage

          if (!result.error && result.message && result.message === "success") {
            setUserDetails(firstNameInputRef.current.value, lastNameInputRef.current.value, Date.now(), null); //setting details of the main state of the application.
          } else {
            setError(result.error);
            databaseUserCreateError = true;
          }
        } catch (databaseError) {
          setError(databaseError.message);
          databaseUserCreateError = true; //used to undo create firebase auth account
        }
      } else {
        setError(info.error); //firebase server error. not our own database error
      }
      if (databaseUserCreateError) {
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////delete current user because there was an error connecting to database through server to fill the missing information. NOT DONE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit}>
        {error && <h4 style={{ color: "red" }}>{error}</h4>}
        {currentUser && currentUser.email}

        <label>First Name</label>
        <input
          type="text"
          onChange={handleFirstNameInput}
          ref={firstNameInputRef}
          required
        ></input>

        <br></br>

        <label>Last Name</label>
        <input type="text" onChange={handleLastNameInput} ref={lastNameInputRef} required></input>

        <br></br>

        <label>Email</label>
        <input type="email" onChange={handleEmailInput} ref={emailInputRef} required></input>

        <br></br>

        <label>Password</label>
        <input type="password" onChange={handlePasswordInput} ref={passwordInputRef} required></input>

        <br></br>

        <label>Confirm Password </label>
        <input
          type="password"
          onChange={handlePasswordConfirmInput}
          ref={passwordConfirmInputRef}
          required
        ></input>

        <br></br>

        <button type="submit" onClick={handleSubmit} disabled={loading}>
          Sign Up
        </button>
      </form>

      <br></br>
      <div>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
}
