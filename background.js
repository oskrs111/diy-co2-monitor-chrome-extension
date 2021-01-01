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
var _items = {};
var _last_tab = { id: -1, title: "" };
var _port = {};
var _ppm = 0;
var _reply_wait = false;

chrome.runtime.onInstalled.addListener(() => {
  load_config();
});

chrome.tabs.onCreated.addListener(() => {
  load_config();
});

chrome.tabs.onUpdated.addListener(() => {
  load_config();
});

chrome.runtime.onConnect.addListener((port) => {
  _port = port;
  port.onMessage.addListener((msg, port) => {
    switch (msg.request) {
      case "ext-clock":
        if (_items.target_ip !== undefined) {
          fetch_data();
          _port.postMessage({ request: "keep-alive", config: _items });
        } else {
          load_config();
        }
        break;

      case "store-position":
        store_position(msg.position.left, msg.position.top);
        break;

      default:
        console.log("port.onMessage(msg, port)", msg, port);
        break;
    }
  });
  port.onDisconnect.addListener((port) => {
    console.log("port.onDisconnect(port)", port);
  });
});

function load_config() {
  chrome.storage.sync.get(
    {
      target_ip: "",
      show_tab: "",
      show_overlay: "",
      left_position: "",
      top_position: "",
    },
    function (items) {
      if (items.target_ip != "") {
        _items = items;
        console.log("restore_options(items)", items);
      }
    }
  );
}

function store_position(left, top) {
  chrome.storage.sync.set(
    {
      left_position: left,
      top_position: top,
    },
    function () {
      console.log("store_position(left, top)", left, top);
    }
  );
}

function fetch_data() {
  if (_reply_wait == true) {
    return;
  }
  if (_items.target_ip !== undefined) {
    fetch("http://" + _items.target_ip + "/data", {})
      .then((response) => {
        _reply_wait = false;
        response
          .text()
          .then((text) => {
            console.log("fetch_data.text(text)", text);
            var data = JSON.parse(text);
            update_title(data.ppm);
            try {
              _port.postMessage({ request: "ppm-update", ppm: data.ppm });
            } catch (err) {}
          })
          .catch((err) => {
            console.log("fetch_data.text(err)", err);
          });
      })
      .catch((err) => {
        _reply_wait = false;
        _port.postMessage({ request: "ppm-error", error: err });
        console.log("fetch_data.fetch(err)", err);
      });
  }
}

function update_title(title) {
  chrome.tabs.query({}, (tabs) => {
    for (var tab of tabs) {
      if (tab.active === true) {
        if (_last_tab.id === -1) {
          _last_tab.id = tab.id;
          _last_tab.title = tab.title;
        } else if (_last_tab.id !== tab.id) {
          chrome.tabs.executeScript(_last_tab.id, {
            code: `document.title = "${_last_tab.title}"`,
          });
          _last_tab.id = tab.id;
          _last_tab.title = tab.title;
        }
        chrome.tabs.executeScript(tab.id, {
          code: `document.title = "CO2: ${title} ppm"`,
        });
      }
    }
  });
}
