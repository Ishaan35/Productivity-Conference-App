const e = require("express");
var mysql = require("mysql");
const util = require("util");
const { uploadFile } = require("./aws_s3");
const {
  addMessageToTable,
  createOrUpdateRowLatestMessage,
  getLatestMessageInEachConversation,
  getAllMessagesFromSingleConversation,
  getMoreMessagesFromSingleConversation,
} = require("./aws_dynamo");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("./database-config.js");

const {
  getUser,
  getUsersByEmailBatch,
  updateUserConversations,
} = require("./database-user-data");

//this works fine. maybe modifications are needed when more columns are added to conversation table
const getAllConversations = (email, uid, callback) => {
  let queryString = `SELECT conversation_uid FROM user_conversations WHERE user_uid='${uid}' AND user_email='${email}'`; //gets us the user ids

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          connection.release();
          console.log(queryError);
          return callback(queryError, null);
        } else {
          //if more than one conversation
          if (res && res.length == 0) {
            return callback(null, res);
          } else {
            let idList = "(";
            for (let i = 0; i < res.length; i++) {
              idList += `'${res[i].conversation_uid}'`;
              if (i != res.length - 1) {
                idList += ",";
              }
            }
            idList += ")";

            let queryString = `SELECT * FROM Conversations WHERE uid IN ${idList}`;

            console.log(queryString);

            connection.query(queryString, async (queryError, conversations) => {
              if (queryError) {
                connection.release();
                console.log(queryError);
                return callback(queryError, null);
              } else {
                console.log(res);
                connection.release();

                let convUIDList = [];
                for (let i = 0; i < res.length; i++) {
                  convUIDList.push(res[i].conversation_uid);
                }

                //get latestMEssageData
                let latest_message_response =
                  await getLatestMessageInEachConversation(convUIDList);

                //get lastSeenData
                getLastSeenData(email, uid, (err, last_seen_data) => {
                  if (err) {
                    return callback(err, null);
                  } else {
                    return callback(null, {
                      conversations,
                      latest_message_response,
                      last_seen_data,
                    });
                  }
                });
              }
            });
          }
        }
      });
    }
  });
};

//returns a conversation object by id
const getConversation = (conversationID, callback) => {
  let queryString = `SELECT * FROM Conversations WHERE uid = '${conversationID}'`;

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      console.log(err);
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          connection.release();
          return callback(null, res); //we expect a list of conversation objects. return the original callback passed into this function, leading back to the conversations data routes file
        }
      });
    }
  });
};

const getConversationUserMatch = (
  conversationID,
  userEmail,
  userUID,
  callback
) => {
  let queryString = `SELECT * FROM user_conversations WHERE user_email='${userEmail}' AND user_uid='${userUID}' AND conversation_uid='${conversationID}'`;

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      console.log(err);
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          connection.release();
          return callback(null, res); //we expect a list of conversation objects. return the original callback passed into this function, leading back to the conversations data routes file
        }
      });
    }
  });
};

//gets messages of one conversation
const getSingleConversationMessages = (
  email,
  uid,
  conversationID,
  callback
) => {
  getConversationUserMatch(
    conversationID,
    email,
    uid,
    async function (queryError, res) {
      if (queryError) {
        return callback(queryError, null);
      } else {
        let conversationMatchObj = res[0]; //valid user trying to access. Now we just get all the messages with the uid from dynamodb

        //GET ALL MESSAGES WITH THIS CONVERSATION UID FROM DYNAMODB
        let messagesResult = await getAllMessagesFromSingleConversation(
          conversationID
        );

        return callback(null, messagesResult);
      }
    }
  );
};

const getSingleConversationUsers = (conversationID, callback) => {
  let queryString = `SELECT * FROM user_conversations WHERE conversation_uid='${conversationID}'`;

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      console.log(err);
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          let emailsList = "(";
          for (let i = 0; i < res.length; i++) {
            emailsList += `'${res[i].user_email}'`;
            if (i != res.length - 1) {
              emailsList += ",";
            }
          }
          emailsList += ")";

          console.log(emailsList);

          //res should have a list of users tied to this conversation. Take that user_uid and user_email info and find their full data from the People table
          let queryString = `SELECT email, first_name, last_name, profile_image FROM People WHERE email IN ${emailsList}`;

          connection.query(queryString, (queryError, res) => {
            if (queryError) {
              connection.release();
              return callback(queryError, null);
            } else {
              connection.release();
              return callback(null, res);
            }
          });
        }
      });
    }
  });
};

