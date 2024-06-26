// search "Copyright" in this file for licensing info

// configuration
const appName = 'WuppìMini';
const serverPort = 8135;
const detailedLogging = true;
const serverLanUpstreams = false;
const serverPlaintextUpstreams = false;
let resFiles = [ 'package.json', 'package-lock.json' ];
const appTerms = `
<p  >(These terms apply to the server-hosted version of the app only.)
<br/>This service is offered for free, in the hope that it can be useful, but without any warranty.
<br/>For the service to be able to publish your posts, your content is transmitted to our server, which then forwards it to the server of the service you specified at the time of login, operating on your behalf with the credentials you provided.
<br/>Usage of the service might be automatically monitored, and the metadata generated by you might be archived for analytics, debugging, or legal reasons, for as long as we see fit. For every web request, this could include: your IP address, your user agent, the time of request, the requested URL. On any request to an upstream server, this could include: the requested URL on the upstream server, your username hash. On request for posting content, this could include: the hash of each text field's content of your post, the metadata of your uploaded files (filename hash, content hash, content length, mime type). Your content itself, and all normal data, is never stored.
<br/>You are forbidden from using the service in any way that is damaging to the service itself or our infrastructure, or that is illegal in the jurisdiction this server is hosted in (Italy, Europe).
<br/>We reserve the right to ban you from using the service at any time, for any reason, and without any explanation or prior warning.
<br/>By continuing with the usage of this site, you declare to understand and agree to these terms.
<br/>If you don't agree with these terms, discontinue usage of this site immediately, and instead <a href="/info#h-floss">get the source code</a> to host it yourself, find another instance, or use the <a href="/info#h-versions">local, client-side version</a>.
</p>`;
const suggestedTags = [ 'fromWuppiMini' ];
const corsProxies = [ 'corsproxy.io', 'corsproxy.org' ];

const SpaccDotWebServer = require('SpaccDotWeb/SpaccDotWeb.Server.js');
let crypto;
let isEnvServer = SpaccDotWebServer.envIsNode;
let isEnvBrowser = SpaccDotWebServer.envIsBrowser;
const httpCodes = { success: [200,201] };
const strings = {
	csrfErrorHtml: `<p class="notice error">Authorization token mismatch. Please try resubmitting.</p>`,
	upstreamDisallowedHtml: `<p class="notice error">Upstream destination is not allowed from backend.</p>`,
};

const appPager = (content, title) => `${title ? `<h2>${title}</h2>` : ''}${content}`;

