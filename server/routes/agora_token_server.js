const express = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const APP_ID = process.env.AGORA_APP_ID; //process.env.APP_ID
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE; //process.env.APP_CERTIFICATE

const app = express();

const nocache = (req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};

const generateAccessToken = (req, res) => {
  //set response header
  res.header("Access-Control-Allow-Origin", "*");
  //get channel name
  const channelName = req.query.channelName;
  if (!channelName) {
    return res.status(500).json({
      error: "channel is required",
    });
  }
  //get uid
  let uid = req.query.uid;
  if (!uid || uid == "") {
    uid = 0;
  }
  //get role
  let role = RtcRole.SUBSCRIBER;
  if (req.query.role == "publisher") {
    role = RtcRole.PUBLISHER;
  }
  //get the expire time
  let expireTime = req.query.expireTime;
  if (!expireTime || expireTime == "") {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  //calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  //build the token
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );
  //return the token
  return res.json({ token: token });
};

module.exports = function (app) {
  app.get("/access_token", nocache, generateAccessToken);
}
