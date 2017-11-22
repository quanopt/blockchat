import React from "react";
import {connect} from "react-redux";
import {Paper} from "material-ui";

import {Colors} from "../MessengerTheme";
import TextItem from "./TextItem";

class IncomingMessage extends React.Component {
    render() {
        return (
            <div style={styles.messageContainerLeft}>
                <div style={styles.messageTriangleLeft}></div>
                <div style={styles.messageTextContainerLeft}>
                    {this.props.text}
                </div>
            </div>
        );
    }
}

class OutgoingMessage extends React.Component {
    render() {
        return (
            <div style={styles.messageContainerRight}>
                <div style={styles.messageTextContainerRight}>
                    {this.props.text}
                </div>
                <div style={styles.messageTriangleRight}></div>
            </div>
        );
    }
}

class MessagesDisplay extends React.Component {
    render() {
        console.log(this.props);
        let title = "Select a user to see messages";
        let messages = [];
        console.log(this.props.messages.filter(m => {
            return m.from === this.props.selectedUserUsername || m.to === this.props.selectedUserUsername;
        }).sort((a, b) => {
            return a.date > b.date;
        }));

        if (this.props.selectedUserName !== null) {
            title = `Messages from ${this.props.selectedUserName}`;
            this.props.messages.filter(m => {
                return m.from === this.props.selectedUserUsername || m.to === this.props.selectedUserUsername;
            }).sort((a, b) => {
                return a.date > b.date;
            }).forEach((m,i) => {
                if (m.to !== this.props.selectedUserUsername ) {
                    messages.push((<IncomingMessage key={`message-${i}`} text={m.text} />));
                } else {
                    messages.push((<OutgoingMessage key={`message-${i}`} text={m.text} />));
                }
            });
        }

        return (
            <Paper style={this.props.style}>
                <TextItem text={title} />
                <div style={styles.messagesContainer}>
                    {messages}
                </div>
            </Paper>
        );
    }
}

const styles = {
    messagesContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'stretch',
        marginLeft: 10,
        marginRight: 10,
        overflowY: 'auto',
    },
    messageContainerLeft: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 5,
    },
    messageContainerRight: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    messageTriangleRight: {
        width: 0,
        height: 0,
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        borderLeft: "6px solid " + Colors.messenger.primary3,
    },
    messageTriangleLeft: {
        width: 0,
        height: 0,
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        borderRight: "6px solid " + Colors.messenger.primary3,
    },
    messageTextContainerLeft: {
        backgroundColor: Colors.messenger.primary3,
        maxWidth: '80%',
        padding: "4px 8px 4px 8px",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
    },
    messageTextContainerRight: {
        backgroundColor: Colors.messenger.primary3,
        maxWidth: '80%',
        padding: "4px 8px 4px 8px",
        borderTopLeftRadius: 10,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
    },
}

function mapStateToProps(state) {
    return {
        selectedUserName: state.api.selectedUser === null ? null : state.api.users[state.api.selectedUser].Fullname,
        selectedUserUsername: state.api.selectedUser === null ? null : state.api.users[state.api.selectedUser].Username,
        messages: state.api.messages,
    }
}

export default connect(mapStateToProps)(MessagesDisplay);