const newHtmlPage = (content, title) => `<!DOCTYPE html><html><head>
	<meta charset="utf-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<meta property="og:title" content="${title ? `${title} — ` : ''}${appName}"/>
	<meta OctoSpaccHubSdk="Url" content="https://hub.octt.eu.org/WuppiMini/"/>
	<meta OctoSpaccHubSdk="WebManifestExtra" content="'display':'standalone', 'icons':[{ 'src':'./icon.png', 'type':'image/png', 'sizes':'256x256' }],"/>
	<link rel="apple-touch-icon" href="./icon.png"/>
	<script src="../../shared/OctoHub-Global.js"></script>
	<style>
* {
	box-sizing: border-box;
	font-family: sans-serif;
}
code {
	font-family: revert;
}
body {
	margin: 0;
	padding-bottom: 8px;
	color: #000;
	background: #eee url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwBAMAAADMe/ShAAAAHlBMVEX29vb09PTy8vL19fXz8/Px8fHw8PDv7+/u7u739/dHdNvrAAACSElEQVR4AezYNX7DMBiGcafcKTRlC0hdy7T1Z7iAcS5YOkEl38DeQlNOW24YX63fsxr+Ztm2RmvjMiu2bWbOXPmjtW2A7S8YKlfMCK4lKPzeMoJvYhROHYIJno9gggkmmGCCCSaYYIIJJphgggkmGP/PZQZf4XDHCK5JFFYtE7hXkwWYap0awEMPh8NHA7jPNQprv2EAH5zh8MsTDo9vY/xGxuCeLXFYsVMY7nNZwCm/AcM3scZhnTooPBwfafBYP4JwiZvBfgWDh7Xxkc71DmXjY916hOAbLrMxK7ZuTOfKdxC4ZMf6z1Ui2iEh/2Sdssru8L4dy+zXFVGbuVtntyPxK+cqZRc7wr1Ll0v95/qser1DVZv/yVr5bv10Bczq+ML4Rl/als/ww4WfJptbwuACMbgwhaUVfkvgt6LU1icpdkAAAADAEEz/1EKshHOBgMAnwZ7gNgG9DEwybTKpyZiLRCT6ItqUCJuIYqKoosaJlEsMJBki+ZOElwRfkpqSuElcS9Qnd4LcGN3enRUACMRQDFSDJRzg3wIKuNnNzygYA83rGbx9g1cwGAwGg8FgMBgMBoPBYDAYDAaDwWAwGAwGg8FgMBgMBoPB/bFgfx7ZH4TWJ7DB0W9w5hwcdgen7MHxfp8r9IFGkKQEEU6WHWWhVZaWZTFdlg9mwWSdiAZRbJABB+FzkHoHcXuQ82cDBtlkQzVSkc1yZEMk2fRKNjZTzetkg0LlhJK1KjAYDAaDwWAwGAwGg8FgcAD3L/H6J4DLS/j67eEOl9GYoKbAV2YAAAAASUVORK5CYII=');
	background-size: 10px;
}
a {
	color: #777;
}
h1 {
	display: inline;
}
h1 > a {
	color: #000;
}
form > input, form > select, form > textarea, form > label {
	display: block;
	margin: 8px 0px;
	width: 100%;
}
form > input[type="text"], form > input[type="url"], form > input[type="password"], form > input[type="submit"], /*form > input[type="button"],*/ form > select, textarea {
	min-height: 2em;
}
textarea {
	font-size: medium;
}
div#header {
	margin: 0;
	padding: 8px;
	border-bottom: 4px solid #5ac800;
	background: #fff;
}
div#header > * {
	display: inline;
	padding: 0px 8px;
}
div#app {
	width: 90%;
	margin-left: auto;
	margin-right: auto;
	padding: 0px 8px;
}
div#transition {
	width: 100vw;
	height: 100vh;
	position: absolute;
	top: 0;
	left: 0;
	background: black;
	opacity: 0.25;
}
p.notice {
	background: white;
	padding: 1em;
	border-width: 4px;
	border-left-width: 1em;
	border-style: solid;
}
p.notice.success {
	border-color: #5ac800;
}
p.notice.error {
	border-color: #de0000;
}
	</style>
</head><body><!--
	-->${isEnvBrowser ? `<div id="transition"></div>` : ''}<!--
	--><div id="header"><!--
		--><h1><a href="/">${appName}</a></h1><!--
		--><a href="/info">Info</a><!--
		--><a href="/settings">Settings</a><!--
	--></div><!--
	--><div id="app">${appPager(content, title)}</div><!--
--></body></html>`;

const A = (href) => `<a href="${href}">${href}</a>`

const Log = (type, msg) => ((type !== 'D' || detailedLogging) && console.log(`${type}: ${msg}`));

const checkUpstreamAllowed = (url) => {
	const [protocol, ...rest] = url.split('://');
	const domain = rest[0].split('/')[0].trim();
	if (isEnvServer && (
		(!serverLanUpstreams && (domain === 'localhost' || !isNaN(domain.replaceAll('.', '').replaceAll(':', ''))))
		||
		(!serverPlaintextUpstreams && protocol.toLowerCase() !== 'https')
	)) {
		return false;
	}
	return true;
}

// the below anti-CSRF routines do useful work only on the server, that kind of attack is not possible with the client app

const makeFormCsrf = (accountString) => {
	if (!isEnvServer) {
		return '';
	}
	const time = Date.now().toString();
	return (accountString ? `
		<input type="hidden" name="formTime" value="${time}"/>
		<input type="hidden" name="formToken" value="${genCsrfToken(accountString, time)}"/>
	` : '');
};

const genCsrfToken = (accountString, time) => (isEnvServer && time && crypto.scryptSync(accountString, time, 32).toString('base64'));

const matchCsrfToken = (bodyParams, accountString) => (isEnvServer ? bodyParams.formToken === genCsrfToken(accountString, bodyParams.formTime) : true);

const corsProxyIfNeed = (need) => (isEnvBrowser /*&& need*/ ? `https://${corsProxies[~~(Math.random() * corsProxies.length)]}?` : '');

