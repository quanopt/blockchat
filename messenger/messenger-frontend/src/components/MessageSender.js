import React from "react";
import { connect } from "react-redux";
import { Paper, AutoComplete, TextField, RaisedButton } from "material-ui";

import TextItem from "./TextItem";

class MessageSender extends React.Component {
    constructor() {
        super();
        this.state = {
            toUnknown: false,
            to: '',
            message: '',
        }
    }

    handleSend = () => {
        let pos = this.props.fullnames.indexOf(this.props.to);
        console.log(this.props.to, this.props.usernames, pos);
        console.log({
            type: "SEND_MESSAGE",
            from: this.props.username,
            to: this.props.usernames[pos],
            message: this.props.message,
        });
        if (this.props.to === '' || this.props.message == '' || pos == -1) return;
        this.props.dispatch({
            type: "SEND_MESSAGE",
            from: this.props.username,
            to: this.props.usernames[pos],
            message: this.props.message,
        });
    }

    render() {
        return (
            <Paper style={this.props.style}>
                <TextItem text='Send message' />
                <div style={styles.messageContainer}>
                    <div style={styles.recipientRow}>
                        <AutoComplete
                            dataSource={this.props.fullnames}
                            disabled={this.props.sending}
                            floatingLabelText="Recipient"
                            filter={AutoComplete.fuzzyFilter}
                            onUpdateInput={(text) => {
                                console.log("RESETTING??A?SDF?ASFD");
                                if (this.props.fullnames.indexOf(text) === -1) {
                                    this.setState({ toUnknown: true });
                                    this.props.dispatch({ type: "MESSAGE_SENDER_TO", to: '' });
                                } else {
                                    this.setState({ toUnknown: false });
                                    this.props.dispatch({ type: "MESSAGE_SENDER_TO", to: text });
                                }
                            }}
                        />
                        {this.state.toUnknown &&
                            <div style={styles.errorMessage}>
                                You must choose the recipient from the list!
                          </div>
                        }
                    </div>
                    <TextField
                        style={{ marginTop: -20 }}
                        multiLine
                        rows={1}
                        disabled={this.props.sending}
                        fullWidth
                        floatingLabelText="Message"
                        value={this.props.message}
                        onChange={(e) => {
                            this.props.dispatch({ type: "MESSAGE_SENDER_MESSAGE", message: e.target.value });
                            this.props.dispatch({ type: "CLEAR_ERROR" });
                        }}
                    />
                    {this.props.error !== null &&
                        <div style={styles.errorContainer}>
                            {this.props.error}
                        </div>
                    }
                    <RaisedButton
                        primary
                        disabled={this.props.sending}
                        label="Send"
                        onTouchTap={this.handleSend}
                    />
                </div>
            </Paper>
        );
    }
}

const styles = {
    messageContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        margin: 10,
        overflowY: 'auto',
    },
    to: {
        marginRight: 10
    },
    recipientRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: "center",
    },
    errorMessage: {
        color: 'red',
        marginBottom: 10,
        marginLeft: 10,
        alignSelf: 'flex-end'
    }
}

function mapStateToProps(state) {
    return {
        fullnames: state.api.users.map(u => u.Fullname),
        usernames: state.api.users.map(u => u.Username),
        username: state.api.user.username,
        message: state.api.MessageSender.message,
        to: state.api.MessageSender.to,
        sending: state.api.MessageSender.sending,
        error: state.api.error,
    }
}

export default connect(mapStateToProps)(MessageSender);
