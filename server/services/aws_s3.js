const S3 = require("aws-sdk/clients/s3");
require("dotenv").config();

const fs = require("fs");

const bucketName = process.env.AWS_BUCKET_NAME_S3;
const region = process.env.AWS_BUCKET_REGION_S3;

//mysql://bf436fd90b7f5f:3f79c5dc@us-cdbr-east-05.cleardb.net/heroku_4780a6510d42ec1?reconnect=true

//this is where the test code from the aws_s3 txt file was

//these keys are for the IAM user

//DELETE THIS BEFORE PUSHING PROJECT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
process.env.AWS_ACCESS_KEY_ID = "AKIAQ5VJJFTTX3K7IIKM";
process.env.AWS_SECRET_ACCESS_KEY_ID =
  "jRWutgoVpyfjUIg7NUmnYNqhLGOJOodvqiVA3via";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY_ID;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Key: file.filename,
    Body: fileStream,
  };
  return s3.upload(uploadParams).promise();
}

function getFile(fileKey) {
  try {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName,
    };
    return s3.getObject(downloadParams).createReadStream();
  } catch(e) {
    return { error: "file does not exist" };
  }
}

exports.uploadFile = uploadFile;
exports.getFile = getFile;
//uploads a file to s3

//downloads a file from s3
