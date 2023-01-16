const { getFile } = require("../services/aws_s3");

module.exports = function (app) {
  app.get("/images/:key", async (req, res) => {
    try {
      const readStream = getFile(req.params.key);
      if (!readStream.error)
        readStream.pipe(
          res
        ); //reads object for you and gives it. So basically the link of the object/file (RELATIVE TO SERVER) is stored in the database, and you just make a get request to the server and append the relative link at the end.
      else {
        res.json("File not found");
      }
    } catch (e) {
      res.json("File not found");
    }
  });

  app.get("/file/:key", async (req, res) => {
    try {
      const readStream = getFile(req.params.key);
      if (!readStream.error) {
        readStream.pipe(res); //reads object for you and gives it. So basically the link of the object/file (RELATIVE TO SERVER) is stored in the database, and you just make a get request to the server and append the relative link at the end.
      }
      else{
        res.json("File not found")
      }
    } catch (e) {
      res.json("File not found");
    }
  });
};
