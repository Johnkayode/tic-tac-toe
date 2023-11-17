const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const redis = require("redis");
const utils = require("./utils")

const app = express();
app.use(cors)
const server = http.createServer(app)
const io = socketIo(server)
const redis_client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

    // create a new game
    socket.on('createGame', (data) => {
        let gameId = utils.generateGameId();
        let username = data.username;
        socket.join(gameId);
        socket.emit('gameCreated', { gameId });
        redis_client.set(gameId, JSON.stringify(
            { player1: {username: username, socketId: socket.id }}
        ));
    });

    // join an existing game
    socket.on('joinGame', (data) => {
        const gameId = data.gameId;
        const username = data.username
        socket.join(gameId);
        redis_client.get(gameId, (err, gameData) => {
            if (err) throw err;

            if (gameData) {
                const data = JSON.parse(gameData);
                data.player2 = { username: username, socketId: socket.id};
                redis_client.set(gameId, JSON.stringify(data));
                io.to(gameId).emit('gameJoined', { gameId, username });
            } else {
                socket.emit('invalidGame');
            }
        })
    });

    // make a move on the board
    socket.on('makeMove', (data) => {
        const gameId = data.gameId;
        console.log(data)
        io.to(gameId).emit('moveMade', { ...data });
    })
})


app.listen( 3000, () => {
    console.log("Server is now running on port 3000..")
}
)


