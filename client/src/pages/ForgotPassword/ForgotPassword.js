import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/authentication/AuthContext";

import { useNavigate } from "react-router-dom";
export default function ForgotPassword() {
  const { resetPassword, currentUser } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEmailInput = (e) => {
    setEmailInput(e.target.value);
  };

  //this tries to sign up with inputted info
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setMessage("");
      setLoading(true);
      await resetPassword(emailInput);
      setMessage("Check your email for further instructions");
    } catch (err) {
      setError("Failed to reset password");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>Password Reset</h2>
      <br></br>

      {error && <h4 style={{ color: "red" }}>{error}</h4>}
      {message && <h4 style={{ color: "green" }}>{message}</h4>}
      {currentUser && currentUser.email}

      <br></br>
      <br></br>

      <form>
        <input type="email" required onChange={handleEmailInput}></input>
        <button disabled={loading} type="submit" onClick={handleSubmit}>
          Reset Password
        </button>
      </form>

      <br></br>

      <div>
        <Link to="/login">Log In</Link>
      </div>

      <br></br>

      <div>
        Need an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