//creates a conversation, creates invites for it, and updates conversations list on user object
const createConversation = async (
  conversationName,
  conversationUID,
  admin,
  dateModified,
  usersToAdd,
  callback
) => {
  console.log("starting to create conversation");

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getUsersByEmailBatch(usersToAdd, function (queryError, res) {
    //res contains all the valid users
    if (queryError) {
      return callback(queryError, res);
    } else {
      if (!res || !res.length || res.length <= 0) {
        return callback(
          {
            message:
              "No users found with the email addresses given. Please enter valid email addresses of registered users. 163",
          },
          null
        );
      } else {
        //insert conversation object into database
        let queryString = `INSERT INTO Conversations (name, uid, dateModified, admin_uid, admin_email) VALUES (?,?,?,?,?)`;

        pool.getConnection(async (err, connection) => {
          if (err) {
            connection.release();
            return callback(err, null);
          } else if (connection) {
            connection.query(
              queryString,
              [
                conversationName,
                conversationUID,
                dateModified,
                admin.uid,
                admin.email,
              ],
              (queryError, result) => {
                if (queryError) {
                  connection.release();
                  return callback(queryError, null);
                } else {
                  //now we add users to the conversation
                  let valueSets = `('${admin.email}', '${admin.uid}', '${conversationUID}'),`;
                  {
                    for (let i = 0; i < res.length; i++) {
                      console.log("user 1 adding to table");
                      valueSets += "(";
                      valueSets += `'${res[i].email}',`;
                      valueSets += `'${res[i].uid}',`;
                      valueSets += `'${conversationUID}'`;
                      valueSets += ")";
                      if (i !== res.length - 1) {
                        valueSets += ",";
                      }
                    }
                    //add a user_conversation row in the table for each user in a batch method
                    let queryString = `INSERT INTO user_conversations (user_email, user_uid, conversation_uid) VALUES ${valueSets}`;
                    console.log(queryString);

                    connection.query(
                      queryString,
                      async (queryError, result) => {
                        if (queryError) {
                          connection.release();
                          return callback(queryError, null);
                        } else {
                          //add a blank message

                          let blank_message = {
                            message_id: `${Date.now()} ${uuidv4()}`,
                            text: "test_message",
                            date: Date.now(),
                            conversation_id: conversationUID,
                          };
                          await addMessageToTable(blank_message);
                          await createOrUpdateRowLatestMessage(
                            conversationUID,
                            blank_message
                          );
                          connection.release();
                          return callback(null, {
                            name: conversationName,
                            uid: conversationUID,
                            dateModified: dateModified,
                            admin_uid: admin.uid,
                            admin_email: admin.email,
                          });
                        }
                      }
                    );
                  }
                }
              }
            );
          } else {
            connection.release();
            return callback(true, "No Connection");
          }
        });
      }
    }
  });
};

const getLastSeenData = async (user_email, user_uid, callback) => {
  let queryString = `SELECT last_seen FROM user_last_seen_conversation WHERE user_email='${user_email}' AND user_uid='${user_uid}'`;

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      console.log(err);
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          if (res) {
            connection.release();
            console.log(res);
            if (res.length === 0) {
              return callback(null, JSON.stringify([]));
            } else {
              
              return callback(null, res[0].last_seen);
            }
          }
        }
      });
    }
  });
};
const sendLastSeenData = async (user_email, user_uid, data, callback) => {
  let queryString = `INSERT INTO user_last_seen_conversation (user_email, user_uid, last_seen) VALUES ('${user_email}','${user_uid}','${data}') ON DUPLICATE KEY UPDATE user_email='${user_email}', user_uid='${user_uid}', last_seen='${data}'`;

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      console.log(err);
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          console.log(queryError);
          connection.release();
          return callback(queryError, null);
        } else {
          console.log("successLastSeenDataSaved");
          connection.release();
          return callback(null, res);
        }
      });
    }
  });
};

const removeUserConversationPair = async(user_email, user_uid, conversationUID, callback) => {
  let queryString =  `DELETE FROM user_conversations WHERE user_email='${user_email}' AND user_uid='${user_uid}' AND conversation_uid='${conversationUID}'`

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      console.log(err);
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, res) => {
        if (queryError) {
          connection.release();
          console.log(queryError);
          return callback(queryError, null);
        } else {
          if (res) {
            connection.release();
            console.log(res);
            return callback(null, res);
          }
        }
      });
    }
  });
}

module.exports = {
  getAllConversations,
  getSingleConversationMessages,
  createConversation,
  getConversation,
  getSingleConversationUsers,
  getLastSeenData,
  sendLastSeenData,
  removeUserConversationPair,
  getConversationUserMatch,
};
