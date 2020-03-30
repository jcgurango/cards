import React from 'react';
import PlayerName from './PlayerName';
import Card from './Card';

const PlayerList = ({
    players,
    dealer = false,
    onDealTo = () => { },
    onClickCards = () => { },
}) => (
    <div className="player-list">
        {players.map((player) => (
            <div className="player-list-player" key={player.id}>
                <b><PlayerName player={player} /> ({player.hand} card{player.hand === 1 ? '' : 's'})</b>
                <div className="card-list" onClick={() => onClickCards(player)}>
                    {(new Array(player.hand).fill(null)).map((card, i) => (
                        <Card key={i} />
                    ))}
                    {!player.hand ? (
                        <Card className="card ghost" />
                    ) : null}
                </div>
                {dealer ? (
                    <div className="dealer-player-action-list">
                        <button type="button" onClick={() => onDealTo(player)}>Deal Card</button>
                    </div>
                ) : null}
            </div>
        ))}
    </div>
);

export default PlayerList;
