import React from 'react';
import { RaisedButton, Paper, TextField } from 'material-ui';
import { connect } from "react-redux";
import { withRouter } from 'react-router';

import { Colors } from "../MessengerTheme";

class SignUpPage extends React.Component {

    constructor() {
        super();
        this.state = {
            username: '',
            fullname: '',
            password: '',
            passwordConfirm: '',
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
        this.props.dispatch({ type: "API_LOGIN_SUCCESS", user: user });
        this.props.history.push('/dashboard');*/
    }

    formValid = () => {
        let errMsg = null;
        if (this.state.username === '') {
            errMsg = 'username'
        }
        if (this.state.fullname === '') {
            errMsg = errMsg ? ', fullname' : 'fullname';
        }
        if (this.state.password === '') {
            errMsg = errMsg ? ', password' : 'password';
        }
        if (this.state.passwordConfirm === '') {
            errMsg = errMsg ? ', password confirmation': 'password confirmation';
        }
        if (errMsg) {
            this.props.setError('Please specify fields: ' + errMsg + '!');
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

    onFullnameChange = e => {
        this.setState({ fullname: e.target.value });
        if (e.target.value === '') {
            this.props.setError('Please specify your full name!');
        } else {
            this.props.clearError();
        }
    }

    onPasswordChange = e => {
        this.setState({ password: e.target.value });
        if (e.target.value.length < 8) {
            this.props.setError('Password must be at least 8 characters!');
        } else {
            this.props.clearError();
        }
    }

    onPasswordConfirmChange = e => {
        this.setState({ passwordConfirm: e.target.value });
        if (this.state.password !== e.target.value) {
            this.props.setError('Passwords not matching!');
        } else {
            this.props.clearError();
        }
    }

    onBack = () => {
        this.props.history.push('/login');
    }

    onSignUp = () => {
        if (this.props.error !== null || !this.formValid()) {
            return;
        }
        this.props.signUp({
            history: this.props.history,
            username: this.state.username,
            fullname: this.state.fullname,
            password: this.state.password,
        });
    }

    render() {
        return (
            <div style={styles.mainContainer}>
                <Paper
                    style={styles.signUpContainer}
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
                            hintText="Full name"
                            floatingLabelText="Full name"
                            value={this.state.fullname}
                            onChange={this.onFullnameChange}
                        />
                        <TextField
                            hintText="Password"
                            floatingLabelText="Password"
                            type="password"
                            value={this.state.password}
                            onChange={this.onPasswordChange}
                        />
                        <TextField
                            hintText="Password confirmation"
                            floatingLabelText="Password confirmation"
                            type="password"
                            value={this.state.passwordConfirm}
                            onChange={this.onPasswordConfirmChange}
                        />
                    </div>

                    { this.props.error !== null &&
                        <div style={styles.errorContainer}>
                            {this.props.error}
                        </div>
                    }
                    <div style={styles.buttonContainer}>
                        <RaisedButton
                            label="Back"
                            onTouchTap={this.onBack}
                        />
                        <RaisedButton
                            disabled={this.props.submitting}
                            primary
                            onTouchTap={this.onSignUp}
                            label="Sign Up"
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
    signUpContainer: {
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
        signUp: (params) => { dispatch({ type: 'API_SIGNUP_REQUESTED', ...params }) },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SignUpPage);
