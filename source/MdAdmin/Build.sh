#!/bin/sh

VENDOR=
mkdir -p ./vendor

for file in toastui-editor-all.min.js toastui-editor.min.css; do
	wget -O ./vendor/$file https://uicdn.toast.com/editor/latest/$file
	VENDOR="$VENDOR vendor/$file"
done

for plugin in color-syntax; do
	base=toastui-editor-plugin-$plugin.min
	for type in js css; do
		file=$base.$type
		wget -O ./vendor/$file https://uicdn.toast.com/editor-plugin-$plugin/latest/$file
		VENDOR="$VENDOR vendor/$file"
	done
done

for plugin in tui-color-picker; do
	for type in js css; do
		file=$plugin.min.$type
		wget -O ./vendor/$file https://uicdn.toast.com/$plugin/latest/$file
		VENDOR="$VENDOR vendor/$file"
	done
done

npx esbuild ./vendor.js --bundle --minify --outfile=./vendor/vendor.js

echo index.html \
	node_modules/@materializecss/materialize/dist/css/materialize.min.css \
	node_modules/@materializecss/materialize/dist/js/materialize.min.js \
	node_modules/toml-js/lib/toml.min.js \
	node_modules/marked/lib/marked.esm.js \
	node_modules/webdav/dist/web/index.js \
	$VENDOR \
;
