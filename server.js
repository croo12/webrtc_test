const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)

app.use('/', express.static('public'))

io.on('connection', (socket) => {
    socket.on('join', (roomId) => {
        console.log(` room Id is ${roomId}`);
        const roomCli = io.sockets.adapter.rooms.get(roomId)
        // const numberOfCli = roomCli;
        console.log(io.sockets.adapter.rooms);
        console.log(io.sockets.adapter.rooms.get(roomId));
        console.log(roomCli);
        //These events only to the sender socket
        if( roomCli == undefined ){
            console.log(`Creating room ${roomId}`);
            socket.join(roomId);
            socket.emit('room_created', roomId)
        } else if ( roomCli != undefined ) {
            console.log(`Joining Room ${roomId}`);
            socket.join(roomId);
            socket.emit('room_joined', roomId)
        } else {
            console.log(`Cant Join Room ${roomId}`);
            socket.emit('full_room', roomId);
        }
    })
        //....
    socket.on('start_call', (roomId) => {
        console.log(`broadcasting start_call ${roomId}`);
        socket.broadcast.to(roomId).emit('start_call');
    })
    socket.on('webrtc_offer', (e) => {
        console.log(`broadcasting webrtc_offer ${e.roomId}`);
        socket.broadcast.to(e.roomId).emit('webrtc_offer', e.sdp);
    })
    socket.on('webrtc_answer', (e) => {
        console.log(`broadcasting webrtc_answer ${e.roomId}`);
        socket.broadcast.to(e.roomId).emit('webrtc_answer', e.sdp);
    })
    socket.on('webrtc_ice_candidate', (e) => {
        console.log(`broadcasting start_call ${e.roomId}`);
        socket.broadcast.to(e.roomId).emit('webrtc_ice_candidate', e);
    })
})

//START SERVER ======

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Express Server Listening on port ${port}`);
})