const { Socket } = require('dgram')
const express = require('express')
const http = require('http')

const app = express()
const server = http.createServer(app)

const { Server } = require('socket.io')
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

io.on('connection', (socket) => {

    socket.on('send_msg', (msg) => {
        socket.broadcast.emit('receive_msg', msg)
    })

    socket.on('login', (msg) => {
        socket.broadcast.emit('receiveLog', msg)
    })

    socket.on('disconnect', () => {
        console.log('user left')
    });

})

server.listen(3001, () => {
    console.log('server is running on port: 3001')
})
