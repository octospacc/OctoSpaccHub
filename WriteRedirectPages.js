#!/usr/bin/env node
const fs = require('fs');
for (const page of [
	{ path: "a/fb", target: "'../../FramesBrowser/'+location.hash"                    }, // Apps/FramesBrowser
	{ path: "s/dh", target: "'../../FramesBrowser/#_1|f=1|h='+location.hash.slice(1)" }, // Services/DataHTML
]) {
	const dirPath = `./${page.path}`;
	if (!fs.existsSync(dirPath)){
		fs.mkdirSync(dirPath, { recursive: true });
	}
	fs.writeFileSync(`${dirPath}/index.html`, `<!DOCTYPE html><html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script>
function r(){ location=${page.target} }
r()
</script>
<p>Redirecting...</p>
<button onclick="r()">Click if you are not automatically redirected</button>
</body>
</html>`);
}
