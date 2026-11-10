import type { Component } from "solid-js";
import { Board } from "./components/Board";

export const App: Component = () => {
  return (
    <main class="app">
      <h1>Whisker Match</h1>
      <Board />
    </main>
  );
};