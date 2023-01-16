import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useReducer,
} from "react";
import { useAuth } from "../authentication/AuthContext";

import { SocketContext } from "../Socket/SocketProvider";

const ConversationsContext = React.createContext();

export function UseConversations() {
  return useContext(ConversationsContext);
}

export function ConversationsProvider({ children }) {
  const {
    currentUser,
    baseServerUrl,
    userFirstName,
    userLastName,
    userProfileImageLink,
  } = useAuth();

  const [socket, setSocket] = useContext(SocketContext);

  const [allConversations, setAllConversations] = useState(null);
  //the reason is due to the fact that when a conversation updates, it will be the first conversation in the array and this state will not be able to keep up, so we will just use uids in each object of the array and sequential search the uids before modifying or using any data from this state
  const [conversationMessages, setConversationMessages] = useState([{}]); //array of objects which will contain array of conversations
  const conversationUsers = useRef(); //will contain an array of objects, each holding an array of emails of all the users part of the conversation. Useful for storing data when adding/deleting users, and sending socket events to specific users in the chat. Empty list of the objects created when fetching all conversations

  const [loading, setLoading] = useState(true);
  const lastSeenTimesRef = useRef([]); // this will store the last time the user read each conversation. Basically We fetch all conversations, all conversation invites, and one latest message from each conversation to see when it was last active. We will sort the conversatons, and this last seen state array based on the list of the latest message in each conversation.
  //Whenever we receive a socket event for a message, we will put the conversation it is from on top (as well as the corresponding last seen object). When we accept an invite, we can add a new lastSeenTime object to the list (as first element) as well as add the conversation as the first item in the allConversations list

  const [messagesLoading, setMessagesLoading] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const previousSelectedConversation = useRef(null);
  //so basically the messages and basic info for conversation are stored in state for the duration of the user using the application, however, data such as the users in a conversation, etc are fetched every time in case that info is updated by someone else
  const [currentConversationMessages, setCurrentConversationMessages] =
    useState(null);

  //this is information needed to view the modal for the details of the conversation
  const [currentConversationUsers, setCurrentConversationUsers] =
    useState(null);
  const [currentConversationName, setCurrentConversationName] = useState(null);
  const [currentConversationAdmin, setCurrentConversationAdmin] =
    useState(null);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    async function gettingMessages() {
      if (selectedConversation) {
        //get index of the selected conversation from the messages state because they might not be in order
        let index = -1;
        for (let i = 0; i < conversationMessages.length; i++) {
          if (
            conversationMessages[i].conversationUID === selectedConversation
          ) {
            index = i;
            break;
          }
        }
        //if not, then some erroroccured
        if (index >= 0) {
          //there is already a message present in the list
          if (conversationMessages[index].opened) {
            //messages were already loaded, so all we have to do is update the currentMessages
            console.log("messages already loaded");
            setCurrentConversationMessages(conversationMessages[index]);
          } else {
            //no messages loaded in yet, get them and their data
            setMessagesLoading(true);
            setCurrentConversationMessages(null);
            await getAllMessagesFromConversation(selectedConversation);
            await getAllUsersFromConversation(selectedConversation);

            //get message object with corresponding uid
            for (let i = 0; i < conversationMessages.length; i++) {
              if (
                conversationMessages[i].conversationUID === selectedConversation
              ) {
                setCurrentConversationMessages(conversationMessages[i]);
              }
            }
            conversationMessages[index].opened = true;
            setMessagesLoading(false);
          }
        }
        //////////////////////////////////////////////////////////////////////////////////////////
        //now we update the lastSeenTimes data based on previously selected conversation. we last saw the previous cinversation at this moment
        if (previousSelectedConversation.current) {
          for (let i = 0; i < lastSeenTimesRef.current.length; i++) {
            if (
              lastSeenTimesRef.current[i].conversationUID ===
              previousSelectedConversation.current
            ) {
              lastSeenTimesRef.current[i].date = Date.now();
              break;
            }
          }
        }
        //now we update the current conversation's lastseen time
        for (let i = 0; i < lastSeenTimesRef.current.length; i++) {
          if (
            lastSeenTimesRef.current[i].conversationUID === selectedConversation
          ) {
            lastSeenTimesRef.current[i].date = Date.now();
            break;
          }
        }
        //now we update the newMessageOpened property on the selected conversation, as well as update the current admin and name information
        for (let i = 0; i < allConversations.length; i++) {
          if (allConversations[i].uid === selectedConversation) {
            allConversations[i].newMessageOpened = true;
            setCurrentConversationAdmin(allConversations[i].admin_email);
            setCurrentConversationName(allConversations[i].name);
            forceUpdate();
            break;
          }
        }

        for (let i = 0; i < conversationUsers.current.length; i++) {
          if (
            conversationUsers.current[i].conversationUID ===
            selectedConversation
          ) {
            setCurrentConversationUsers(conversationUsers.current[i].users);
            break;
          }
        }

        previousSelectedConversation.current = selectedConversation;
      }
    }

    gettingMessages();
  }, [selectedConversation]);

  useEffect(() => {
    async function getLatestMessages() {
      if (currentUser && userFirstName && !allConversations) {
        setLoading(true);
        const resp1 = await getAllConversations();
        window.addEventListener("beforeunload", handleTabClosing);
        setLoading(false);
      }
    }
    getLatestMessages();
  }, [currentUser, userFirstName]);

  useEffect(() => {
    if (socket === null || socket === undefined) {
      return;
    } else {
      try {
        socket.on("created-conversation", (conversation) => {
          //now we need to add an element to the users array ref so we can keep track of the users in this new conversation for broadcasting socket events
          let users = [];
          for (let i = 0; i < conversation.usersToAdd.length; i++) {
            users.push({
              email: conversation.usersToAdd[i],
            });
          }

          if (allConversations && allConversations.length > 0) {
            conversation["newMessageOpened"] = false;
            setAllConversations([conversation, ...allConversations]);
            setConversationMessages([
              { conversationUID: conversation.uid, messages: [] },
              ...conversationMessages,
            ]);

            // add the users list to the users ref for socket broadcasting purposes

            conversationUsers.current.push({
              conversationUID: conversation.uid,
              users: users,
            });
          } else {
            conversation["newMessageOpened"] = false;
            setAllConversations([conversation]);
            setConversationMessages([
              { conversationUID: conversation.uid, messages: [] },
            ]);

            // add the users list to the users ref for socket broadcasting purposes
            conversationUsers.current = [
              {
                conversationUID: conversation.uid,
                users: users,
              },
            ];
          }

          //add a lastSeen time object for the new conversation
          lastSeenTimesRef.current.push({
            conversationUID: conversation.uid,
            date: 10000, //since we want to guarantee we never saw the conversation yet
          });
        });

        socket.on("received-message", (data) => {
          let conversationUID = data.conversationUID;
          let message = data.message;
          if (conversationMessages) {
            let index = -1;
            for (let i = 0; i < conversationMessages.length; i++) {
              if (conversationMessages[i].conversationUID === conversationUID) {
                index = i;
                break;
              }
            }

            conversationMessages[index].messages.push(message);

            let preview = null;
            let currentMessage = message;
            if (
              currentMessage.from &&
              currentMessage.type &&
              currentMessage.type === "text"
            ) {
              preview = `${currentMessage.from}: ${currentMessage.text}`;
            } else if (
              currentMessage.from &&
              currentMessage.type &&
              currentMessage.type === "image"
            ) {
              preview = `${currentMessage.from} sent an image`;
            } else if (
              currentMessage.from &&
              currentMessage.type &&
              currentMessage.type === "file"
            ) {
              preview = `${currentMessage.from} send a file`;
            }

            //conversationMessages[index].preview = preview;

            if (data.conversationUID === selectedConversation) {
              setCurrentConversationMessages(conversationMessages[index]);
              console.log(data);
              console.log("sent " + message.type);
            } else {
              console.log(data);
              if (preview) {
                forceUpdate();
              }
            }
            console.log("successfully pushed message");

            //we move this conversation the message was sent to, on the top since it was the latest interacted.
            {
              let j = -1;
              for (let i = 0; i < allConversations.length; i++) {
                if (allConversations[i].uid === conversationUID) {
                  j = i;
                  break;
                }
              }

              //if not the first conversation already, move it up to the top
              if (j !== 0) {
                let oldFirstConv = structuredClone(allConversations[0]);

                let elementsBeforeJ = [...allConversations.slice(1, j)];

                let newFirstConv = structuredClone(allConversations[j]);
                newFirstConv["newMessageOpened"] = false;
                newFirstConv["preview"] = preview;
                let elementsAfterJ;
                if (j < allConversations.length - 1) {
                  elementsAfterJ = [...allConversations.slice(j + 1)];
                }

                if (j < allConversations.length - 1) {
                  setAllConversations([
                    newFirstConv,
                    oldFirstConv,
                    ...elementsBeforeJ,
                    ...elementsAfterJ,
                  ]);
                } else {
                  setAllConversations([
                    newFirstConv,
                    oldFirstConv,
                    ...elementsBeforeJ,
                  ]);
                }
              } else if (j === 0) {
                allConversations[j]["newMessageOpened"] = false;
                allConversations[j]["preview"] = preview;
                forceUpdate();
              }
            }
          }
        });

        socket.on("left-conversation", (data) => {
          let conversationUID = data.conversationUID;
          let user_email = data.user_email;

          console.log(currentConversationUsers);

          //delete the user from the conversationUsers ref array
          let index = -1;
          for (let i = 0; i < conversationUsers.current.length; i++) {
            if (
              conversationUsers.current[i].conversationUID === conversationUID
            ) {
              index = i;
              break;
            }
          }
          if (index !== -1) {
            for (
              let j = 0;
              j < conversationUsers.current[index].users.length;
              j++
            ) {
              console.log(
                conversationUsers.current[index].users[j],
                user_email
              );

              if (
                conversationUsers.current[index].users[j].email === user_email
              ) {
                conversationUsers.current[index].users.splice(j, 1);
                break;
              }
            }
          }

          //delete the user from the currentConversationUsers state array
          index = -1;
          if (currentConversationUsers) {
            for (let i = 0; i < currentConversationUsers.length; i++) {
              if (currentConversationUsers[i].email === user_email) {
                index = i;
                break;
              }
            }
            if (index !== -1) {
              if (index !== currentConversationUsers.length - 1) {
                setCurrentConversationUsers([
                  ...currentConversationUsers.slice(0, index),
                  ...currentConversationUsers.slice(index + 1),
                ]);
              } else {
                setCurrentConversationUsers([
                  ...currentConversationUsers.slice(0, index),
                ]);
              }
            }
          }

          index = -1;
          for(let i = 0; i < conversationMessages.length; i++){
            if(conversationMessages[i].conversationUID === conversationUID){
              conversationMessages[i].messages.push({
                type:"user-leave-or-enter",
                text:`${user_email} has left the conversation`
              })
            }
          }

          forceUpdate();
        });

        return () => socket.removeAllListeners();
      } catch (e) {
        return;
      }
    }
  }, [
    socket,
    allConversations,
    currentUser,
    conversationMessages,
    selectedConversation,
  ]);

  //ALL FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //this functions gets the list of conversations and sets their state, including the list of messages, etc
  const getAllConversations = async () => {
    let url;
    if (currentUser) {
      url =
        baseServerUrl +
        `/getAllConversations/${currentUser.email}/${currentUser.uid}`;
    } else {
      return {
        error: "CurrentUser is null, cannot fetch conversations",
      };
    }

    try {
      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      response = await response.json();

      console.log(response);
      if (!response.error) {
        let convs = response.conversations.conversations;
        let messageData =
          response.conversations.latest_message_response.Responses[
            "productivity-conference-app-latest-conversation-messages"
          ];
        console.log(messageData);

        let last_seen_data = JSON.parse(response.conversations.last_seen_data);

        //sort the messageData based on largest date number, and make the convs list align with it
        function compare(a, b) {
          if (a.date > b.date) {
            return -1;
          }
          if (a.date < b.date) {
            return 1;
          }
          return 0;
        }

        //now arrange the convs data so the conversationIDS match here, and they are in order by date
        messageData.sort(compare); //sort by date of latest message
        let convID_Order = messageData.map((a) => a["conversation-id"]); //list of conversation ids in order of date of conversation modified

        //stackoverflow answer. basically sorts arr so the objects follow this rule: the uid property of the object in arr at index i matches the value of list at index i
        const sortItemByList = (list, arr, property) => {
          const tmpMap = arr.reduce((acc, item) => {
            acc[item[`${property}`]] = item;
            return acc;
          }, {});

          return list.map((key) => tmpMap[key]);
        };

        convs = sortItemByList(convID_Order, convs, "uid");

        console.log(messageData);
        console.log(convs);

        //good, all times are recorded
        if (last_seen_data.length === convs.length) {
          last_seen_data = sortItemByList(
            convID_Order,
            last_seen_data,
            "conversationUID"
          );
        } else {
          //missing elements.  make it from scratch
          let updated_last_seen_data = [];

          function findDateOfConversation(convUID) {
            let j = -1;
            for (let i = 0; i < last_seen_data.length; i++) {
              if (last_seen_data[i].conversationUID === convUID) {
                j = i;
                break;
              }
            }
            if (j === -1) {
              return 10000; //new conversation id inputted, not in the lastSeen data yet
            } else {
              return last_seen_data[j].date;
            }
          }
          for (let i = 0; i < convs.length; i++) {
            updated_last_seen_data.push({
              conversationUID: convs[i].uid,
              date: findDateOfConversation(convs[i].uid),
            });
          }

          last_seen_data = updated_last_seen_data;
        }
        lastSeenTimesRef.current = last_seen_data;

        //finally, add a property in each conversation about if it was opened when a new message arrived. initially they will all be false, but based on lastSeendata and new messages arriving, it will be changed
        //so basically we have to get the lastSeenData from the database, order it, and set the newMessageOpened property false or true based on it. also store the lastSeenData in a state where we can modify it

        for (let i = 0; i < convs.length; i++) {
          let latest_message = messageData[i];
          let readConv = lastSeenTimesRef.current[i].date > latest_message.date;

          console.log(
            readConv,
            new Date(lastSeenTimesRef.current[i].date),
            new Date(latest_message.date)
          );

          convs[i]["newMessageOpened"] = readConv; //if the last seen time of the conversation is less than the date of the latest message in that conversation, the conversation is unread
        }

        setAllConversations(convs);

        let all_messages = [];

        for (let i = 0; i < messageData.length; i++) {
          let preview = null;
          let currentMessage = JSON.parse(messageData[i].message);
          if (
            currentMessage.from &&
            currentMessage.type &&
            currentMessage.type === "text"
          ) {
            preview = `${currentMessage.from}: ${currentMessage.text}`;
          } else if (
            currentMessage.from &&
            currentMessage.type &&
            currentMessage.type === "image"
          ) {
            preview = `${currentMessage.from} sent an image`;
          } else if (
            currentMessage.from &&
            currentMessage.type &&
            currentMessage.type === "file"
          ) {
            preview = `${currentMessage.from} sent a file`;
          }
          let obj = {
            conversationUID: convs[i].uid,
            opened: false,
            messages: [],
            LastEvaluatedKey: null
          };

          all_messages.push(obj);
          convs[i]["preview"] = preview;
        }
        setConversationMessages(all_messages); //this state stores all the messages of each opened conversation so we do not have to keep fetching from database . updates through sockets when user receives messages when online

        let all_users = [];
        //also make an array of objects to store the users of each conversation (only when needed)
        for (let i = 0; i < messageData.length; i++) {
          let obj = {
            conversationUID: convs[i].uid,
            users: [], //empty because there are no previous messages, except for the test message which does not represent anything except act as a placeholder for the latest message in the beginning
          };
          all_users.push(obj);
        }
        conversationUsers.current = all_users;

        return response.conversations.conversations;
      } else {
        console.log("try catch error fetching conversations");
        return {
          error: response.error,
        };
      }
    } catch (error) {
      return {
        error: error.message,
      };
    }
  };

  const sendLastSeenData = async () => {
    let url = baseServerUrl + "/sendLastSeenData";

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: JSON.stringify(lastSeenTimesRef.current),
          user_email: currentUser.email,
          user_uid: currentUser.uid,
        }),
      });
    } catch (error) {
      console.log(error);
    }
  };
  const handleTabClosing = () => {
    sendLastSeenData();
  };
  //not done yet, still working on it. Also need a method to get latest message from each conversation on app startup
  const getAllMessagesFromConversation = async (conversationID) => {
    if (currentUser) {
      const email = currentUser.email;
      const uid = currentUser.uid;

      let url =
        baseServerUrl +
        `/getConversationMessages/${email}/${uid}/${conversationID}`;

      try {
        let response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        response = await response.json();
        let lastEvaluatedKey = response.data.LastEvaluatedKey; ///if LastEvaluatedKey is undefined or null, then you got every message until the beginning
        if (!response.error) {
          //set states with the response i guess

          let messages = response.data.Items;

          function compare(a, b) {
            if (a.date > b.date) {
              return 1;
            }
            if (a.date < b.date) {
              return -1;
            }
            return 0;
          }
          messages.sort(compare);

          for (let i = 0; i < conversationMessages.length; i++) {
            if (conversationMessages[i].conversationUID === conversationID) {
              let obj = conversationMessages[i];
              console.log(Object.keys(obj));
              obj.messages = messages;
              obj.LastEvaluatedKey = lastEvaluatedKey;
            
              break;
            }
          }
          forceUpdate();

          console.log(conversationMessages);

          return response;
        } else {
          console.log(response.error);
          return {
            error: response.error,
          };
        }
      } catch (error) {
        return {
          error: error.message,
        };
      }
    } else {
      return {
        error: "CurrentUser is null, cannot fetch messages",
      };
    }
  };
  const getAllUsersFromConversation = async (conversationID) => {
    let url = baseServerUrl + `/getSingleConversationUsers/${conversationID}`;

    try {
      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      response = await response.json();
      if (!response.error) {
        for (let i = 0; i < conversationUsers.current.length; i++) {
          if (conversationID === conversationUsers.current[i].conversationUID) {
            conversationUsers.current[i].users = response.data;
            break;
          }
        }

        //console.log(conversationUsers.current);
      } else {
        console.log(response.error);
        return {
          error: response.error,
        };
      }
    } catch (error) {
      return {
        error: error.message,
      };
    }
  };
  const createNewConversation = async (
    conversation_name,
    conversation_uid,
    usersToAdd
  ) => {
    if (currentUser) {
      //creator information
      const creator_email = currentUser.email;
      const creator_uid = currentUser.uid;

      let url = baseServerUrl + `/createConversation`;

      let body = {
        conversationName: conversation_name,
        conversationUID: conversation_uid,
        conversationCreatorEmail: creator_email,
        conversationCreatorUID: creator_uid,
        usersToAdd: usersToAdd,
        dateModified: Date.now(),
      };

      try {
        let response = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        response = await response.json();
        //what we want to do is to add the resulting conversation as well as add the messagelist
        console.log(response);

        //we want to add the users in this new conversation into the ref keeping track of the users in a particular conversation, so we can use it when broadcasting socket events
        let users = [];
        for (let i = 0; i < usersToAdd.length; i++) {
          users.push({
            email: usersToAdd[i],
          });
        }
        if (response.result) {
          if (allConversations && allConversations.length > 0) {
            setAllConversations([response.result, ...allConversations]);
            setConversationMessages([
              { conversationUID: conversation_uid, messages: [] },
              ...conversationMessages,
            ]);

            if (conversationUsers.current) {
              conversationUsers.current.push({
                conversationUID: conversation_uid,
                users: users, //////////////////////////////////////////////////////////This will only contain an object with the email. will need to re-fetch later
              });
            }
          } else {
            setAllConversations([response.result]);
            setConversationMessages([
              { conversationUID: conversation_uid, messages: [] },
            ]);
            conversationUsers.current = [
              {
                conversationUID: conversation_uid,
                users: users, //////////////////////////////////////////////////////////This will only contain an object with the email. will need to re-fetch later
              },
            ];
          }
          //send socket event to the other recipients for an invite

          socket.emit("created-conversation", {
            name: conversation_name,
            uid: conversation_uid,
            dateModified: null,
            admin_uid: creator_uid,
            admin_email: creator_email,
            usersToAdd: usersToAdd,
          });
          //also deal with special characters such as apostrophies
        } else {
          return {
            error: response.error,
          };
        }
        return response;
      } catch (err) {
        return {
          error: err.message,
        };
      }
    } else {
      return {
        error: "current user is null, cannot create conversation",
      };
    }
  };
  const sendMessageToConversation = async (conversationUID, message) => {
    let url = baseServerUrl + "/sendMessage";

    try {
      let response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationUID: conversationUID,
          message: message,
        }),
      });
      response = await response.json();

      if (!response.error) {
        //get recipients objects (user objects)
        let recipients = [];
        for (let i = 0; i < conversationUsers.current.length; i++) {
          if (
            conversationUsers.current[i].conversationUID === conversationUID
          ) {
            recipients = conversationUsers.current[i].users;
          }
        }

        //update our own screen now
        let index = -1;
        for (let i = 0; i < conversationMessages.length; i++) {
          if (conversationMessages[i].conversationUID === conversationUID) {
            index = i;
            break;
          }
        }
        conversationMessages[index].messages.push(message);
        setCurrentConversationMessages(conversationMessages[index]);

        forceUpdate();

        let j = -1;
        for (let i = 0; i < allConversations.length; i++) {
          if (allConversations[i].uid === conversationUID) {
            j = i;
            break;
          }
        }

        //setting up the message preview to show on list of conversations
        let preview = null;
        let currentMessage = message;
        if (
          currentMessage.from &&
          currentMessage.type &&
          currentMessage.type === "text"
        ) {
          preview = `${currentMessage.from}: ${currentMessage.text}`;
        } else if (
          currentMessage.from &&
          currentMessage.type &&
          currentMessage.type === "image"
        ) {
          preview = `${currentMessage.from} sent an image`;
        } else if (
          currentMessage.from &&
          currentMessage.type &&
          currentMessage.type === "file"
        ) {
          preview = `${currentMessage.from} send a file`;
        }

        if (j !== 0) {
          let oldFirstConv = structuredClone(allConversations[0]);

          let elementsBeforeJ = [...allConversations.slice(1, j)];

          let newFirstConv = structuredClone(allConversations[j]);
          let elementsAfterJ;
          if (j < allConversations.length - 1) {
            elementsAfterJ = [...allConversations.slice(j + 1)];
          }

          newFirstConv["preview"] = preview;

          if (j < allConversations.length - 1) {
            setAllConversations([
              newFirstConv,
              oldFirstConv,
              ...elementsBeforeJ,
              ...elementsAfterJ,
            ]);
          } else {
            setAllConversations([
              newFirstConv,
              oldFirstConv,
              ...elementsBeforeJ,
            ]);
          }
        } else {
          allConversations[0]["preview"] = preview;
          forceUpdate();
        }

        if (!response.error) {
          socket.emit("received-message", {
            conversationUID: conversationUID,
            message: message,
            recipients: recipients,
          });
          console.log("message socket event sent");
        }
      }

      return response;
    } catch (e) {
      console.log(e);
      return e;
    }
  };
  const sendFileToConversation = async (
    conversationUID,
    messageBody,
    formData
  ) => {
    let url = "";

    if (messageBody.type === "image") {
      url = baseServerUrl + "/sendImageMessage";
    } else if (messageBody.type === "file") {
      url = baseServerUrl + "/sendFileMessage";
    }

    try {
      let response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      response = await response.json();

      let message = response.message;
      console.log(message);

      if (!response.error) {
        //get recipients objects (user objects)
        let recipients = [];
        for (let i = 0; i < conversationUsers.current.length; i++) {
          if (
            conversationUsers.current[i].conversationUID === conversationUID
          ) {
            recipients = conversationUsers.current[i].users;
          }
        }

        //update our own screen now
        let index = -1;
        for (let i = 0; i < conversationMessages.length; i++) {
          if (conversationMessages[i].conversationUID === conversationUID) {
            index = i;
            break;
          }
        }
        conversationMessages[index].messages.push(message);
        setCurrentConversationMessages(conversationMessages[index]);

        forceUpdate();

        let j = -1;
        for (let i = 0; i < allConversations.length; i++) {
          if (allConversations[i].uid === conversationUID) {
            j = i;
            break;
          }
        }

        if (j !== 0) {
          let oldFirstConv = structuredClone(allConversations[0]);

          let elementsBeforeJ = [...allConversations.slice(1, j)];

          let newFirstConv = structuredClone(allConversations[j]);
          let elementsAfterJ;
          if (j < allConversations.length - 1) {
            elementsAfterJ = [...allConversations.slice(j + 1)];
          }

          if (j < allConversations.length - 1) {
            setAllConversations([
              newFirstConv,
              oldFirstConv,
              ...elementsBeforeJ,
              ...elementsAfterJ,
            ]);
          } else {
            setAllConversations([
              newFirstConv,
              oldFirstConv,
              ...elementsBeforeJ,
            ]);
          }
        }

        if (!response.error) {
          socket.emit("received-message", {
            conversationUID: conversationUID,
            message: message,
            recipients: recipients,
          });
          console.log("message socket event sent");
        }
      }

      return response;
    } catch (e) {
      console.log(e);
      return e;
    }
  };
  const getConversationUsersFromEmails = async (emails) => {
    let url = baseServerUrl + "/getConversationUsersFromEmails";

    try {
      let response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: emails,
        }),
      });
      response = await response.json();
      console.log(response);
      setCurrentConversationUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const leaveConversation = async (conversationUID) => {
    //delete all the objects in all the arrays regarding your relation to that conversation (after sending the request to the server)
    let url = baseServerUrl + "/leaveConversation";

    try {
      let response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationUID: conversationUID,
          userUID: currentUser.uid,
          userEmail: currentUser.email,
        }),
      });

      response = await response.json();
      console.log(response);

      if (!response.error) {
        let index = -1;
        for (let i = 0; i < allConversations.length; i++) {
          if (allConversations[i].uid === conversationUID) {
            index = i;
            break;
          }
        }
        //remove the conversation from the list
        if (index >= 0) {
          if (index !== allConversations.length - 1) {
            setAllConversations([
              ...allConversations.slice(0, index),
              ...allConversations.slice(index + 1),
            ]);
          } else {
            setAllConversations([...allConversations.slice(0, index)]);
          }
        }

        //next remove the conversation messages
        index = -1;
        for (let i = 0; i < conversationMessages.length; i++) {
          if (conversationMessages[i].conversationUID === conversationUID) {
            index = i;
            break;
          }
        }
        if (index !== -1) {
          if (index !== allConversations.length - 1) {
            setConversationMessages([
              ...conversationMessages.slice(0, index),
              ...conversationMessages.slice(index + 1),
            ]);
          } else {
            setConversationMessages([...conversationMessages.slice(0, index)]);
          }
        }
        //remove the users list from the ref
        index = -1;
        for (let i = 0; i < conversationUsers.current.length; i++) {
          if (
            conversationUID === conversationUsers.current[i].conversationUID
          ) {
            index = i;
            break;
          }
        }
        if (index !== -1) {
          socket.emit("left-conversation", {
            conversationUID: conversationUID,
            user_email: currentUser.email,
            recipients: conversationUsers.current[index].users,
          });
          console.log("conversation leaving socket event sent");
          conversationUsers.current.splice(index, 1);
        }
        //remove the last seen array item for that conversation
        index = -1;
        for (let i = 0; i < lastSeenTimesRef.current.length; i++) {
          if (conversationUID === lastSeenTimesRef.current[i].conversationUID) {
            index = i;
            break;
          }
        }
        if (index !== -1) {
          lastSeenTimesRef.current.splice(index, 1);
        }

        setSelectedConversation(null);
        previousSelectedConversation.current = null;
        setCurrentConversationUsers(null);
        setCurrentConversationMessages(null);
        setCurrentConversationAdmin(null);
        setCurrentConversationName(null);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const addUsersToConversation = async (conversationUID, emails) => {
    
  }

  const loadMoreMessages = async () =>{
    //selectedConversation
    //currentConversationMessages.LastEvaluatedKey

    let url = baseServerUrl + "/getMoreMessages";

    let response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationUID: selectedConversation,
        userUID: currentUser.uid,
        userEmail: currentUser.email,
        LastEvaluatedKey: JSON.stringify(currentConversationMessages.LastEvaluatedKey),
      }),
    });

    response = await response.json();

    console.log("MORE MESSAGES RESPONSE", response);

  }

  const value = {
    getAllConversations,
    allConversations,
    selectedConversation,
    setSelectedConversation,
    getAllMessagesFromConversation,
    sendLastSeenData,
    createNewConversation,
    sendMessageToConversation,
    currentConversationMessages,
    getAllUsersFromConversation,
    messagesLoading,
    loading,
    currentConversationUsers,
    currentConversationName,
    currentConversationAdmin,
    setCurrentConversationUsers,
    setCurrentConversationName,
    setCurrentConversationAdmin,
    getConversationUsersFromEmails,
    sendFileToConversation,
    leaveConversation,
    loadMoreMessages,
  };
  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}