/*const handleRequest = async (req, res={}) => {
	// TODO warn if the browser has cookies disabled when running on server side
	// to check if we can save cookies:
	// first check if any cookie is saved, if it is then we assume to be good
	// if none is present, redirect to another endpoint that should set a "flag cookie" and redirect to a second one that checks if the flag is present
	// if the check is successful we return to where we were before, otherwise we show a cookie warning
	//if (!getCookie(req, '_')) { // flag
	//}
	//if (!getCookie(req)) {
	//	return redirectTo('/thecookieflagthingy', res);
	//}
	if (req.method === 'HEAD') {
		req.method = 'GET';
	};
};*/

// todo handle optional options field(s)
const accountDataFromString = (accountString) => {
	const tokens = accountString.split(',');
	return { instance: tokens[0], username: tokens[1], password: tokens.slice(2).join(',') };
}

const makeFragmentLoggedIn = (accountString) => {
	const accountData = accountDataFromString(accountString);
	return `<p>Logged in as <i>${accountData.username} @ ${A(accountData.instance)}</i>.</p>`;
}

const main = () => {
	if (SpaccDotWebServer.envIsNode && process.argv[2] !== 'html') {
		resFiles = [__filename.split(require('path').sep).slice(-1)[0], ...resFiles];
	};

	const server = SpaccDotWebServer.setup({
		appName: appName,
		staticPrefix: '/res/',
		staticFiles: resFiles,
		appPager: appPager,
		htmlPager: newHtmlPage,
	});

	if (SpaccDotWebServer.envIsNode && process.argv[2] === 'html') {
		server.writeStaticHtml();
	} else {
		if (SpaccDotWebServer.envIsNode) {
			crypto = require('crypto');
			console.log('Running Server...');
		};
		server.initServer({
			port: serverPort,
			address: '0.0.0.0',
			maxBodyUploadSize: 4e6, // 4 MB
			endpoints: [ endpointRoot, endpointInfo, endpointCompose, endpointSettings, endpointCatch ],
		});
	};
};

const endpointRoot = [ (ctx) => (!ctx.urlSections[0]), (ctx) => ctx.redirectTo(ctx.getCookie('account') ? '/compose' : '/info') ];

const endpointCatch = [ (ctx) => true, (ctx) => ctx.renderPage('', (ctx.response.statusCode = 404)) ];

