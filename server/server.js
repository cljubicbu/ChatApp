const express = require('express')
const app = express()
const http = require('http').Server(app)
const bodyParser = require('body-parser')
const MongoClient = require('mongodb')
const io = require('socket.io')(http)

var db
var json = {
    prvi: "first",
    subModules: [{
        name: "prvi submodul",
        content: "aigoapw ngwpapgn w fnawe"
    }, {

        name: "drugi submodul",
        content: "aigoapw ngwpapgn w fnawe"
    }]
}
MongoClient.connect('mongodb://root:runescape1996@ds018708.mlab.com:18708/testingdb', (err, client) => {
    if (err) return console.error(err)

    db = client.db('testingdb')
})
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(express.static("client"));

app.get('/', function (req, res) {
    res.sendFile('index.html')
    // db.collection('quotes').insert(json, (err, result) => {
    //     if (err) return console.error(err)

    //     console.log('saved to database', json._id)
    // })
})

// socket

io.on('connection', function(socket) {
    console.log('a user connected')
    socket.on('usernameDeclaration', (data) => {
        socket.username = data.username
        console.log('username decared: ' + data.username)
    })
    socket.on('message', (data) => {
        console.log('message sent from user: ' + data.username)
        socket.broadcast.emit('message', data)
    })
})

http.listen(process.env.PORT || 3000)