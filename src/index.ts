import { App } from "$App";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { dom } from "$library/dom";

createRoot(
  dom('div', {
    style: {
      display: 'contents'
    },
    ref(elem) {
      document.body.appendChild(elem);
    }
  })
).render(
  createElement(App)
);