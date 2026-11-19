import { getCatCard } from "@/content";
import type { CardId, Card as CardType } from "@/game";
import type { Component } from "solid-js";
import { Show } from "solid-js";

interface CardProps {
  card: CardType;
  position: number;
  total: number;
  cardBackImage: string;
  interactive: boolean;
  onSelect: (id: CardId) => void;
}

export const Card: Component<CardProps> = (props) => {
  const cat = () => getCatCard(props.card.pairId);
  const isHidden = () => props.card.state === "hidden";
  const isRevealed = () => props.card.state === "revealed";
  const isMatched = () => props.card.state === "matched";
  const isInteractive = () => props.interactive && isHidden();

  const label = () => {
    if (isHidden()) return `Face-down card ${props.position} of ${props.total}`;

    const name = cat()?.name ?? "Mystery cat";
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
      aria-disabled={!isInteractive()}
      aria-label={label()}
      onClick={() => {
        if (isInteractive()) props.onSelect(props.card.id);
      }}
    >
      <span class="card__inner">
        <span class="card__face card__face--back" aria-hidden="true">
          <img src={props.cardBackImage} alt="" draggable={false} />
        </span>

        <span class="card__face card__face--front" aria-hidden="true">
          <span class="card__art">
            <Show when={cat()?.image}>
              {(image) => <img src={image()} alt="" draggable={false} />}
            </Show>
          </span>
          <span class="card__name">
            <span class="card__name-text">{cat()?.name ?? "Mystery cat"}</span>
          </span>
        </span>
      </span>
    </button>
  );
};
