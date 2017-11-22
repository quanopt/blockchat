import React from 'react';
import { RaisedButton, Paper, TextField } from 'material-ui';
import { connect } from "react-redux";
import { withRouter } from 'react-router';

import { Colors } from "../MessengerTheme";

class LoginPage extends React.Component {

    constructor() {
        super();
        this.state = {
            username: '',
            password: '',
        };
    }

    componentDidMount() {
        /*let user = localStorage.getItem('user');
        if (user === null) return;
        try {
            user = JSON.parse(user);
        } catch (err) {
            return;
        }
        this.props.loginSuccessful(user);
        this.props.history.push('/dashboard');*/
    }

    formValid = () => {
        let errMsg = null;
        if (this.state.username === '') {
            errMsg = 'username'
        }
        if (this.state.password === '') {
            errMsg = errMsg ? ', password' : 'password';
        }
        if (errMsg) {
            this.props.setError('Please specify field(s): ' + errMsg + '!');
            return false;
        }
        return true;
    }

    onUsernameChange = e => {
        this.setState({ username: e.target.value });
        if (e.target.value === '') {
            this.props.setError('Please specify a username!');
        } else {
            this.props.clearError();
        }
    }

    onPasswordChange = e => {
        this.setState({ password: e.target.value });
        if (e.target.value === '') {
            this.props.setError('Please enter a password!');
        } else {
            this.props.clearError();
        }
    }

    onSignup = () => {
        this.props.history.push('/signup');
    }

    onLogin = () => {
        if (this.props.error !== null || !this.formValid()) {
            return;
        }
        this.props.login({
            history: this.props.history,
            username: this.state.username,
            password: this.state.password,
        });
    };

    render() {
        return (
            <div style={styles.mainContainer}>
                <Paper
                    style={styles.loginContainer}
                >
                    <div style={styles.banner}>
                      Fabric Messenger
                    </div>

                    <div style={styles.formContainer}>
                      <TextField
                        hintText="Username"
                        floatingLabelText="Username"
                        value={this.state.username}
                        onChange={this.onUsernameChange}
                      />
                      <TextField
                        hintText="Password"
                        floatingLabelText="Password"
                        type="password"
                        value={this.state.password}
                        onChange={this.onPasswordChange}
                      />
                    </div>

                    { this.props.error !== null &&
                        <div style={styles.errorContainer}>
                            {this.props.error}
                        </div>
                    }
                    <div style={styles.buttonContainer}>
                        <RaisedButton
                            label="Sign up"
                            onTouchTap={this.onSignup}
                        />
                        <RaisedButton
                            disabled={this.props.submitting}
                            primary
                            onTouchTap={this.onLogin}
                            label="Login"
                        />
                    </div>
                </Paper>
            </div>
        );
    }
}

const styles = {
    mainContainer: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        marginLeft: 30,
        marginRight: 30,
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: 20,
        marginBottom: 15,
    },
    banner: {
      display: 'flex',
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.messenger.primary,
      color: Colors.gray.xtral,
      fontSize: '1.5em',
    },
    errorContainer: {
        color: 'red',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

function mapStateToProps(state) {
    return {
        error: state.api.error,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        setError: (m) => { dispatch({ type: 'SET_ERROR', message: m }) },
        clearError: () => { dispatch({ type: 'CLEAR_ERROR' }) },
        login: (params) => { dispatch({ type: 'API_LOGIN_REQUESTED', ...params}) },
        loginSuccessful: (user) => { dispatch({type: "API_LOGIN_SUCCESS", user: user}) },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage);
