import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import socketIOClient from 'socket.io-client';
import ReactNotification, { store } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import './App.css';
import PlayerName from './components/PlayerName';
import PlayerList from './components/PlayerList';
import PlayerCardList from './components/PlayerCardList';
import Board from './components/Board';
import Card from './components/Card';

const App = () => {
  const [gameState, setGameState] = useState({
    id: 'Connecting...',
    players: [],
    placements: [],
    deck: 0,
  });

  const [socket, setSocket] = useState(null);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const location = useLocation();

  // Check what path we're on.
  const [room, role] = location.pathname.split('/').slice(1);
  const dealer = role === 'dealer';
  const playerId = dealer ? role : localStorage.getItem('id');

  const currentPlayer = gameState.players.find(({ id }) => id === playerId) || null;

  useEffect(() => {
    // Connect to socket.io.
    const socket = socketIOClient('/');

    socket.on('room', (id) => {
      // Move to this location.
      window.location.href = `/${id}${dealer ? '/dealer' : ''}`;
    });

    socket.on('state', (state) => {
      setGameState(state);
    });

    socket.on('entered', () => {
      const playerName = localStorage.getItem('player-name');

      if (playerName) {
        socket.emit('name', playerName);
      }
    });

    socket.on('card-request-accepted', (name) => {
      store.addNotification({
        message: `${name} accepted your request to take a card.`,
        type: 'success',
        container: 'bottom-right',
      });
    });

    socket.on('card-request-rejected', (name) => {
      store.addNotification({
        message: `${name} rejected your request to take a card.`,
        type: 'danger',
        container: 'bottom-right',
      });
    });

    socket.on('connect', () => {
      socket.emit('room', room, playerId);
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [location, playerId, room, dealer]);

  const handleNameChange = (e) => {
    if (socket) {
      const newName = prompt('Enter a new name');

      if (newName) {
        socket.emit('name', newName);
        localStorage.setItem('player-name', newName);
      }
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const placeCards = (cards) => {
    socket.emit('place', cards);
    setShowActionPanel(false);
  };

  const dealTo = (player) => {
    socket.emit('deal', player.id);
  };

  const requestCard = (player, i) => {
    socket.emit('request-card', player.id, i, (error) => {
      if (error) {
        store.addNotification({
          message: error.message,
          type: 'danger',
          container: 'bottom-right',
        });
      } else {
        store.addNotification({
          message: 'Card requested!',
          type: 'success',
          container: 'bottom-right',
        });
      }
    });
  };

  const returnPlacement = (index) => {
    socket.emit('return', index);
  };

  if (!currentPlayer && !dealer) {
    return null;
  }

  return (
    <div className="main">
      <div className={`player-list-panel ${showPlayerList ? 'open' : ''}`}>
        <PlayerList
          players={gameState.players.filter(({ id }) => (id !== playerId))}
          dealer={dealer}
          onDealTo={dealTo}
          onClickCard={requestCard}
        />
        <div className="player-list-title" onClick={() => setShowPlayerList(s => !s)}>
          <span className="panel-title-text">
            {`Player List (${gameState.players.length - (dealer ? 0 : 1)})`}
          </span>
          <FontAwesomeIcon icon={showPlayerList ? faChevronUp : faChevronDown} />
        </div>
      </div>
      <div className="placements">
        <Board
          placements={gameState.placements}
          onClick={dealer ? returnPlacement : (() => { })}
        />
      </div>
      <div className={`action-panel ${showActionPanel ? 'open' : ''}`}>
        {dealer ? (
          <div className="current-player">
            <div className="action-panel-title" onClick={() => setShowActionPanel(s => !s)}>
              <span className="panel-title-text">
                Dealer Actions
              </span>
              <FontAwesomeIcon icon={showActionPanel ? faChevronDown : faChevronUp} />
            </div>
            <div className="current-player-name">
              <a href="/" onClick={dealer ? ((e) => e.preventDefault()) : handleNameChange}>
                <PlayerName id={playerId} player={currentPlayer} />
              </a> in #{gameState.id}
              <br />
              <br />
              {gameState.deck} card{gameState.cards === 1 ? '' : 's'} in the deck.
              <br />
              <br />
            </div>
            <div className="action-list">
              <button type="button" onClick={() => socket.emit('shuffle')}>Shuffle Deck</button>
              <button type="button" onClick={() => socket.emit('deal', null, true)}>Deal Card onto Board (Face Down)</button>
              <button type="button" onClick={() => socket.emit('deal')}>Deal Card onto Board (Face Up)</button>
            </div>
          </div>
        ) : (
          <div className="current-player">
            <div className="action-panel-title" onClick={() => setShowActionPanel(s => !s)}>
              <span className="panel-title-text">
                {`Your Hand (${(currentPlayer && currentPlayer.hand.length) || 0} card${((currentPlayer && currentPlayer.hand.length) || 0) === 1 ? '' : 's'})`}
              </span>
              <FontAwesomeIcon icon={showActionPanel ? faChevronDown : faChevronUp} />
            </div>
            <div className="current-player-name">
              <a href="/" onClick={handleNameChange}>
                <PlayerName id={playerId} player={currentPlayer} />
              </a> in #{gameState.id}
            </div>
            {currentPlayer ? (
              <PlayerCardList
                cards={currentPlayer.hand}
                onPlace={placeCards}
              />
            ) : null}
          </div>
        )}
      </div>
      <ReactNotification />
      {currentPlayer && currentPlayer.cardRequests.length ? (
        <div className="modal-container">
          <div className="modal">
            <div className="modal-title">
              Player Requesting Card
            </div>
            <b>
              <PlayerName
                id={currentPlayer.cardRequests[0].player.id}
                player={currentPlayer.cardRequests[0].player}
              />
            </b> wants to take the following card from you (they don't know it's this card):<br />
            <br />
            <Card id={currentPlayer.cardRequests[0].card} />
            <br />
            <br />
            <div className="action-list">
              <button type="button" onClick={() => socket.emit('accept-card-request', currentPlayer.cardRequests[0].id)}>
                Accept
              </button>
              <button type="button" onClick={() => socket.emit('reject-card-request', currentPlayer.cardRequests[0].id)}>
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default App;
