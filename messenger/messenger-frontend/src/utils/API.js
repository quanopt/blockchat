/* @flow */

import {stringify} from 'querystring';
let debug = require('../../../config.json').debug;

const baseURL = debug ? 'http://localhost:3000' : 'https://localhost:3000';

function getRequest(resource, params = null) {
    // TODO add authorization field to header

    let url = null;
    if (params) {
        url = baseURL + resource + '&' + stringify(params);
    } else {
        url = baseURL + resource;
    }
    return fetch(url, {
        method: 'GET',
        headers: {'Accept': 'application/json'},
    });
}

function postRequest(resource, params) {
    // TODO add authorization field to header
    const url = baseURL + resource;
    return fetch(url, {
        method: 'POST',
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify(params),
    });
}

export function signup(username, fullname, password) {
    return postRequest('/register', {
        username: username,
        fullname: fullname,
        password: password,
    });
}

export function login(username, password) {
    return postRequest('/login', {
        username: username,
        password: password,
    });
}

export function sendMessage(from, to, message, token) {
    return postRequest('/sendmessage', {
        username: from,
        from: from,
        to: to,
        content: message,
        token: token
    });
}

export function getMessages(username, token) {
    return postRequest('/getmessages', {
        username: username,
        token: token
    });
}

export function getUserList() {
    return postRequest('/getusers', {});
}