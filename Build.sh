#!/bin/sh
SourceApps="$(ls ./source/)"
HubSdkApps="${SourceApps} MatrixStickerHelper"
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
	if [ -f ./Requirements.sh ]
	then sh ./Requirements.sh
	else
		[ -f ./package.json ] && (npm update; npm install)
	fi
	copyfiles="$(sh ./Build.sh)"
	cp -vr $copyfiles "../../public/${App}/"
	for file in $copyfiles
	do
		path="../../public/${App}/${file}"
		if [ ! -e "${path}" ]
		then mkdir -p "${path}" && rm -rf "${path}" && cp "${file}" "${path}"
		fi
	done
	cd ../..
done

cd ./public
node ../WriteRedirectPages.js

for App in ${HubSdkApps}
do
	file="./${App}/index.html"
	name="$(       getMetaAttr "${file}" og:title)"
	description="$(getMetaAttr "${file}" og:description)"
	url="$(        getMetaAttr "${file}" OctoSpaccHubSdk:Url)"
	cat << [OctoSpaccHubSdk-WebManifest-EOF] > "./${App}/WebManifest.json"
	{
		$(getMetaAttr "${file}" OctoSpaccHubSdk:WebManifestExtra | sed s/\'/\"/g)
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
