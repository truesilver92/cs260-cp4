const _ = require('lodash');
const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


let doc = [];
let sessions = {};

const pushQueues = (pusher_token, content) => {
    _.map(sessions, (queue, token) => {
        if(token !== pusher_token)
            queue.push(content);
    });
    console.log('pushing into queues');
    console.log(sessions);
};

const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use((req, res, next) => {
    const cookie = req.cookies.token;
    if(cookie === undefined) {
        // time to bake
        const token = Math.random().toString();
        res.cookie('token', token, {maxAge: 900000, httpOnly: true});
        sessions[token] = [...doc];
    }
    next();
});

app.use(express.static('/public'));

app.post('/api', async (req, res) => {
    doc.push(req.body);
    pushQueues(req.cookies.token, req.body);
    return res.sendStatus(200);
});

app.delete('/api/:gid', async (req, res) => {
    const gid = parseInt(req.params.gid);
    doc.push({'delete': gid});
    pushQueues(req.cookies.token, {'delete': gid});
    return res.sendStatus(200);
});

app.get('/api/diff', async (req, res) => {
    const res_results = await res.send(sessions[req.cookies.token]);
    sessions[req.cookies.token] = [];
    return res_results;
});

app.get('/api', async (req, res) => {
    return res.send(doc);
});

app.listen(3000, () => console.log('Server listening on port 3000!'));
