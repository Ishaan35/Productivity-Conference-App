import { createClient, createMicrophoneAndCameraTracks, createScreenVideoTrack } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";


const appId = process.env.REACT_APP_AGORA_APP_ID;

//this token is temporary and we will later ask the token generator server to fetch a token for us
// let token =
//   "0064f58a32bcbd84c409b7694fb975591faIAAcfzROuNLbgupZl6nwZ4y74A6KVXZu263XuzhraoHRXGTNKL8AAAAAEADLkLYoiZjMYgEAAQCMmMxi";

export const config = {
  mode: "rtc",
  codec: "vp8",
  APP_ID: appId,
};
export const useClient = createClient(config);
export const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

// export const channelName = "main";

//varies from browser to browser

//if chrome
export const useScreenVideoTracksChrome = createScreenVideoTrack({
  // Set the encoder configurations. For details, see the API description.
  encoderConfig: "1080p_1",
  // Set the video transmission optimization mode as prioritizing video quality.
});
