import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/authentication/AuthContext";
import { useUser } from "../../contexts/USER_CONTEXT/UserContext";
import { useUtility } from "../../contexts/Utility/UtilityContext";

import "./Profile.css";

export default function Profile() {
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
  const { getUserDataFromDatabase, updateUserInformationInDatabase } =
    useUser();

  const {compressImage} = useUtility();




  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [date, setDate] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);

  const [newFirstNameInput, setNewFirstNameInput] = useState("");
  const [newLastNameInput, setNewLastNameInput] = useState("");
  const [error, setError] = useState("");

  const [newImage, setNewImage] = useState(null);
  const [newImageTemporaryURL, setNewImageTemporaryURL] = useState("");

  const newImageBeforeCompressPreviewRef = useRef();
  const imageCanvasRef = useRef();
  const finalImageProcessedRef = useRef();

  useEffect(
    () =>
      async function () {
        console.log("PROFILE");
        //if the user details do not exist for some reason, fetch them
        if (!userFirstName || !userLastName || !userDateCreated) {
          setLoading(true);
          await getUserDataFromDatabase();
          setLoading(false);
        } else {
          setLoading(false);
          setNewFirstNameInput(userFirstName);
          setNewLastNameInput(userLastName);
          setDate(new Date(parseInt(userDateCreated)).toString())
        }
      },
    [
      userFirstName,
      userLastName,
      userDateCreated,
      userProfileImageLink,
      getUserDataFromDatabase,
    ]
  );

  useEffect(() => {
    setNewFirstNameInput(userFirstName);
    setNewLastNameInput(userLastName);
  }, [userFirstName, userLastName]);

  function toggleEditingProfile(e) {
    e.preventDefault();
    setEditingProfile(!editingProfile);
  }

  function handleFirstNameInput(e) {
    setNewFirstNameInput(e.target.value);
  }
  function handleLastNameInput(e) {
    setNewLastNameInput(e.target.value);
  }

  //when we select a file, this gets called
  function onProfilePictureInputChanged(e) {
    setError("");
    if (e.target.files || e.target.files.length > 0) {
      if (e.target.files[0].type.indexOf("image") < 0) {
        setError("Images only!");
      } else {
        setNewImage(e.target.files[0]);
        setNewImageTemporaryURL(URL.createObjectURL(e.target.files[0]));

        //takes the original file, compressed image width, the original img element ref, the canvas element ref, and the final output img element ref, as well as a callback function which runs when the image is finished processing, and data is returned through it
        compressImage(
          e.target.files[0],
          200,
          newImageBeforeCompressPreviewRef,
          imageCanvasRef,
          finalImageProcessedRef,
          function (result) {
            setNewImage(result.final_processed_image_file);
            setNewImageTemporaryURL(result.new_final_image_url);
          }
        );
      }
    }
  }

  async function handleSubmit(e) {
    
    e.preventDefault();
    setError("");

    let formData = new FormData();
    formData.append("new_first_name", newFirstNameInput);
    formData.append("new_last_name", newLastNameInput);

    if (newImage) {
      formData.append("new_profile_image", newImage);
    } else {
      formData.append("new_profile_image", null);
    }

    formData.append("uid", currentUser.uid);
    try {
      setSubmitLoading(true);
      let data = await updateUserInformationInDatabase(formData);
      try {
        data = await data.json();
        setEditingProfile(!editingProfile);

        setUserFirstName(newFirstNameInput);
        setUserLastName(newLastNameInput);
        if (data.imgLink) {
          setUserProfileImageLink(baseServerUrl + data.imgLink); //get from response
        }
        setSubmitLoading(false);
      } catch (err) {
        setError(data.error);
      }

      //set state now
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div>
      {loading && <h1>Loading...</h1>}
      {!loading && (
        <form
          encType="multipart/form-data"
          accept="image/png, image/gif, image/jpeg"
        >
          <div className="informationList">
            <div className="informationRow">
              <h3>First Name: </h3>{" "}
              <input
                type="text"
                placeholder="First Name"
                value={newFirstNameInput}
                disabled={!editingProfile}
                name="first_name"
                onChange={handleFirstNameInput}
              ></input>
            </div>
            <div className="informationRow">
              <h3>Last Name: </h3>{" "}
              <input
                type="text"
                placeholder="Last Name"
                value={newLastNameInput}
                disabled={!editingProfile}
                name="last_name"
                onChange={handleLastNameInput}
              ></input>
            </div>
            <div className="informationRow">
              <h3>Email: </h3> <p>{currentUser.email}</p>
            </div>
            <div className="informationRow">
              <h3>Date Created: </h3> <p>{userDateCreated}</p>
            </div>
            <div className="informationRow">
              <h3>Profile Image: </h3>

              <img
                src=""
                alt=""
                ref={newImageBeforeCompressPreviewRef}
                hidden
              ></img>
              <canvas ref={imageCanvasRef} hidden></canvas>
              <img
                src={newImageTemporaryURL}
                alt=""
                ref={finalImageProcessedRef}
              ></img>
              <input
                type="file"
                name="new_profile_image"
                disabled={!editingProfile}
                accept="image/png, image/gif, image/jpeg, image/jpg"
                onChange={onProfilePictureInputChanged}
              ></input>

              {error && <h4 style={{ color: "red" }}>{error}</h4>}
            </div>
          </div>

          <button onClick={toggleEditingProfile} disabled={editingProfile}>
            Edit Profile
          </button>
          {editingProfile && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              Submit
            </button>
          )}
        </form>
      )}
    </div>
  );
}
