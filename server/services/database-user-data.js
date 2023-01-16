const e = require("express");
var mysql = require("mysql");
const util = require("util");
const { uploadFile } = require("./aws_s3");

const { pool } = require("./database-config.js");

const createUser = (data, callback) => {
  const first_name = data.first_name;
  const last_name = data.last_name;
  const email = data.email;
  const date_created = data.date_created;
  const uid = data.uid;

  //later we will analyze the first name and base the icon off of the first letter
  const imageDefaultLink =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  const queryStatement =
    "INSERT INTO People (email, uid, first_name, last_name, date_created, profile_image) VALUES (?,?,?,?,?,?)";

  pool.getConnection(async (err, connection) => {
    if (err) {
      return callback(err, null);
    } else if (connection) {
      connection.query(
        queryStatement,
        [email, uid, first_name, last_name, date_created, imageDefaultLink],
        (queryError, result) => {
          if (queryError) {
            connection.release();
            return callback(queryError, null, null);
          } else {
            connection.release();
            return callback(null, result, imageDefaultLink);
          }
        }
      );
    } else {
      connection.release();
      return callback(true, "No Connection");
    }
  });
};

const getUser = (uid, email, callback) => {
  const queryStatement = `SELECT * FROM People WHERE email='${email}' AND uid='${uid}'`;
  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      return callback(err, null);
    } else if (connection) {
      connection.query(queryStatement, (queryError, result) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          connection.release();
          return callback(null, result[0]); //we only want and expect 1 user
        }
      });
    }
  });
};

const getUsersByEmailBatch = (emails, callback) => {
  let formattedList = `(${emails.map((id) => JSON.stringify(id)).join(", ")})`;
  let queryString = `SELECT * FROM People WHERE email IN ${formattedList}`;

  pool.getConnection(async (err, connection) => {
    if (err) {
      connection.release();
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, result) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          connection.release();
          return callback(null, result); //we only want and expect 1 user
        }
      });
    }
  });
};

//dont think this one os used anywhere
const updateUserConversations = (
  userEmail,
  userUID,
  userConversationsList,
  callback
) => {
  const queryString = `UPDATE People SET conversations = '${JSON.stringify(
    userConversationsList
  )}' WHERE email='${userEmail}' AND uid='${userUID}'`;
  pool.getConnection(async (err, connection) => {
    if (err) {
      return callback(err, null);
    } else if (connection) {
      connection.query(queryString, (queryError, result) => {
        if (queryError) {
          connection.release();
          return callback(queryError, null);
        } else {
          connection.release();
          return callback(null, result);
        }
      });
    } else {
      connection.release();
      return callback(true, "No Connection");
    }
  });
};

const updateUser = async (
  first_name,
  last_name,
  profile_image,
  uid,
  callback
) => {
  try {
    let profile_image_obj = null;
    if (profile_image) {
      profile_image_obj = await uploadFile(profile_image); //actually returns an object with the link in it
    }

    //now we do the database query inserting these names, and the new profile image link
    let query_statement;
    let img_key;

    console.log(profile_image_obj);
    if (profile_image_obj) {
      img_key = profile_image_obj.Key;
      query_statement = `UPDATE People SET first_name='${first_name}', last_name='${last_name}', profile_image='${
        process.env.SERVER_URL + "/images/" + img_key
      }' WHERE uid='${uid}'`;

      console.log(process.env.SERVER_URL + "/images/" + img_key);
    } else {
      query_statement = `UPDATE People SET first_name='${first_name}', last_name='${last_name}' WHERE uid='${uid}'`;
    }

    pool.getConnection(async (err, connection) => {
      if (err) {
        return callback(err, null);
      } else if (connection) {
        connection.query(query_statement, (queryError, result) => {
          if (queryError) {
            connection.release();
            return callback(queryError, null);
          } else {
            connection.release();
            if (profile_image) {
              return callback(null, {
                imgLink: "/images/" + img_key,
              });
            } else {
              return callback(null, {
                message: "Success. No Image Sent",
              });
            }
          }
        });
      } else {
        connection.release();
        return callback(true, "No Connection");
      }
    });
  } catch (error) {
    return callback(error, null);
  }
};

const getConversationUsersFromEmails = async (emails, callback) => {
  try {
    let list = "(";
    for (let i = 0; i < emails.length; i++) {
      list += `'${emails[i]}'`;
      if (i != emails.length - 1) {
        list += ",";
      }
    }
    list += ")";

    let queryString = `SELECT email, first_name, last_name, profile_image FROM People WHERE email IN ${list}`;

    pool.getConnection(async (err, connection) => {
      if (err) {
        connection.release();
        return callback(err, null);
      } else if (connection) {
        connection.query(queryString, (queryError, result) => {
          if (queryError) {
            connection.release();
            return callback(queryError, null);
          } else {
            connection.release();
            return callback(null, result); //we only want and expect 1 user
          }
        });
      }
    });
  } catch (e) {
    return callback(e, null);
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  getUsersByEmailBatch,
  updateUserConversations,
  getConversationUsersFromEmails,
};
