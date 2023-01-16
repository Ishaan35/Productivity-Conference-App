const {
  createUser,
  getUser,
  updateUser,
} = require("../services/database-user-data.js");

const { getFile } = require("../services/aws_s3");

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
  //routes for handling user data when they create an account, or change something in their profile, etc
  //will have access to several query functions that give or set data in the aws rds database.

  app.post("/signup", async (req, res) => {
    const data = req.body;
    //console.log(data);
    createUser(data, function (err, rows, imgLink) {
      if (err) {
        res.send({
          error: err.message,
        });
      } else {
        res.send({
          message: "success",
          imageLink: imgLink
        });
      }
    });
  });

  app.get("/getUserData/:email/:uid", async (req, res) => {
    let uid = req.params.uid;
    let email = req.params.email;

    console.log("getting user " + email)

    getUser(uid, email, function (err, result) {
      if (!err) {
        res.json({
          user: result,
        });
        console.log("data sent");
      } else {
        res.json({
          error: err.message,
        });
        console.log("data error");
      }
    });
  });

  app.post(
    "/updateUserInformation",
    multer({ storage: storage }).single("new_profile_image"),
    async (req, res) => {
      let new_first_name = req.body.new_first_name;
      let new_last_name = req.body.new_last_name;
      let uid = req.body.uid;
      let new_profile_image;
      if (req.file) {
        new_profile_image = req.file;
      } else {
        new_profile_image = null;
      }

      console.log(new_first_name, new_last_name, new_profile_image, uid)

      //Compress image before uploading to database

      await updateUser(
        new_first_name,
        new_last_name,
        new_profile_image,
        uid,
        function (err, result) {
          if (err) {
            res.json({
              error: err.message,
            });
          } else {
            res.json(result); //object containing imgLink
          }
        }
      );
    }
  );

  
};
