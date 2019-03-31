
const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static('../public'));

let doc = [];

app.get('/stuff', (req, res) => {
    res.sendStatus(200);
});

app.post('/api', async (req, res) => {
    doc.push(req.body);
    console.log(req.body);
    return res.sendStatus(200);
});

app.delete('/api/:gid', async (req, res) => {
    const gid = parseInt(req.params.gid);
    doc.push({gid});
    console.log('delete: ' + gid);
    return res.sendStatus(200);
});

app.listen(3000, () => console.log('Server listening on port 3000!'));
