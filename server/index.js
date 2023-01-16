//imports
const express = require("express");
const cors = require("cors");
const http = require("http");


require("dotenv").config();
const PORT = 5000;
const ORIGIN = "http://localhost:3000"; //update after




//app setup
const app = express();
var corsOptions = {
  origin: ORIGIN,
  optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
require("./routes/user_data_routes.js")(app);
require('./routes/general_data_routes.js')(app);
require('./routes/conversation_data_routes.js')(app);
require('./routes/agora_token_server.js')(app);

const server = http.createServer(app);


//Socket.io setup from the server. Attach socket.io
const io = require("socket.io")(server, {
  cors: {
    origin: ORIGIN,
  },
}); 
//create socket instance with server as 
require("./socket.io/socket-functions")(io);

server.listen(process.env.PORT || PORT); //setup complete