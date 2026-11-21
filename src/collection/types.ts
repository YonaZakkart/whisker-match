import type { PairId } from "@/game/types";

export interface CollectionState {
  ownedPairIds: PairId[];
  pawprints: number;
}

export type RewardSource = "game" | "exchange";
export type RewardKind = "new-card" | "duplicate";

export interface RewardEvent {
  source: RewardSource;
  kind: RewardKind;
  pairId: PairId;
  collection: CollectionState;
}
