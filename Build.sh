#!/bin/sh
SourceApps="SpiderADB TiVuOcto WuppiMini"
HubSdkApps="${SourceApps} MatrixStickerHelper TiktOctt"
HtmlHeadInject='<script src="../../shared/OctoHub-Global.js"></script>'

quoteVar(){ echo '"'"$1"'"' ;}

getMetaAttr(){
	file="$1"
	name="$2"
	key="$([ -n "$3" ] && echo "$3" || echo property)"
	grep '<meta '"$key"'="'"$name"'"' "$file" | grep '>' | cut -d '"' -f4
}

rm -vrf ./public || true
cp -vr ./static ./public
cp -vr ./shared ./public/shared

for App in ${SourceApps}
do
	mkdir -p "./public/${App}"
	cd "./source/${App}"
	sh ./Requirements.sh
	cp -vr $(sh ./Build.sh) "../../public/${App}/"
	cd ../..
done

cd ./public
node ../WriteRedirectPages.js

for App in ${HubSdkApps}
do
	file="./${App}/index.html"
	name="$(       getMetaAttr "${file}" og:title)"
	description="$(getMetaAttr "${file}" og:description)"
	url="$(        getMetaAttr "${file}" Url OctoSpaccHubSdk)"
	cat << [OctoSpaccHubSdk-WebManifest-EOF] > "./${App}/WebManifest.json"
	{
		$(getMetaAttr "${file}" WebManifestExtra OctoSpaccHubSdk | sed s/\'/\"/g)
		$([ -n "${description}" ] && echo "$(quoteVar description): $(quoteVar "${description}"),")
		"start_url": "${url}",
		"scope": "${url}",
		"name": "${name}"
	}
[OctoSpaccHubSdk-WebManifest-EOF]
	htmltitle='<title>'"${name}"'</title>'
	htmlcanonical='<link rel="canonical" href="'"${url}"'"/>'
	sed -i 's|</head>|<link rel="manifest" href="./WebManifest.json"/>'"${htmltitle}${htmlcanonical}${htmlmanifest}${HtmlHeadInject}"'</head>|' "${file}"
done