const endpointInfo = [ (ctx) => (ctx.urlSections[0] === 'info' && ctx.request.method === 'GET'), (ctx) => {
	ctx.response.statusCode = 200;
	ctx.renderPage(`
		${!ctx.getCookie('account') ? `<p>You must login first. Go to <a href="/settings">Settings</a> to continue.</p>` : ''}
		<h3>About</h3>
		<p>
			${appName} (temporary name?) is a minimalist, basic HTML-based frontend, designed for quickly and efficiently publishing to social media and content management services (note that only WordPress is currently supported).
			<br/>
			Mainly aimed at old systems that might not support modern web-apps, the server-hosted version of this application works without any client-side scripts, and should be optionally reachable via unencrypted HTTP.
			<br/>
			About practical use cases, you ask? I made this to upload game posts from my 3DS, and possibly microblog with my Kindle! (See an example: <a href="https://octospacc.altervista.org/2024/02/09/test-wuppimini/">this post</a> was published from my n3DS.)
			<br/><br/>
			Check out all my other web endeavors at ${A('https://hub.octt.eu.org')}, or join my Matrix space to chat or if you need help: ${A('https://matrix.to/#/#Spacc:matrix.org')}.
		</p>
		<h3 id="h-versions">Versions</h3>
		<p>
			This app uses a novel approach behind the scenes to be able to run in one of either two modes, while reusing a single codebase: a classical server-side-rendered application, which works well on very limited systems but requires connection with a dedicated backend server that runs it, or a modern client-side single-page-application, relying on many modern web technologies, but working without an hosting server. Occasional bugs or update delays aside, the two essentially have feature parity and the same interface, but can be useful in different situations. Use whatever you prefer in each possible situation.
		</p>
		<ul>
			<li>Server-hosted version: ${A('https://wuppimini.octt.eu.org/')}.</li>
			<li>Client-side version: ${A('https://hub.octt.eu.org/WuppiMini/')}.</li>
		</ul>
		<h3 id="h-floss">Open-Source, Licensing, Disclaimers</h3>
		<p>
			Copyright (C) 2024 OctoSpacc
			<br/>
			This program is free software: you can redistribute it and/or modify
			it under the terms of the GNU Affero General Public License as
			published by the Free Software Foundation, either version 3 of the
			License, or (at your option) any later version.
			<br/>
			This program is distributed in the hope that it will be useful,
			but WITHOUT ANY WARRANTY; without even the implied warranty of
			MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
			GNU Affero General Public License for more details.
			<br/>
			You should have received a copy of the GNU Affero General Public License
			along with this program. If not, see ${A('https://www.gnu.org/licenses/')}.
		</p>
		<p>
			${isEnvServer ? `You can obtain the full source code and assets by downloading the following files:
			${resFiles.map((file) => ` • <a href="/res/${file}">${file}</a>`).join('')}.
			` : 'To get the original, unminified source code, visit this same page on the server-side version (refer to the Versions section above).'}
			Alternatively, you can also find the source code on my shared Git repo: ${A('https://gitlab.com/octospacc/octospacc.gitlab.io/-/tree/master/source/WuppiMini/')}.
		</p>
		${isEnvServer ? `<h3>Terms of Use and Privacy Policy</h3>${appTerms}` : ''}
		<h3>Changelog</h3>
		<h4>2024-02-24</h3>
		<ul>
			<li>Allow uploading posts as published or draft, via 2 distinct buttons.</li>
			<li>Migrated fancy portable-server-codebase to <a href="https://gitlab.com/SpaccInc/SpaccDotWeb">SpaccDotWeb</a> for code reuse and slimming down of the application core.</li>
		</ul>
		<h4>2024-02-12</h3>
		<ul>
			<li>First working client-side version of the current app, without backend server (still a bit buggy).</li>
			<li>Fixed suggested tags handling not working and making the post error out, by instead simply writing them in the post body</li>
		</ul>
		<h4>2024-02-10</h4>
		<ul>
			<li>Add "remember me" login option.</li>
			<li>Add "suggested tags" publishing option, will automatically add this list of tags to the post: [${suggestedTags}].</li>
		</ul>
		<h4>2024-02-09</h4>
		<ul>
			<li>First working version, with an UI reminiscent of [that dead social network that rhymes with Meterse], and Info, Settings, and Composition pages!</li>
			<li>Allow logging in with a WordPress.org profile, and creating new posts, including uploading images.</li>
			<li>Add licensing and proper source code listing.</li>
			<li>Tested on New and Old 3DS.</li>
		</ul>
	`);
} ];

