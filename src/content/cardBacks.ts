export type CardBackId = "classic" | "midnight" | "forest";

export interface CardBack {
  id: CardBackId;
  name: string;
  image: string;
}

export const CARD_BACKS: readonly CardBack[] = [
  {
    id: "classic",
    name: "Classic",
    image: "/cards/backs/Back_Card.png",
  },
  {
    id: "midnight",
    name: "Black",
    image: "/cards/backs/Back_Card_Black.png",
  },
  {
    id: "forest",
    name: "Green",
    image: "/cards/backs/Back_Card_Green.png",
  },
];

export const DEFAULT_CARD_BACK_ID: CardBackId = "classic";

export function isCardBackId(value: unknown): value is CardBackId {
  return typeof value === "string" && CARD_BACKS.some((back) => back.id === value);
}

export function getCardBack(id: CardBackId): CardBack {
  return CARD_BACKS.find((back) => back.id === id) ?? CARD_BACKS[0];
}
