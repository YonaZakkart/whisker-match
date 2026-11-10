import { onMount, type Component } from "solid-js";
import { Board } from "./components/Board";
import { getBackgroundUrl } from "./utils/timeBackground";

export const App: Component = () => {
  onMount(() => {
    const url = getBackgroundUrl();
    document.body.style.backgroundImage = `url("${url}")`;
  });

  return (
    <main class="app">
      <Board />
    </main>
  );
};