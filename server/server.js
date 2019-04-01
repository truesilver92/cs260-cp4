const _ = require('lodash');
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

mongoose.connect('mongodb://db:27017/doc', {
    useNewUrlParser: true
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const doc_schema = new mongoose.Schema({
    change_list: Array,
});
const doc_model = mongoose.model('doc', doc_schema);

let doc = {};
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
        sessions[token] = [...doc.change_list];
    }
    next();
});

app.use(express.static('/public'));

app.post('/api', async (req, res) => {
    doc.change_list.push(req.body);
    await doc.save();
    pushQueues(req.cookies.token, req.body);
    return res.sendStatus(200);
});

app.delete('/api/:gid', async (req, res) => {
    const gid = parseInt(req.params.gid);
    doc.change_list.push({'delete': gid});
    await doc.save();
    pushQueues(req.cookies.token, {'delete': gid});
    return res.sendStatus(200);
});

app.get('/api/diff', async (req, res) => {
    const res_results = await res.send(sessions[req.cookies.token]);
    sessions[req.cookies.token] = [];
    return res_results;
});

app.get('/api', async (req, res) => {
    return res.send(doc.change_list);
});

(async () => {
    let docs = await doc_model.find();
    if(docs.length === 0) {
        const n_doc = new doc_model({change_list: []});
        n_doc.save();
        docs = [n_doc];
    }
    doc = docs[0];
    app.listen(3000, () => console.log('Server listening on port 3000!'));
})();

