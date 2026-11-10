import type { Component } from "solid-js";
import type { Card as CardType } from "@/game";

interface CardProps {
  card: CardType;
  onSelect: (id: string) => void;
}

export const Card: Component<CardProps> = (props) => {
  const frontSrc = () => `/cards/img-test${props.card.pairId}.png`;

  return (
    <button
      type="button"
      class={`card card--${props.card.state}`}
      disabled={props.card.state !== "hidden"}
      onClick={() => props.onSelect(props.card.id)}
      aria-label={`Card ${props.card.pairId}`}
    >
      <div class="card__inner">
        <div class="card__face card__face--back">
          <img src="/cards/back-1-test.png" alt="" draggable="false" />
        </div>
        <div class="card__face card__face--front">
          <img src={frontSrc()} alt="" draggable="false" />
        </div>
      </div>
    </button>
  );
};