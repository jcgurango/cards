const io = require('socket.io');
const Room = require('./room');

class Player {
    /**
     * 
     * @param {String} id 
     */
    constructor(id) {
        this.id = id;
        this.room = null;
        this.connected = false;
        this.sockets = [];
        this.hand = [];
        this.name = `#${id}`;
    }

    /**
     * Reports to the game that the player's state has changed.
     */
    report() {
        this.room.report(this);
    }

    /**
     * Emits a message to all sockets for this player.
     * 
     * @param {String | Symbol} event 
     * @param  {...any} args 
     */
    emit(event, ...args) {
        this.sockets.forEach((s) => s.emit(event, ...args));
    }

    /**
     * @param {Room} room 
     * @param {io.Socket} socket 
     */
    attach(room, socket) {
        this.room = room;
        this.connected = true;
        this.sockets.push(socket);
        this.report();

        // Rename the user.
        socket.on('name', (name) => {
            this.name = name;
            this.report();
        });

        socket.emit('entered');

        socket.on('place', (cards) => {
            const placeCards = cards.filter((card) => (this.hand.indexOf(card) > -1));
            this.hand = this.hand.filter((card) => (placeCards.indexOf(card) === -1));
            this.room.placements.push({
                player: this.id,
                cards: placeCards.map((card) => ({
                    card,
                    faceDown: false,
                })),
            });

            this.report();
        });

        socket.on('give-card', (playerId) => {
            if (this.hand.length > 0) {
                // Find the player.
                const player = this.room.players.find(({ id }) => id === playerId);

                if (player) {
                    // Pick a random card from the hand.
                    const cardIndex = Math.floor(Math.random() * this.hand.length);

                    // Remove it from the hand.
                    const [card] = this.hand.splice(cardIndex, 1);

                    // Place it in the other person's hand.
                    player.hand.push(card);
                }

                this.report();
            }
        });

        // Mark the player as not connected on disconnection.
        socket.on('disconnect', () => {
            this.sockets.splice(this.sockets.indexOf(socket), 1);
            this.connected = !!this.sockets.length;
            this.report();
        });
    }

    /**
     * Returns the data to show only to the player clients.
     */
    getPrivateState() {
        const { id, name, hand } = this;

        return {
            id,
            name,
            hand,
        };
    }

    /**
     * Returns the data to show to everybody.
     */
    getPublicState() {
        const { id, name, hand } = this;

        return {
            id,
            name,
            hand: hand.length,
        };
    }
}

module.exports = Player;
