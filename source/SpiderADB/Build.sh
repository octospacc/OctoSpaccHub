#!/bin/sh
npx esbuild ./SpiderADB.js --bundle --minify --outfile=bundle.js > /dev/null
echo index.html icon.png util.js bundle.js holo-web
