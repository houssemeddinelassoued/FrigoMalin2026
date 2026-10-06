import { render } from "preact";
import { App } from "./app.tsx";
import "./styles.css";

render(<App />, document.getElementById("app")!);

// Service worker uniquement sur le build : il rend l'application rechargeable hors ligne.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}
