import React from 'react';
import Card from './Card';

const Board = ({
    placements,
    onClick = () => { },
}) => (
    placements.slice().reverse().map(({ cards, player }, index) => (
        <div className="placement-container" key={`placement-${index}`} onClick={() => onClick(placements.length - index - 1)}>
            <b>{player.name}</b>
            <div className="player-card-list">
                {cards.map((card, c) => (
                    <Card
                        id={card}
                        key={`item-${card}-${c}`}
                    />
                ))}
            </div>
        </div>
    ))
);

export default Board;