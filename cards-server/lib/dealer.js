const io = require('socket.io');
const Room = require('./room');
const Deck = require('./deck');

class Dealer {
    constructor() {
        this.room = null;
        this.sockets = [];
    }

    /**
     * Reports to the game that the player's state has changed.
     */
    report() {
        this.room.report(null);
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
        this.sockets.push(socket);
        this.report();

        socket.on('shuffle', () => {
            // Regenerate the room's deck.
            this.room.deck = new Deck();
            this.room.deck.shuffle();
            this.room.placements = [];

            // Remove everybody's cards.
            this.room.players.forEach((player) => {
                player.hand.splice(0, player.hand.length);
            });

            // Report back.
            this.report();
        });

        socket.on('deal', (playerId, faceDown = false) => {
            if (playerId) {
                // Find the player.
                const player = this.room.players.find(({ id }) => id === playerId);
    
                if (player) {
                    // Take from the deck.
                    const card = this.room.deck.deal();

                    if (card) {
                        player.hand.push(card);
                    }
                }
            } else {
                // Deal onto the board.
                const card = this.room.deck.deal();

                if (card) {
                    let cardList = [];

                    // Check if the last placement was by the dealer.
                    if (this.room.placements.length && this.room.placements[this.room.placements.length - 1].player === null) {
                        cardList = this.room.placements[this.room.placements.length - 1].cards;
                    } else {
                        this.room.placements.push({
                            player: null,
                            cards: cardList,
                        });
                    }

                    cardList.push({
                        card,
                        faceDown,
                    });
                }
            }

            this.report();
        });

        socket.on('return', (index) => {
            // Grab the placement.
            const placement = this.room.placements[index];

            if (placement) {
                const cards = placement.cards.map(({ card }) => card);

                // If a player placed them down return them to their hand.
                if (placement.player) {
                    const player = room.players.find(({ id }) => id === placement.player);
                    player.hand.push(...cards);
                } else {
                    // Otherwise return it to the deck.
                    this.room.deck.cards.push(...cards);
                }

                this.room.placements.splice(index, 1);
            }

            this.report();
        });

        socket.on('disconnect', () => {
            this.sockets.splice(this.sockets.indexOf(socket), 1);
            this.report();
        });
    }
}

module.exports = Dealer;
