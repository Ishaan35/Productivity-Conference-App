import { useState } from "react";
import { useClient } from "../../config/agora-settings";
import { Grid, Button, Icon } from "@material-ui/core";

import MicIcon from "@material-ui/icons/Mic";
import MicOffIcon from "@material-ui/icons/MicOff";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import TvIcon from "@material-ui/icons/Tv";

export default function Controls(props) {
  const client = useClient();
  //const { tracks, setStart, setInCall, shareScreenState } = props;
  const { tracks, setStart, setInCall } = props;

  //keeps track of the enabled and disabled controls
  const [trackState, setTrackState] = useState({ video: true, audio: true });

  //const [shareScreen, setShareScreen] = shareScreenState;

  const leaveChannel = async () => {
    await client.leave();
    client.removeAllListeners();
    tracks[0].close();
    tracks[1].close();
    setStart(false);
    setInCall(false);
  };
  const mute = async (mediaType) => {
    //if we want to toggle the audio or video, we can modify the object how we want
    if (mediaType === "audio") {
      await tracks[0].setEnabled(!trackState.audio);
      setTrackState((prevState) => {
        return { ...prevState, audio: !prevState.audio }; //toggle audio property of track state only
      });
    } else if (mediaType === "video") {
      await tracks[1].setEnabled(!trackState.video);
      setTrackState((prevState) => {
        return { ...prevState, video: !prevState.video }; //toggle video property of track state only
      });
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item>
        <Button
          variant="contained"
          color={trackState.audio ? "primary" : "secondary"}
          onClick={() => mute("audio")}
        >
          {trackState.audio ? <MicIcon></MicIcon> : <MicOffIcon></MicOffIcon>}
        </Button>
      </Grid>

      <Grid item>
        <Button
          variant="contained"
          color={trackState.video ? "primary" : "secondary"}
          onClick={() => mute("video")}
        >
          {trackState.video ? (
            <VideocamIcon></VideocamIcon>
          ) : (
            <VideocamOffIcon></VideocamOffIcon>
          )}
        </Button>
      </Grid>

      {/* <Grid item>
        <Button
          variant="contained"
          color={shareScreen ? "secondary" : "primary"}
          onClick={() => setShareScreen(!shareScreen)}
        >
          <TvIcon></TvIcon>
        </Button>
      </Grid> */}

      <Grid item>
        <Button
          variant="contained"
          color="default"
          onClick={() => leaveChannel()}
        >
          Leave
          <ExitToAppIcon></ExitToAppIcon>
        </Button>
      </Grid>
    </Grid>
  );
}
