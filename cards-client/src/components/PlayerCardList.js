import React, { useState, useEffect } from 'react';
import Card from './Card';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

const SortableCard = SortableElement(({ value, selected }) => (
  <Card
    id={value}
    className={`player-card ${selected ? 'selected' : ''}`}
  />
));
const SortableCardList = SortableContainer(({ items, selected }) => (
  <div className="player-card-list">
    {items.map((card, index) => (
      <SortableCard
        id={card}
        key={`item-${card}`}
        index={index}
        value={card}
        selected={selected.indexOf(card) > -1}
      />
    ))}
  </div>
));

const PlayerCardList = ({
  cards,
  onPlace = () => { },
}) => {
  const [localCards, setLocalCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [unbounce, setUnbounce] = useState(Date.now());

  const selectCard = (card) => {
    if (Date.now() - unbounce > 200) {
      setSelectedCards((sc) => {
        if (sc.indexOf(card) === -1) {
          return sc.concat(card);
        }

        return sc.filter((c) => c !== card);
      });
    }

    setUnbounce(Date.now());
  };

  const placeCards = () => {
    onPlace(selectedCards);
  };

  useEffect(() => {
    if (cards) {
      setLocalCards((lc) => (
        [
          // Filter out elements that don't exist anymore
          ...lc.filter((card) => (cards.indexOf(card) > -1)),
          // Add any new ones.
          ...cards.filter((card) => lc.indexOf(card) === -1),
        ]
      ));

      setSelectedCards((sc) => (
        // Remove any cards that are no longer in the cards list.
        sc.filter((card) => (cards.indexOf(card) > -1))
      ));
    } else {
      setLocalCards([]);
    }
  }, [cards]);

  return (
    <>
      <SortableCardList
        items={localCards}
        onSortEnd={({ oldIndex, newIndex }) => {
          if (oldIndex === newIndex) {
            selectCard(localCards[newIndex]);
          } else {
            setLocalCards(
              arrayMove(localCards, oldIndex, newIndex),
            );
          }
        }}
        axis="xy"
        selected={selectedCards}
      />
      <div className="action-list player">
        {selectedCards.length > 0 ? (
          <button type="button" onClick={placeCards}>
            Place Down
                    </button>
        ) : null}
      </div>
    </>
  );
};

export default PlayerCardList;