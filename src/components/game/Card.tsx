import { getCatCard } from "@/content";
import type { CardId, Card as CardType } from "@/game";
import type { Component } from "solid-js";

interface CardProps {
  card: CardType;
  cardBackImage: string;
  interactive: boolean;
  onSelect: (id: CardId) => void;
}

export const Card: Component<CardProps> = (props) => {
  const cat = () => getCatCard(props.card.pairId);
  const isHidden = () => props.card.state === "hidden";
  const isRevealed = () => props.card.state === "revealed";
  const isMatched = () => props.card.state === "matched";

  const label = () => {
    if (isHidden()) return "Face-down card";

    const name = cat()?.name ?? "Cat";
    return isMatched() ? `${name}, matched` : `${name} card`;
  };

  return (
    <button
      type="button"
      class="card"
      classList={{
        "card--hidden": isHidden(),
        "card--revealed": isRevealed(),
        "card--matched": isMatched(),
      }}
      disabled={!props.interactive || !isHidden()}
      aria-label={label()}
      onClick={() => props.onSelect(props.card.id)}
    >
      <span class="card__inner">
        <span class="card__face card__face--back" aria-hidden="true">
          <img src={props.cardBackImage} alt="" draggable={false} />
        </span>

        <span class="card__face card__face--front" aria-hidden="true">
          <span class="card__art">
            <img src={cat()?.image} alt="" draggable={false} />
          </span>
          <span class="card__name">
            <span class="card__name-text">{cat()?.name ?? "Mystery cat"}</span>
          </span>
        </span>
      </span>
    </button>
  );
};
