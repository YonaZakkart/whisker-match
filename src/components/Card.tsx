import type { Component } from "solid-js";
import type { Card as CardType } from "@/game";

interface CardProps {
  card: CardType;
  onSelect: (id: string) => void;
}

export const Card: Component<CardProps> = (props) => {
  return (
    <button
      type="button"
      class={`card card--${props.card.state}`}
      disabled={props.card.state !== "hidden"}
      onClick={() => props.onSelect(props.card.id)}
      aria-label={`Card ${props.card.pairId}`}
    >
      <div class="card__inner">
        <div class="card__face card__face--back">?</div>
        <div class="card__face card__face--front">{props.card.pairId}</div>
      </div>
    </button>
  );
};