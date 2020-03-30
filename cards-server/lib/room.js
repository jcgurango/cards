const io = require('socket.io');
const Player = require('./player');
const Dealer = require('./dealer');
const Deck = require('./deck');

class Room {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.placements = [];
        this.deck = new Deck();
        this.dealer = new Dealer();
    }

    getStateFor(player) {
        const { id, players, placements } = this;

        return {
            id,
            players: players.map((p) => (
                p === player ? (
                    p.getPrivateState()
                ) : (
                    p.getPublicState()
                )
            )),
            placements: placements.map(({ cards, player, ...rest }) => {
                let p = players.find(({ id }) => (id === player));

                if (p) {
                    p = p.getPublicState();
                } else {
                    p = {
                        name: 'Dealer',
                        dealer: true,
                    };
                }

                return {
                    ...rest,
                    player: p,
                    cards: cards.map(({ card, faceDown }) => (
                        faceDown ? 'back' : card
                    )),
                };
            }),
            deck: this.deck.cards.length,
        };
    }

    /**
     * Called when a player reports their internal state changed.
     * 
     * @param {Player} player 
     */
    report(player) {
        // Propagate the game state back to the players.
        this.players.forEach((p) => {
            p.emit('state', this.getStateFor(p));
        });

        // Also report to the dealer.
        this.dealer.emit('state', this.getStateFor(null));
    }

    /**
     * @param {io.Socket} socket 
     * @param {String} playerId 
     */
    join(socket, playerId) {
        if (playerId === 'dealer') {
            // Dealers are not added as players.
            this.dealer.attach(this, socket);
            this.report(null);
        } else {
            let player = this.players.find((p) => p.id === playerId);

            // If no player is found with that ID, add a new player.
            if (!player) {
                player = new Player(playerId);
                this.players.push(player);
            }

            player.attach(this, socket);
        }
    }
}

module.exports = Room;
