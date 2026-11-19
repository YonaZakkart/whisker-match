import type { CardId, Card as CardType } from "@/game";
import type { Component } from "solid-js";
import { For } from "solid-js";
import { Card } from "./Card";

interface BoardProps {
  cards: CardType[];
  columns: number;
  cardBackImage: string;
  interactive: boolean;
  resolving: boolean;
  onSelect: (id: CardId) => void;
}

export const Board: Component<BoardProps> = (props) => {
  return (
    <div
      class={`board board--cols-${props.columns}`}
      classList={{ "board--resolving": props.resolving }}
    >
      <For each={props.cards}>
        {(card, index) => (
          <Card
            card={card}
            position={index() + 1}
            total={props.cards.length}
            cardBackImage={props.cardBackImage}
            interactive={props.interactive}
            onSelect={props.onSelect}
          />
        )}
      </For>
    </div>
  );
};
