import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../config/firebase"; //firebase config info file

const AuthContext = React.createContext();

let baseServerUrl = "http://localhost:5000";


export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(); //email and uid

  //extra information
  const [userFirstName, setUserFirstName] = useState();
  const [userLastName, setUserLastName] = useState();
  const [userProfileImageLink, setUserProfileImageLink] = useState();
  const [userDateCreated, setUserDateCreated] = useState();

  const [loading, setLoading] = useState(true); //we set this initial loading to true because in case you have cookies and tokens stored in your browser, the automatic authentication async process will need some loading time before anything happens, so we set this to true. So initially the user is null, but firebase automatically checks for cookies and tokens, and automatically signs in the user if exists, and then the user is no longer null anymore. This is where the onAuthStateChanged event gets fired and the loading state is false.

  async function signup(email, password) {
    return auth
      .createUserWithEmailAndPassword(email, password)
      .then(function (user) {
        return {
          email: user.user.multiFactor.user.email,
          uid: user.user.multiFactor.user.uid,
          message: "success",
        };
      })
      .catch(function (error) {
        console.log(error);
        //LATER I WILL RETURN THE ERROR AND PARSE IT and return it
        return {
          error: error.message,
        };
      });
  }
  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }
  function logout() {
    clearStates();
    return auth.signOut();
  }
  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }

  function clearStates(){
    
    setUserFirstName(null);
    setUserLastName(null);
    setUserDateCreated(0);
    setUserProfileImageLink(null);
    setCurrentUser(null);
    //setLoading(true);
  }

  async function reauthenticate(user, email, password) {}
  async function deleteUser(user, email, password) {
    // try {
      
    //   let u = {email, password}
    //   let resp = await user.reauthenticateWithCredential(user, );
    //   console.log(resp);
    //   //return user.delete();
    // } catch (err) {
    //   return {
    //     error: err.message,
    //   };
    // }
  }

  // event listener gets mounted in the beginning only
  useEffect(() => {
    //firebase notifies us when user gets set, and we ge the user through the event listener, and we set it from here
    //signup and login both will call this method

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; //basically we unsubscribe from the listener when unmounting this component
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    deleteUser,
    reauthenticate,
    clearStates,

    //extra information pass down state
    userFirstName,
    setUserFirstName,
    userLastName,
    setUserLastName,
    userDateCreated,
    setUserDateCreated,
    userProfileImageLink,
    setUserProfileImageLink,
    baseServerUrl,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render out the children (which also includes signup form) if the app is still authenticating for automatic login. Basically don't render anything unless we set the user (to null or an actual user) */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
