const io = require('socket.io');
const randomString = require('random-string');
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
        this.cardRequests = [];
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
     * Called when another player requests a card from this player.
     * 
     * @param {Player} player 
     * @param {Number} index 
     */
    requestCard(player, index) {
        if (this.cardRequests.find(({ player: p }) => (p.id === player.id))) {
            throw new Error('You can only request one card at a time.');
        }

        if (this.hand.length <= index) {
            throw new Error('Card no longer exists.');
        }

        this.cardRequests.push({
            id: randomString(),
            player,
            card: this.hand[index],
        });

        this.report();
    }

    /**
     * Accepts a card request.
     * 
     * @param {string} id 
     */
    acceptCardRequest(id) {
        // Find the request.
        const requestIndex = this.cardRequests.findIndex(({ id: i }) => i === id);

        if (requestIndex > -1) {
            // Remove it.
            const [request] = this.cardRequests.splice(requestIndex, 1);

            // Pass it from my hand to their hand.
            request.player.hand.push(request.card);
            this.hand.splice(this.hand.indexOf(request.card));

            // Remove any other requests that have that card.
            this.cardRequests = this.cardRequests.filter(({ card }) => card !== request.card);

            // Report back to the requester.
            request.player.emit('card-request-accepted', this.name);
        }

        this.report();
    }

    /**
     * Rejects a card request.
     * 
     * @param {string} id 
     */
    rejectCardRequest(id) {
        // Find the request.
        const requestIndex = this.cardRequests.findIndex(({ id: i }) => i === id);

        if (requestIndex > -1) {
            // Remove it.
            const [request] = this.cardRequests.splice(requestIndex, 1);

            // Report back to the requester.
            request.player.emit('card-request-rejected', this.name);
        }

        this.report();
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

        socket.on('request-card', (playerId, index, callback) => {
            // Find the player.
            const player = this.room.players.find(({ id }) => id === playerId);

            if (player) {
                const card = player.hand[index];

                if (card) {
                    try {
                        player.requestCard(this, index);
                        callback();
                    } catch (e) {
                        callback({
                            message: e.message || 'Error',
                        });
                    }
                }
            }

            this.report();
        });

        socket.on('accept-card-request', this.acceptCardRequest.bind(this));
        socket.on('reject-card-request', this.rejectCardRequest.bind(this));

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
        const { id, name, hand, cardRequests } = this;

        return {
            id,
            name,
            hand,
            cardRequests: cardRequests.map(({ player, ...rest }) => ({
                ...rest,
                player: player.getPublicState(),
            })),
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
