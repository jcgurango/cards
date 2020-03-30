const io = require('socket.io');
const randomString = require('random-string');
const Room = require('../../lib/room');

const rooms = {
};

/**
 * @param {io.Server} io
 */
module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.once('room', (id, playerId) => {
            if (id) {
                if (!rooms[id]) {
                    rooms[id] = new Room(id);
                }

                // If they mention a room ID, connect them to that room.
                rooms[id].join(socket, playerId);
                return;
            }

            // Otherwise, create a new room for them and send them to that room
            const roomId = randomString();
            rooms[roomId] = new Room(roomId);
            socket.emit('room', roomId);
        });
    });
};
