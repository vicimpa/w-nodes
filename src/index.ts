import "$plugins";

import { App } from "$App";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { dom } from "$library/dom";

oncontextmenu = (e) => e.preventDefault();

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

document.addEventListener("dragover", function (event) {
  event.preventDefault();
}, false);