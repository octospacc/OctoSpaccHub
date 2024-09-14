#!/bin/sh
for i in 0 1
do cp ./html-data-url-loader.html "./html-data-url-loader-${i}.html"
done
#echo "const fs=require('fs'); fs.writeFileSync('html2canvas.min.wrappedLib.js', 'window.FramesBrowser.Lib.html2canvas=' + JSON.stringify(fs.readFileSync('node_modules/html2canvas/dist/html2canvas.min.js', 'utf8')) + ';');" | node
echo index.html utils.js WebManifest.json icon.png html-data-url-loader-?.html \
	node_modules/html2canvas/dist/html2canvas.min.js
