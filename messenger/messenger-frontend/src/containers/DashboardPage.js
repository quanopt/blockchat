import React from "react";

import { withRouter } from 'react-router';
import { connect } from "react-redux";

import HeaderBar from "../components/HeaderBar";
import UserList from "../components/UserList";
import MessagesDisplay from "../components/MessagesDisplay";
import MessageSender from "../components/MessageSender";

class DashboardPage extends React.Component {
    constructor() {
      super();
      this.state = { intervalHandle: null };
    }

    componentDidMount() {
        let user = localStorage.getItem('user');
        if (user === null) {
          this.props.history.push('/login');
          return;
        }
        try {
          user = JSON.parse(user);
        } catch (err) {
          this.props.history.push('/login');
          return;
        }
        this.props.dispatch({type: "API_LOGIN_SUCCESS", user: user});
        this.props.dispatch({type: "GET_USERS"});
        this.setState({
          intervalHandle: setInterval(this.refreshMessages, 2000),
        });
    }

    componentWillUnmount() {
        if (this.state.intervalHandle) clearInterval(this.state.intervalHandle);
    }

    refreshMessages = () => {
      this.props.dispatch({type: "GET_MESSAGES"});
    }

    render() {
        return (
            <div style={styles.pageContainer}>
                <HeaderBar history={this.props.history} />
                <div style={styles.mainContainer}>
                    <UserList style={styles.listColumn} />

                    <div style={styles.contentColumn}>
                      <MessagesDisplay style={styles.messagesRow} />
                      <MessageSender style={styles.sendMessageRow} />
                    </div>
                </div>
            </div>
        );
    }
}

const styles = {
    mainContainer: {
      display: 'flex',
      flexDirection: 'row',
      flex: 1,
      alignItems: 'stretch',
    },
    pageContainer: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    listColumn: {
      width: 240,
      margin: 10,
      display: 'flex',
      flexDirection: 'column',
    },
    contentColumn: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      margin: 10,
      marginLeft: 0,
    },
    messagesRow: {
      display: 'flex',
      flexDirection: 'column',
      flex: 2,
      overflow: 'auto',
      marginBottom: 10,
    },
    sendMessageRow: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      padding: 10,
    }
};

export default connect()(DashboardPage);
