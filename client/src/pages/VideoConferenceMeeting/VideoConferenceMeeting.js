import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/authentication/AuthContext";
import "./VideoConferenceMeeting.css";
import { useParams } from "react-router-dom";
import {
  config,
  useClient,
  useMicrophoneAndCameraTracks,
} from "../../config/agora-settings.js";
import { Grid } from "@material-ui/core";
import Video from "../../components/Video/Video";
import Controls from "../../components/Controls/Controls";

export default function VideoConferenceMeeting() {
  let { id } = useParams();

  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);

  const { baseServerUrl, currentUser } = useAuth();
  const [token, setToken] = useState(null);
  const [inCall, setInCall] = useState(false);
  const client = useClient();
  const { ready, tracks } = useMicrophoneAndCameraTracks();

  useEffect(() => {
    async function getToken() {
      const resp = await fetch(
        baseServerUrl + `/access_token?channelName=${id}`
      );
      let data = await resp.json();
      console.log(data);
      setToken(data.token);
    }
    getToken();
  });

  useEffect(() => {
    let init = async (channelName) => {

        //user published a stream, so we subscribe to it by adding it to our list
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
        }
        if(mediaType === "audio"){
            user.audioTrack.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) =>{
        if(mediaType === "audio"){
            if(user.audioTrack){
                user.audioTrack.stop();
            }
        }
        //if user unsubscribes their video, remove from user array
        if(mediaType === "video"){
            setUsers((prevUsers) =>{
                return prevUsers.filter((User) => User.uid !== user.uid)
            })
        }
      })

      client.on('user-left', (user) =>{
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      })

      //joining the channel 
      try {
        await client.join(config.APP_ID, channelName, token, currentUser.uid);
      } catch (error) {
        console.log(error);
      }

      if (tracks) {
        console.log("tracks", tracks);
        //publish the stream, and everyone else will automatically subscribe to our stream
        await client.publish([tracks[0], tracks[1]]);
      }
      setStart(true);
    };


    if(ready && tracks){
      try{
        init(id);
      }catch(error) {
        console.log(error);
      }
    }
  }, [client, ready, tracks, id, token, currentUser.uid]);

  return (
    <Grid container direction="column" style={{ height: "100%" }}>
      <Grid item style={{ height: "5%" }}>
        {ready && tracks && (
          <Controls
            tracks={tracks}
            setStart={setStart}
            setInCall={setInCall}
          ></Controls>
        )}
      </Grid>
      <Grid item style={{ height: "95%" }}>
        {start && tracks && <Video tracks={tracks} users={users} />}
      </Grid>
    </Grid>
  );
}
