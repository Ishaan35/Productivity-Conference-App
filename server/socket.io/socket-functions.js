//so i would say this file would store event listeners for conversations
//Also, in group video calls, once someone joins a meet, they also join a room for live chat during the meet (does not persist), but still uses the same socket.

let currentSocket = null;

module.exports = function (io) {
  io.on("connection", (socket) => {
    
    const email = socket.handshake.query.email;
    socket.join(email); //join the incoming socket into a "room" named with his/her email

    console.log("Connected: ", socket.id + ", " + email);

    socket.on("disconnect", function () {
      console.log("Disconnected", socket.id)
    });

    currentSocket = socket;

    require('./socket-conversation-functions')(socket)


    //Conversation Invite Event
  });

};