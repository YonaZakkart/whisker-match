import { GameScreen } from "@/components/screens/GameScreen";
import { MenuScreen } from "@/components/screens/MenuScreen";
import { OptionsScreen } from "@/components/screens/OptionsScreen";
import { gameStore } from "@/store/gameStore";
import type { Component } from "solid-js";
import { Match, Switch, createEffect, onCleanup, onMount } from "solid-js";

export const App: Component = () => {
  createEffect(() => {
    const image = gameStore.backgroundImage();

    document.body.style.backgroundImage = `url("${image}")`;
    document.body.dataset.period = gameStore.activeTimePeriod();
    document.body.dataset.backgroundPack = gameStore.backgroundPackId();
  });

  onMount(() => {
    gameStore.refreshTimePeriod();

    const intervalId = window.setInterval(() => gameStore.refreshTimePeriod(), 60_000);
    const handleFocus = () => gameStore.refreshTimePeriod();

    window.addEventListener("focus", handleFocus);

    onCleanup(() => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    });
  });

  return (
    <main class="app-shell">
      <Switch fallback={<MenuScreen />}>
        <Match when={gameStore.screen() === "game"}>
          <GameScreen />
        </Match>
        <Match when={gameStore.screen() === "options"}>
          <OptionsScreen />
        </Match>
      </Switch>
    </main>
  );
};
