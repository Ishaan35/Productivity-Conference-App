

module.exports = function (socket) {

  socket.on("created-conversation", function (inviteData) {
    if (inviteData && inviteData.usersToAdd) {
      inviteData.usersToAdd.forEach((recipient) => {
        socket.broadcast.to(recipient).emit("created-conversation", inviteData);
      });
    }
  });

  socket.on("received-message", function (data){
    
    if(data){
      let conversationUID = data.conversationUID;
      let message = data.message;
      let recipients = data.recipients;
      if (conversationUID && message && recipients) {
        for (let i = 0; i < recipients.length; i++) {
          let data = {
            conversationUID: conversationUID,
            message: message,
          };
          console.log("message socket event sent to " + recipients[i].email);
          socket.broadcast
            .to(recipients[i].email)
            .emit("received-message", data);
        }
      }
    }
    
  });


  socket.on("left-conversation", function (data){
    if(data){
      let conversationUID = data.conversationUID;
      let user_email = data.user_email;
      let recipients = data.recipients;

      if(conversationUID && user_email){
        for(let i = 0; i < recipients.length; i++){
          console.log("conversation leave event sent to " + recipients[i].email)
          socket.broadcast.to(recipients[i].email).emit("left-conversation", data)
        }
      }
    }
  });

};

