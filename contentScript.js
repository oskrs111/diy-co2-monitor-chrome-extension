/*
Copyright 2020 Oscar Sanz Llopis
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
"use strict";
var port = chrome.runtime.connect();
var wait_symbols = ["|", "/", "--", "\\"];
var wait_counter = 0;
var ready = false;
var setup = false;
var switcher = 0;
var logo_src = chrome.extension.getURL("/images/logo_32.png");
var drag = undefined;
document.title = "diy-co2-monitor";

class dragControl {
  constructor(x, y, element) {
    this._x = x;
    this._y = y;
    this._element = element;
  }

  onDrag(x, y) {
    this._moveElement(x, y);
  }

  onFinish(x, y) {
    this._moveElement(x, y);
    return { left: parseInt(this._element.style.left.split("px")[0]), top: parseInt(this._element.style.top.split("px")[0]) };
  }

  _moveElement(x, y) {
    var x_pos = parseInt(this._element.style.left.split("px")[0]) + (x - this._x);
    var y_pos = parseInt(this._element.style.top.split("px")[0]) + (y - this._y);
    this._element.style.left = x_pos + "px";
    this._element.style.top = y_pos + "px";
    this._x = x;
    this._y = y;
  }
}

function html_append(left, top) {
  fetch(chrome.extension.getURL("/template.html"), {})
    .then((response) => {
      response
        .text()
        .then((text) => {
          document.body.insertAdjacentHTML("beforeend", text);
          document.getElementById("diy_wrapper_id").style.left = left + "px";
          document.getElementById("diy_wrapper_id").style.top = top + "px";
        })
        .catch((err) => {
          console.log("fetch_data.text(err)", err);
        });
    })
    .catch((err) => {
      console.log("contentScript.fetch(err)", err);
    });
}

function html_update(text) {
  document.getElementById("diy_text_id").innerHTML = text;
  if (setup == false) {
    document.getElementById("diy_icon_id").src = logo_src;
    document.getElementById("diy_wrapper_id").addEventListener("mousedown", (mev) => {
      drag = new dragControl(mev.screenX, mev.screenY, document.getElementById("diy_wrapper_id"));
    });
    document.getElementById("diy_wrapper_id").addEventListener("mouseup", (mev) => {
      if (drag != undefined) {
        var position = drag.onFinish(mev.screenX, mev.screenY);
        port.postMessage({ request: "store-position", position: position });
        drag = undefined;
      }
    });
    document.getElementById("diy_wrapper_id").addEventListener("mouseout", (mev) => {
      if (drag != undefined) {
        var position = drag.onFinish(mev.screenX, mev.screenY);
        port.postMessage({ request: "store-position", position: position });
        drag = undefined;
      }
    });
    document.getElementById("diy_wrapper_id").addEventListener("mousemove", (mev) => {
      if (drag != undefined) {
        drag.onDrag(mev.screenX, mev.screenY);
      }
    });
    setup = true;
  }
}

port.onMessage.addListener((msg, port) => {
  var text = "";
  switch (msg.request) {
    case "keep-alive":
      text = `CO2: ${wait_symbols[wait_counter++ % wait_symbols.length]} ppm`;
      document.title = text;
      if (ready == false && msg.config.show_overlay == true) {
        html_append(msg.config.left_position, msg.config.top_position);
        ready = true;
      } else if (switcher == 0) {
        html_update(text);
      }
      if (switcher > 0) switcher -= 1;
      break;

    case "ppm-update":
      text = `CO2: ${msg.ppm} ppm`;
      html_update(text);
      if (switcher < 65535) switcher += 2;
      break;

    default:
      console.log("port.onMessage(msg, port)", msg, port);
      break;
  }
});

window.addEventListener(
  "message",
  function (event) {
    if (event.source != window) return;

    if (event.data.type && event.data.type == "ext-clock") {
      port.postMessage({ request: "ext-clock" });
    }
  },
  false
);

setInterval(() => {
  window.postMessage({ type: "ext-clock" }, "*");
}, 1000);
