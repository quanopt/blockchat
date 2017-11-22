/* @flow */

const initialState = {
  loginState: 'loggedOut',
  selectedUser: null,
  error: null,

  user: {
    username: "testuser",
    name: "Test User",
    token: "",
  },
  users: ['user1', 'user2'],

  messages: [
    {
      from: 'user1',
      date: new Date(2017, 6, 2),
      text: 'Hello'
    },
    {
      from: 'user1',
      date: new Date(2017, 6, 4),
      text: 'Testing messaging'
    },
    {
      from: 'user2',
      date: new Date(2017, 6, 2),
      text: 'Hello'
    },
    {
      to: 'user2',
      date: new Date(2017, 6, 3),
      text: 'Hi'
    },
  ],

  MessageSender: {
    to: '',
    message: '',
    sending: false,
  }
};

export default (state = initialState, action) => {
    switch (action.type) {
        // MessageSender
        case "MESSAGE_SENDER_TO":
            return {...state, MessageSender: {...state.MessageSender, to: action.to}}
        case "MESSAGE_SENDER_MESSAGE":
            return {...state, MessageSender: {...state.MessageSender, message: action.message}}

        // LOGIN
        case "API_LOGIN_REQUESTED":
            return {...state, loginState: 'pending'};
        case "API_LOGIN_ERROR":
            return {...state, loginState: 'loggedOut', error: action.error};
        case "API_LOGIN_FAILED":
            return {...state, loginState: 'loggedOut', error: action.error};
        case "API_LOGIN_SUCCESS":
            localStorage.setItem('user', JSON.stringify(action.user));
            return {...state, loginState: 'loggedIn', user: action.user};
        case "API_LOGOUT":
            localStorage.removeItem('user');
            return {...state, loginState: 'loggedOut', user: {}}

        case "UPDATE_USER_LIST":
            console.log(action);
            if (action.users === null) {
              return {...state, users: []};
            }
            let userList = action.users.slice();
            let pos = userList.map(u => u.Username).indexOf(state.user.username);
            if (pos !== -1) {
              userList.splice(pos, 1);
            }
            return {...state, users: userList};

        case "API_GET_MESSAGES":
            if (action.messages === undefined || action.messages === null) {
              return {...state, messages: []}
            }
            if (!action.messages.Outbox) action.messages.Outbox = [];
            else {
              action.messages.Outbox = action.messages.Outbox.map(m => {
                return {
                  to: m.To,
                  date: new Date(Date.parse(m.Date.slice(0, 19))),
                  text: m.Content,
                }; 
              });
            }
            if (!action.messages.Inbox) action.messages.Inbox = [];
            else {
              action.messages.Inbox = action.messages.Inbox.map(m => {
                return {
                  from: m.From,
                  date: new Date(Date.parse(m.Date.slice(0, 19))),
                  text: m.Content,
                };
              });
            }

            return {...state, messages: [...action.messages.Outbox, ...action.messages.Inbox]}
        
        case "API_MESSAGE_SENDING":
            return {...state, MessageSender: {...state.MessageSender, sending: true}};
        case "API_MESSAGE_SENT":
            return {...state, MessageSender: {...state.MessageSender, message: '', sending: false}};
        case "SEND_MESSAGE_FAILED":
            return {...state, MessageSender: {...state.MessageSender, sending: false}, error: 'Error while sending message!'};
        case "DASHBOARD_SELECT":
            return {...state, selectedUser: action.index};
        
        case "SET_ERROR":
            return {...state, error: action.message};
        case "CLEAR_ERROR":
            return {...state, error: null};
        default:
            return state;
    }
}
