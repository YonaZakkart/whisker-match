import type { Component } from "solid-js";
import { Show, onCleanup, onMount } from "solid-js";
import { GameScreen } from "./components/GameScreen";
import { MenuScreen } from "./components/MenuScreen";
import { gameStore } from "./store/gameStore";
import { getBackgroundUrl, getTimePeriod } from "./utils/timeBackground";

export const App: Component = () => {
  onMount(() => {
    const applyBackground = () => {
      document.body.style.backgroundImage = `url("${getBackgroundUrl()}")`;
      document.body.dataset.period = getTimePeriod();
    };

    applyBackground();

    const intervalId = window.setInterval(applyBackground, 60_000);
    window.addEventListener("focus", applyBackground);

    onCleanup(() => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", applyBackground);
    });
  });

  return (
    <main class="app-shell">
      <Show when={gameStore.screen() === "game"} fallback={<MenuScreen />}>
        <GameScreen />
      </Show>
    </main>
  );
};
