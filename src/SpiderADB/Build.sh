#!/bin/sh
npx esbuild ./SpiderADB.js --bundle --minify --outfile=bundle.js > /dev/null
echo index.html util.js bundle.js holo-web
