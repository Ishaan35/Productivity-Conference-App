const AWS = require("aws-sdk");
require("dotenv").config();

//DELETE THIS BEFORE PUSHING PROJECT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
process.env.AWS_ACCESS_KEY_ID = "AKIAQ5VJJFTTX3K7IIKM";
process.env.AWS_SECRET_ACCESS_KEY_ID =
  "jRWutgoVpyfjUIg7NUmnYNqhLGOJOodvqiVA3via";

const region = process.env.AWS_DYNAMODB_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY_ID;

AWS.config.update({
  region: region,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const MESSAGE_TABLE_NAME = "productivity-conference-app-messages";
const LATEST_MESSAGE_CONVERSATION_TABLE_NAME =
  "productivity-conference-app-latest-conversation-messages";

const addMessageToTable = async (message) => {
  console.log(message);
  const params = {
    TableName: MESSAGE_TABLE_NAME,
    Item: message,
  };

  return await dynamoClient.put(params).promise();
};

const createOrUpdateRowLatestMessage = async (conversationUID, message) => {
  console.log(conversationUID);
  const conversationInfo = {
    "conversation-id": conversationUID,
    date: parseInt(message.date),
    message: JSON.stringify(message),
  };
  const params = {
    TableName: LATEST_MESSAGE_CONVERSATION_TABLE_NAME,
    Item: conversationInfo,
  };
  return await dynamoClient.put(params).promise();
};

const getLatestMessageInEachConversation = async (conversationUIDList) => {
  
  let keys = [];
  for (let i = 0; i < conversationUIDList.length; i++) {
    let obj = {};
    obj[`conversation-id`] = conversationUIDList[i];
    keys.push(obj);
  }

  //////////////////////////////////////////////////////////////////////
  let queryParams = { RequestItems: {} };
  queryParams.RequestItems[`${LATEST_MESSAGE_CONVERSATION_TABLE_NAME}`] = {
    Keys: keys,
  };

  console.log(queryParams)

  return await dynamoClient.batchGet(queryParams).promise();
};

const getAllMessagesFromSingleConversation = async (conversationUID) =>{

    const queryParams = {
      TableName: `${MESSAGE_TABLE_NAME}`,
      IndexName: "conversation_id-date-index",
      KeyConditionExpression: "conversation_id = :conversation_id",
      ExpressionAttributeValues: {
        ":conversation_id": `${conversationUID}`,
      },
      ScanIndexForward: false,
      Limit: 1,
    };
    return await dynamoClient.query(queryParams).promise();
}

const getMoreMessagesFromSingleConversation = async (conversationUID, LastEvaluatedKey) => {
  const queryParams = {
    TableName: `${MESSAGE_TABLE_NAME}`,
    IndexName: "conversation_id-date-index",
    KeyConditionExpression: "conversation_id = :conversation_id",
    ExpressionAttributeValues: {
      ":conversation_id": `${conversationUID}`,
    },
    ExclusiveStartKey: LastEvaluatedKey,
    ScanIndexForward: false,
    Limit: 1,
  };
  return await dynamoClient.query(queryParams).promise();
};


module.exports = {
  addMessageToTable,
  createOrUpdateRowLatestMessage,
  getLatestMessageInEachConversation,
  getAllMessagesFromSingleConversation,
  getMoreMessagesFromSingleConversation,
};
