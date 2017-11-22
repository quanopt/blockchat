/* @flow */

import {call, select, put, apply, takeLatest} from 'redux-saga/effects';
import * as API from '../API';

function* watchSignup(action) {
    try {
        const response = yield call(API.signup, action.username, action.fullname, action.password);
        if (!response.ok) throw 'Error';
        let data = yield apply(response, response.json);
        if(data.status === 'successful') {
            localStorage.setItem('user', JSON.stringify(data.user));
            action.history.push('/dashboard');
            yield put({type: 'API_LOGIN_SUCCESS', user: data.user});
            return;
        } else {
            throw 'Error';
        }
    } catch (err) {
        yield put({type: 'API_SIGNUP_FAILED'});
    }
}

function* watchLogin(action) {
    try {
        const response = yield call(API.login, action.username, action.password);
        if (!response.ok) throw 'Error';
        let data = yield apply(response, response.json);
        if (data.status === 'failed') {
            yield put({type: 'API_LOGIN_FAILED', error: 'Wrong password or username!'});
            return;
        } else if (data.status === 'successful') {
            localStorage.setItem('user', JSON.stringify(data.user));
            action.history.push('/dashboard');
            yield put({type: 'API_LOGIN_SUCCESS', user: data.user});
            return;
        } else {
            yield put({type: 'API_LOGIN_ERROR', error: 'Server error, please try later.'});
            return;
        }
    } catch (error) {
        yield put({type: 'API_LOGIN_FAILED'});
    }
}

function* getUsers(action) {
    try {
        const response = yield call(API.getUserList);
        if (!response.ok) throw 'Error!';
        let userData = yield apply(response, response.json);
        if (userData.status !== 'successful') throw 'Error!';
        yield put({type: 'UPDATE_USER_LIST', users: userData.users});
        return;
    } catch (err) {
        yield put({type: 'GET_USERS_ERROR'});
    }
}

function* sendMessage(action) {
    try {
        let { username, token } = yield select(state => state.api.user);     
        yield put({type: 'API_MESSAGE_SENDING'});
        const response = yield call(API.sendMessage, action.from, action.to, action.message, token);
        if (!response.ok) throw 'Error!';
        let data = yield apply(response, response.json);
        if (data.status === 'successful') {
            yield put({type: 'GET_MESSAGES'});
            yield put({type: 'API_MESSAGE_SENT'});
        } else {
            throw 'Error!';
        }
    } catch (err) {
        yield put({type: 'SEND_MESSAGE_FAILED'});
    }
}

function* getMessages(action) {
    try {
        let { username, token } = yield select(state => state.api.user);
        const response = yield call(API.getMessages, username, token);
        if (!response.ok) throw 'Error!';
        let data = yield apply(response, response.json);
        if (data.status !== 'successful') throw 'Error!';
        yield put({type: 'API_GET_MESSAGES', messages: data.messages, message: data.message});
    } catch (err) {
        yield put({type: 'GET_MESSAGES_FAILED'});
    }
}

export default function*() {
    yield [
        takeLatest('API_SIGNUP_REQUESTED', watchSignup),
        takeLatest('API_LOGIN_REQUESTED', watchLogin),
        takeLatest('SEND_MESSAGE', sendMessage),
        takeLatest('GET_MESSAGES', getMessages),
        takeLatest('GET_USERS', getUsers),
    ];
};
