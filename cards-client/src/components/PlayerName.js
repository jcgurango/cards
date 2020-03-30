const PlayerName = ({
    id,
    player,
}) => {
    return (player && player.id === 'dealer' && 'Dealer')
        || (player && player.name)
        || (id === 'dealer' && 'Dealer')
        || `Player ${(player && player.id) || id}`;
};

export default PlayerName;
