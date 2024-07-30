#!/bin/sh
node ./index.js writeStaticHtml > /dev/null
echo index.js index.css index.html icon.png node_modules node_modules/SpaccDotWeb/SpaccDotWeb.Server.js node_modules/SpaccDotWeb/SpaccDotWeb.Alt.js
