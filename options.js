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
function save_options() {
  var target_ip = document.getElementById("target_ip").value;
  var show_tab = document.getElementById("show_tab").checked;
  var show_overlay = document.getElementById("show_overlay").checked;
  var left_position = document.getElementById("left_position").value;
  var top_position = document.getElementById("top_position").value;

  console.log("save_options(target_ip)", target_ip);
  chrome.storage.sync.set(
    {
      target_ip: target_ip,
      show_overlay: show_overlay,
      show_tab: show_tab,
      left_position: left_position,
      top_position: top_position,
    },
    function () {
      var status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    }
  );
}

function restore_options() {
  chrome.storage.sync.get(
    {
      target_ip: "",
      show_tab: "",
      show_overlay: "",
      left_position: "",
      top_position: "",
    },
    function (items) {
      document.getElementById("target_ip").value = items.target_ip;
      document.getElementById("show_tab").checked = items.show_tab;
      document.getElementById("show_overlay").checked = items.show_overlay;
      document.getElementById("left_position").value = items.left_position;
      document.getElementById("top_position").value = items.top_position;
      console.log("restore_options(items)", items);
    }
  );
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
