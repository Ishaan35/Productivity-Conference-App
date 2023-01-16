const {
  getAllConversations,
  getSingleConversationMessages,
  createConversation,
  getConversation,
  getSingleConversationUsers,
  getLastSeenData,
  sendLastSeenData,
  removeUserConversationPair,
  getConversationUserMatch,
} = require("../services/database-conversation-data");

const {
  addMessageToTable,
  createOrUpdateRowLatestMessage,
  getMoreMessagesFromSingleConversation,
} = require("../services/aws_dynamo");

const { uploadFile } = require("../services/aws_s3");

const {
  getConversationUsersFromEmails,
} = require("../services/database-user-data");

const multer = require("multer");
var path = require("path");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

module.exports = function (app) {
  //works fine
  app.get("/getAllConversations/:email/:uid", (req, res) => {
    let uid = req.params.uid;
    let email = req.params.email;

    getAllConversations(email, uid, function (err, result) {
      if (!err) {
        if (result) {
          res.json({
            conversations: result,
          });
        }
      } else {
        res.json({
          error: err.message,
        });
      }
    });
    console.log("getting user conversations" + email);
  });

  app.get(
    "/getConversationMessages/:email/:uid/:conversationID",
    (req, res) => {
      const email = req.params.email;
      const uid = req.params.uid;
      const conversationID = req.params.conversationID;

      getSingleConversationMessages(
        email,
        uid,
        conversationID,
        function (err, result) {
          if (err) {
            res.json({
              error: err.message,
            });
          } else {
            console.log(result);
            res.json({
              data: result,
            });
          }
        }
      );
    }
  );

  app.post("/createConversation", async (req, res) => {
    const conversationName = req.body.conversationName;
    const conversationUID = req.body.conversationUID;
    const conversationCreatorEmail = req.body.conversationCreatorEmail;
    const conversationCreatorUID = req.body.conversationCreatorUID;
    const usersToAdd = req.body.usersToAdd;
    const dateModified = req.body.dateModified;

    //create conversation in database with pending invited users, and the creator as the only real user in this conversation

    createConversation(
      conversationName,
      conversationUID,
      { email: conversationCreatorEmail, uid: conversationCreatorUID }, //this is a list of all the user objects part of this conversation.
      dateModified, //this is a list of what time each user last saw the conversation
      usersToAdd,
      function (err, result) {
        if (err) {
          res.json({
            error: err.message,
          });
        } else {
          res.json({
            result: result,
          });
        }
      }
    );
  });

  app.get("/getSingleConversation/:conversationUID", (req, res) => {
    let conversationUID = req.params.conversationUID;

    getConversation(conversationUID, function (err, result) {
      if (err) {
        res.json({
          error: err.message,
        });
      } else {
        res.json({
          data: result,
        });
      }
    });
  });

  app.post("/sendMessage", async (req, res) => {
    const data = req.body;

    let conversation_id = data.conversationUID;
    let message = data.message;

    try {
      console.log(conversation_id, message);
      await addMessageToTable(message);
      await createOrUpdateRowLatestMessage(conversation_id, message);

      res.send({ message: "success" });
    } catch (e) {
      console.log(e);
      res.send({ error: e.message });
    }
  });

  app.post(
    "/sendImageMessage",
    multer({ storage: storage }).single("message_image"),
    async (req, res) => {
      let messageOBJ = JSON.parse(req.body.message);
      let conversationUID = req.body.conversationUID;
      let file = req.file;

      console.log(req);

      let file_obj_info = null;
      if (file) {
        file_obj_info = await uploadFile(file); //actually returns an object with the link in it
      }
      let key = file_obj_info.Key;

      let imgURL = null;
      if (messageOBJ.type === "image") {
        imgURL = process.env.SERVER_URL + "/images/" + key;
        messageOBJ["file"] = imgURL;
      }

      //now we upload the message to dynamodb
      await addMessageToTable(messageOBJ);
      await createOrUpdateRowLatestMessage(conversationUID, messageOBJ);

      res.json({
        message: messageOBJ,
      });
    }
  );

  app.post(
    "/sendFileMessage",
    multer({ storage: storage }).single("message_file"),
    async (req, res) => {
      let messageOBJ = JSON.parse(req.body.message);
      let conversationUID = req.body.conversationUID;
      let file = req.file;

      console.log(req);

      let file_obj_info = null;
      if (file) {
        file_obj_info = await uploadFile(file); //actually returns an object with the link in it
      }
      let key = file_obj_info.Key;

      let fileURL = null;
      if (messageOBJ.type === "file") {
        fileURL = process.env.SERVER_URL + "/file/" + key;
        messageOBJ["file"] = fileURL;
        messageOBJ["filename"] = file.originalname;
      }

      //now we upload the message to dynamodb
      await addMessageToTable(messageOBJ);
      await createOrUpdateRowLatestMessage(conversationUID, messageOBJ);

      res.json({
        message: messageOBJ,
      });
    }
  );

  app.get("/getSingleConversationUsers/:conversationUID", (req, res) => {
    const conversationUID = req.params.conversationUID;
    getSingleConversationUsers(conversationUID, function (err, result) {
      if (err) {
        res.json({
          error: err.message,
        });
      } else {
        res.json({
          data: result,
        });
      }
    });
  });

  app.post("/sendLastSeenData", (req, res) => {
    console.log(req.body.data);
    const user_email = req.body.user_email;
    const user_uid = req.body.user_uid;

    sendLastSeenData(
      user_email,
      user_uid,
      req.body.data,
      function (err, result) {
        if (err) {
          res.json({
            error: err.message,
          });
        } else {
          console.log("lastSeenDataSuccess", user_email);
          res.json({
            data: result,
          });
        }
      }
    );
  });

  app.post("/getConversationUsersFromEmails", (req, res) => {
    let emails = req.body.emails;

    getConversationUsersFromEmails(emails, function (err, result) {
      if (err) {
        res.json({
          error: err.message,
        });
      } else {
        res.json({
          data: result,
        });
      }
    });
  });

  app.post("/leaveConversation", async (req, res) => {
    //1. delete the conversations uid and user pair from sql database
    //2. send socket events to all the users who are in that conversation to delete the user from their conv list

    let user_email = req.body.userEmail;
    let user_uid = req.body.userUID;
    let conversation_uid = req.body.conversationUID;

    removeUserConversationPair(
      user_email,
      user_uid,
      conversation_uid,
      async function (err, result) {
        if (err) {
          res.json({
            error: err.message,
          });
        } else {
          res.json({
            result: result,
          });
        }
      }
    );
  });

  app.post("/getMoreMessages", async (req, res) => {
    let conversationUID = req.body.conversationUID;
    let userUID = req.body.userUID;
    let userEmail = req.body.userEmail;
    let LastEvaluatedKey = req.body.LastEvaluatedKey;

    getConversationUserMatch(
      conversationUID,
      userEmail,
      userUID,
      async function (err, result) {
        if (err) {
          res.json({
            error: err.message,
          });
        } else {
          if(result.length >= 1){
            //yes the user does match with the info provided. User is indeed in this conversation, so now we can fetch from aws.
            let messages = await getMoreMessagesFromSingleConversation(
              conversationUID,
              JSON.parse(LastEvaluatedKey)
            );
              //we have the messages, now we just send them to the front-end and deal with the data there
            console.log(messages);
          }
        }
      }
    );
  });
};