const endpointCompose = [ (ctx) => (ctx.urlSections[0] === 'compose' && ['GET', 'POST'].includes(ctx.request.method)), async (ctx) => {
	let noticeHtml = '';
	const accountString = ctx.getCookie('account');
	if (!accountString) {
		return ctx.redirectTo('/');
	}
	ctx.response.statusCode = 200;
	const postUploadStatus = ((ctx.bodyParameters?.publish && 'publish') || (ctx.bodyParameters?.draft && 'draft'));
	if (ctx.request.method === 'POST' && postUploadStatus) {
		if (!matchCsrfToken(ctx.bodyParameters, accountString)) {
			ctx.response.statusCode = 401;
			noticeHtml = strings.csrfErrorHtml;
		}
		const isThereAnyFile = ((ctx.bodyParameters.file?.data?.length || ctx.bodyParameters.file?.size) > 0);
		if (!ctx.bodyParameters.text?.trim() && !isThereAnyFile) {
			ctx.response.statusCode = 500;
			noticeHtml = `<p class="notice error">Post content is empty. Please write some text or upload a media.</p>`;
		}
		const account = accountDataFromString(accountString);
		if (!checkUpstreamAllowed(account.instance)) {
			ctx.response.statusCode = 500;
			noticeHtml = strings.upstreamDisallowedHtml;
		}
		let mediaData;
		try {
			// there is a media to upload first
			if (httpCodes.success.includes(ctx.response.statusCode) && isThereAnyFile) {
				const mediaReq = await fetch(`${corsProxyIfNeed(account.cors)}${account.instance}/wp-json/wp/v2/media`, { headers: {
					Authorization: `Basic ${btoa(account.username + ':' + account.password)}`,
					"Content-Type": ctx.bodyParameters.file.type,
					"Content-Disposition": `attachment; filename=${ctx.bodyParameters.file.filename}`,
				}, method: "POST", body: (ctx.bodyParameters.file.data || ctx.bodyParameters.file) });
				mediaData = await mediaReq.json();
				if (!httpCodes.success.includes(mediaReq.status)) {
					noticeHtml = `<p class="notice error">Upstream server responded with error ${ctx.response.statusCode = mediaReq.status}: ${JSON.stringify(mediaData)}</p>`;
				}
			}
			// upload actual post if nothing has errored before
			if (httpCodes.success.includes(ctx.response.statusCode)) {
				const tagsHtml = (ctx.bodyParameters.tags === 'on' ? `
<!-- wp:paragraph -->
<p> #${suggestedTags.join(' #')} </p>
<!-- /wp:paragraph -->
` : '');
				const figureHtml = `${mediaData?.id && mediaData?.source_url ? `
<!-- wp:image {"id":${mediaData.id},"sizeSlug":"large"} -->
<figure class="wp-block-image size-large"><img src="${mediaData.source_url}" class="wp-image-${mediaData.id}"/></figure>
<!-- /wp:image -->
` : ''}`;
				const postReq = await fetch(`${corsProxyIfNeed(account.cors)}${account.instance}/wp-json/wp/v2/posts`, { headers: {
					Authorization: `Basic ${btoa(account.username + ':' + account.password)}`,
					"Content-Type": "application/json",
				}, method: "POST", body: JSON.stringify({
					status: postUploadStatus,
					featured_media: mediaData?.id,
					title: ctx.bodyParameters.title,
					content: (ctx.bodyParameters.html === 'on' ? `${ctx.bodyParameters.text}${tagsHtml}${figureHtml}` : `
${ctx.bodyParameters.text?.trim() ? `
<!-- wp:paragraph -->
<p>${ctx.bodyParameters.text.replaceAll('\r\n', '<br/>')}</p>
<!-- /wp:paragraph -->
` : ''}
${tagsHtml}
${ctx.bodyParameters.text?.trim() && mediaData?.id && mediaData?.source_url ? `
<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->
` : ''}
${figureHtml}`.trim()),
				}) });
				const postData = await postReq.json();
				if (httpCodes.success.includes(postReq.status)) {
					noticeHtml = `<p class="notice success">${postUploadStatus === 'publish' ? 'Post published' : ''}${postUploadStatus === 'draft' ? 'Draft uploaded' : ''}! ${A(postData.link)}</p>`;
				} else {
					noticeHtml = `<p class="notice error">Upstream server responded with error ${ctx.response.statusCode = postReq.status}: ${JSON.stringify(postData)}</p>`;
				}
			}
		} catch (err) {
			console.log(err);
			ctx.response.statusCode = 500;
			// display only generic error from server-side, for security
			noticeHtml = `<p class="notice error">${isEnvServer ? 'Some unknown error just happened. Please check that your data is correct, and try again.' : err}</p>`;
		}
		// TODO handle media upload success but post fail, either delete the remote media or find a way to reuse it when the user probably retries posting
	}
	ctx.renderPage(`${noticeHtml}
		${makeFragmentLoggedIn(accountString)}
		<form method="POST" enctype="multipart/form-data">${makeFormCsrf(accountString)}
			<input type="text" name="title" placeholder="Post Title" value="${ctx.bodyParameters.title && ctx.response.statusCode !== 200 ? ctx.bodyParameters.title : ''}"/>
			<input type="file" accept="image/jpeg,image/gif,image/png,image/webp,image/bmp" name="file"/>
			<textarea name="text" rows="10" placeholder="What's on your mind?">${ctx.bodyParameters.text && ctx.response.statusCode !== 200 ? ctx.bodyParameters.text : ''}</textarea>
			<!-- TODO: fix the turn off-on on submit of these checkboxes... -->
			<label><input type="checkbox" name="html" ${ctx.bodyParameters.html === 'on' && ctx.response.statusCode !== 200 ? 'checked="true"' : ''}/> Raw HTML mode</label>
			<label><input type="checkbox" name="tags" ${ctx.request.method === 'GET' || (ctx.bodyParameters.tags === 'on' && ctx.response.statusCode !== 200) ? 'checked="true"' : ''}/> Include suggested tags</label>
			<input type="submit" name="draft" value="Upload Draft"/>
			<input type="submit" name="publish" value="Publish!"/>
		</form>
	`, 'Compose Post');
} ];

