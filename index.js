const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require('cors');
const redis = require("redis");
const utils = require("./utils")

const app = express();
const server = app.listen( 3000, () => {
    console.log("Server is now running on port 3000..")
})
const io = socketio(server)

// redis client connection
const redis_client = redis.createClient({
    host: 'localhost',
    port: 6379
})
redis_client.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log(err.message);
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});


io.on('connection', (socket) => {

    // create a new game
    socket.on('createGame', (data) => {
        let gameId = utils.generateGameId();
        let username = data.username;
        socket.join(gameId);
        redis_client.set(gameId, JSON.stringify(
            { player1: {username: username, socketId: socket.id }}
        ));
        socket.emit('gameCreated', { gameId });
    });

    // join an existing game
    socket.on('joinGame', async (data) => {
        const gameId = data.gameId;
        const username = data.username
        socket.join(gameId);
        console.log(gameId, username);

        const gameData = await redis_client.get(gameId);

        if (gameData) {
            console.log("Game Data", gameData)
            const data = JSON.parse(gameData);
            data.player2 = { username: username, socketId: socket.id};
            redis_client.set(gameId, JSON.stringify(data));
            io.to(gameId).emit('gameJoined', { gameId, username });
        } else {
            socket.emit('invalidGame');
        }
    });

    // make a move on the board
    socket.on('makeMove', (data) => {
        const gameId = data.gameId;
        console.log(data)
        io.to(gameId).emit('moveMade', { ...data });
    })
})



