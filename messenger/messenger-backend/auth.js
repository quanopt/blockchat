const bcrypt = require('bcrypt-nodejs');
const fs = require('fs');
const crypto = require('crypto');

if (!fs.existsSync('users.json')) {
    fs.writeFileSync('users.json', '[]', 'utf8');
}

let tokenList = {};
function isTokenValid(username, token) {
    if (tokenList[username] != token) return false;
    return true;
}

function createUser(username, fullname, password, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        if(err) return callback(err);

        bcrypt.hash(password, salt, null, function(err, hash) {
            if(err) return callback(err);
            fs.readFile('users.json', 'utf8', (err, users) => {
                if (err) return callback(err);
                users = JSON.parse(users);
                let duplicate = users.find(u => u.username === username);
                if (duplicate) return callback('User already exists!');
                users.push({
                    username: username,
                    fullname: fullname,
                    password: hash,
                });
                fs.writeFile('users.json', JSON.stringify(users), 'utf8', (err) => {
                    if (err) return callback('Error writing users file!');
                    tokenList[username] = crypto.randomBytes(64).toString('hex');
                    callback(null, {username: username, fullname: fullname, token: tokenList[username]});
                });
            });
        });
    });
}

function verifyUser(username, password, callback) {
    fs.readFile('users.json', 'utf8', (err, users) => {
        if (err) return callback(err);
        users = JSON.parse(users);
        let user = users.find(u => u.username === username);
        if (!user) return callback('User does not exist!');
        bcrypt.compare(password, user.password, function(err, isMatch) {
            if(err) return callback(err);
            if (!isMatch) return callback('Wrong password!');
            tokenList[username] = crypto.randomBytes(64).toString('hex');
            callback(null, {username: user.username, fullname: user.fullname, token: tokenList[username]});
        });
    });
}

function removeUser(username) {
    fs.readFile('users.json', 'utf8', (err, users) => {
        if (err) return console.log(`User remove failed for: ${username}`);
        users = JSON.parse(users);
        let pos = users.findIndex(u => u.username === username);
        if (pos === -1) return console.log(`User remove for nonexisting user: ${username}`);
        users.splice(pos, 1);
        fs.writeFile('users.json', JSON.stringify(users), 'utf8', (err) => {
            if (err) return console.log(`File write error while user remove: ${username}`);
        });
    });
}

let auth = {
    createUser: createUser,
    verifyUser: verifyUser,
    removeUser: removeUser,
    isTokenValid: isTokenValid,
}

module.exports = auth;