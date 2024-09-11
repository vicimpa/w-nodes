import "$plugins";

import { makePack, t } from "$library/datapack";

import { App } from "$App";
import base64 from "$library/base64";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { dom } from "$library/dom";
import gzip from "$library/gzip";
import uint from "$library/datapack/types/uint";

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