const endpointSettings = [ (ctx) => (ctx.urlSections[0] === 'settings' && ['GET', 'POST'].includes(ctx.request.method)), async (ctx) => {
	let noticeHtml = '';
	const accountString = ctx.getCookie('account');
	ctx.response.statusCode = 200;
	if (ctx.request.method === 'POST') {
		if (accountString && !matchCsrfToken(ctx.bodyParameters, accountString)) {
			ctx.response.statusCode = 401;
			noticeHtml = strings.csrfErrorHtml;
		}
		if (ctx.response.statusCode === 200 && ctx.bodyParameters.login) {
			ctx.bodyParameters.instance = ctx.bodyParameters.instance.trim();
			if (!checkUpstreamAllowed(ctx.bodyParameters.instance)) {
				ctx.response.statusCode = 500;
				noticeHtml = strings.upstreamDisallowedHtml;
			}
			try {
				const upstreamReq = await fetch(`${corsProxyIfNeed(ctx.bodyParameters.cors === 'on')}${ctx.bodyParameters.instance}/wp-json/wp/v2/users?context=edit`, { headers: {
					Authorization: `Basic ${btoa(ctx.bodyParameters.username + ':' + ctx.bodyParameters.password)}`,
				} });
				const upstreamData = await upstreamReq.json();
				if (upstreamReq.status === 200) {
					let cookieFlags = (ctx.bodyParameters.remember === 'on' ? `; max-age=${365*24*60*60}` : '');
					ctx.setCookie(`account=${ctx.bodyParameters.instance},${ctx.bodyParameters.username},${ctx.bodyParameters.password}${cookieFlags}`); // TODO: add cookie renewal procedure
					return ctx.redirectTo('/');
				} else {
					ctx.response.statusCode = upstreamReq.status;
					noticeHtml = `<p class="notice error">Upstream server responded with error ${upstreamReq.status}: ${JSON.stringify(upstreamData)}</p>`;
				}
			} catch (err) {
				console.log(err);
				ctx.response.statusCode = 500;
				// display only generic error from server-side, for security
				noticeHtml = `<p class="notice error">${isEnvServer ? 'Some unknown error just happened. Please check that your data is correct, and try again.' : err}</p>`;
			}
		} else if (ctx.response.statusCode === 200 && ctx.bodyParameters.logout) {
			ctx.setCookie(`account=`);
			return ctx.redirectTo('/');
		}
	}
	ctx.renderPage(`${noticeHtml}
		${accountString ? `
		<h3>Current Account</h3>
		${makeFragmentLoggedIn(accountString)}
		<form method="POST">${makeFormCsrf(accountString)}
			<input type="submit" name="logout" value="Logout"/>
		</form>
		` : '<p>You must login first.</p>'}
		${!accountString ? `<h3><!--Add New Account-->Login</h3>
		<form method="POST">${makeFormCsrf(accountString)}
			<select name="backend">
				<option value="wp.org">
					WordPress.org (Community/Self-hosted)
				</option>
			</select>
			<label><i>Note: For WordPress.org you must use an "application password" (<code>/wp-admin/profile.php#application-passwords-section</code>)</i></label>
			<input type="url" name="instance" placeholder="Site/Instance URL" value="${ctx.bodyParameters.instance || ''}" required="true"/>
			<input type="text" name="username" placeholder="Username" value="${ctx.bodyParameters.username || ''}" required="true"/>
			<input type="password" name="password" placeholder="Password" value="${ctx.bodyParameters.password || ''}" required="true"/>
			<!--${isEnvBrowser ? `<label><input type="checkbox" name="cors" ${ctx.bodyParameters.cors === 'on' && ctx.response.statusCode !== 200 ? 'checked="true"' : ''}/> Site disallows CORS, use proxy</label>` : ''}-->
			<label><input type="checkbox" name="remember" ${ctx.request.method === 'POST' && ctx.bodyParameters.remember !== 'on' ? '' : 'checked="true"'}/> Remember me</label>
			<input type="submit" name="login" value="Login and Save"/>
		</form>` : ''}
		<!--${true ? `
		<h3>Select and Manage Accounts</h3>
		<form method="POST">${makeFormCsrf(accountString)}
			<ul>
				<li>
					<input type="submit" name="select" value="username@url"/>
				</li>
			</ul>
		</form>
		` : ''}-->
	`, 'Settings');
} ];

main();
