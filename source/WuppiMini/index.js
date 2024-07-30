#!/usr/bin/env node
// search "Copyright" in this file for licensing info

// configuration
const appName = 'WuppìMini';
const serverPort = 8135;
const detailedLogging = true;
const serverLanUpstreams = false;
const serverPlaintextUpstreams = false;
const appSelfContained = false;
let staticFiles = [ 'package.json', 'package-lock.json' ];
let linkStyles = [ 'index.css' ];
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
const corsProxies = [ 'corsproxy.io?', 'corsproxy.org?', 'hlb0.octt.eu.org/cors-main.php/' ];

const SpaccDotWebServer = require('SpaccDotWeb/SpaccDotWeb.Server.js');
var crypto, escapeHtml;
let isEnvServer = SpaccDotWebServer.envIsNode;
let isEnvBrowser = SpaccDotWebServer.envIsBrowser;
const httpCodes = { success: [ 200, 201 ] };
const appPlatforms = {
	"wp.org": { name: "WordPress.org (Community/Self-hosted)", writing: true },
	//"greader": { name: "RSS with Google Reader API (FreshRSS, ...)", reading: true },
};
const appLanguages = {
	en: "🇬🇧️ English",
	it: "🇮🇹️ Italiano",
};
const appStrings = {
	compose: { en: `Compose`, it: `Componi` },
	read: { en: `Read`, it: `Leggi` },
	settings: { en: `Settings`, it: `Impostazioni` },
	language: { en: `Language`, it: `Lingua` },
	composePost: {
		en: `Compose Post`,
		it: `Componi Post`,
	},
	postTitle: {
		en: `Post Title`,
		it: `Titolo del Post`,
	},
	includeTags: {
		en: `Include suggested Tags`,
		it: `Includi Tag suggeriti`,
	},
	postingHint: {
		en: `What's on your mind?`,
		it: `A cosa stai pensando?`,
	},
	uploadDraft: {
		en: `Upload Draft`,
		it: `Carica Bozza`,
	},
	publish: {
		en: `Publish!`,
		it: `Pubblica!`,
	},
	postPublished: {
		en: `Post published`,
		it: `Post pubblicato`,
	},
	draftUploaded: {
		en: `Draft uploaded`,
		it: `Bozza caricata`,
	},
	unknownError: {
		en: `An unknown error just happened. Please check that your data is correct, and try again.`,
		it: `Si è verificato un errore sconosciuto. Per favore, controlla che i dati inseriti siano corretti, e riprova.`,
	},
	upstreamError: {
		en: `Upstream server responded with error`,
		it: `Il server di upstream ha risposto con errore`,
	},
	csrfError: {
		en: `Authorization token mismatch. Please try resubmitting.`,
		it: `Il token di autorizzazione non combacia. Per favore ritenta l'invio.`,
	},
	upstreamDisallowed: {
		en: `Upstream destination is not allowed from backend. (Only global HTTPS sites are allowed.)`,
		it: `La destinazione di upstream non è permessa dal backend. (Solo i siti HTTPS globali sono permessi.)`,
	},
	currentAccounts: {
		en: `Current Accounts`,
		it: `Account Correnti`,
	},
	addNewAccount: {
		en: `Add New Account`,
		it: `Aggiungi Nuovo Account`,
	},
	siteInstanceUrl: {
		en: `Site/Instance URL`,
		it: `URL Sito/Istanza`,
	},
	rememberMe: {
		en: `Remember me`,
		it: `Ricordami`,
	},
	loginAndSave: {
		en: `Login and Save`,
		it: `Login e Salva`,
	},
	mustAddAccount: {
		en: (type) => `You must add ${type === 'compose' ? 'a writing' : type === 'read' ? 'a reading' : 'an'} account to continue. Go to <a href="/settings">Settings</a>.`,
		it: (type) => `Devi aggiungere un account ${type === 'compose' ? 'di scrittura' : type === 'read' ? 'di lettura' : ''} per continuare. Vai alle <a href="/settings">Impostazioni</a>.`,
	},
	accountExists: {
		en: `The account you tried to add is already registered.`,
		it: `L'account che hai provato ad aggiungere è già registrato.`,
	},
	logoutAccounts: {
		en: `Logout Selected Accounts`,
		it: `Logout Account Selezionati`,
	},
	noAccountSelected: {
		en: `You haven't selected any account to be removed.`,
		it: `Non hai selezionato alcun account da rimuovere.`
	},
	applyLanguage: {
		en: `Apply Language`,
		it: `Applica Lingua`,
	},
	postEmpty: {
		en: `Post content is empty. Please write some text or upload a media.`,
		it: `Il post è vuoto. Per favore scrivi del testo o carica un file.`,
	},
};
appStrings.get = (string, language='en') => (appStrings[string][language] || Object.values(appStrings[string])[0]);

const appPager = (content, title, opts={}, ctx) => `<div id="header">
	<h1><a href="/">${appName}</a></h1>
	<a href="/compose">${appStrings.get('compose', getUserLanguage(opts.context))} 📝️</a>
	<!--${ctx.envIsBrowser ? '' : `<a href="/read">${appStrings.get('read', getUserLanguage(opts.context))} 📜️</a>`}-->
	<a href="/info">Info ℹ️</a>
	<a href="/settings">${appStrings.get('settings', getUserLanguage(opts.context))} ⚙️</a>
</div><div id="main">${title ? `<h2>${title}</h2>` : ''}${content}</div>`;

const htmlPager = (content, title, opts={}, ctx) => `<!DOCTYPE html><html><head>
	<meta charset="utf-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<meta property="og:title" content="${title ? `${title} — ` : ''}${appName}"/>
	<meta OctoSpaccHubSdk="Url" content="https://hub.octt.eu.org/WuppiMini/"/>
	<meta OctoSpaccHubSdk="WebManifestExtra" content="'display':'standalone', 'icons':[{ 'src':'./icon.png', 'type':'image/png', 'sizes':'256x256' }],"/>
	<title>${title ? `${title} — ` : ''}${appName}</title>
	<link rel="apple-touch-icon" href="./icon.png"/>
	${linkStyles.map((path) => SpaccDotWebServer.makeHtmlStyleFragment(path, appSelfContained)).join('')}
</head><body><!--
	-->${isEnvBrowser ? `<div id="transition"></div>` : ''}<!--
	--><div id="app">${appPager(content, title, opts, ctx)}</div><!--
--></body></html>`;

const A = (href) => `<a href="${href}">${href}</a>`;

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

const corsProxyIfNeed = (/*need*/) => (isEnvBrowser /*&& need*/ ? `https://${corsProxies[~~(Math.random() * corsProxies.length)]}` : '');

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

const getUserLanguage = (ctx) => (ctx.getCookie?.('language') || ctx.clientLanguages?.[0]?.split('-')[0]);

//const getAccountsData = (ctx) => accountsDataFromCookieString(ctx.getCookie('account'));

const getPlatformActionIcon = platform => (platform.writing && platform.reading ? '💱️'
	: (platform.writing && '📤️') || (platform.reading && '📥️'));

const makeAccountFormId = (account) => (btoa(account.username) + ":" + btoa(account.instance));

const accountDataFromFormId = (accountsData, accountId) => accountsData.filter(account => {
	let [username, instance] = accountId.split(':');
	username = atob(username);
	instance = atob(instance);
	return accountsData.filter(account => (account.username === username && account.instance === instance))[0];
})[0];

const accountsDataFromCookieString = (accountString) => {
	const accounts = [];
	if (!accountString) {
		return accounts;
	}
	// old format, kept in just to support old sessions
	let tokens = accountString.split(',');
	if (tokens.length >= 3 && ['http', 'https'].includes(accountString.split('://')[0].toLowerCase())) {
		return [{ platform: "wp.org", instance: tokens[0], username: tokens[1], password: tokens.slice(2).join(','), options: {} }];
	}
	// new format
	for (const account of accountString.split(',')) {
		const tokens = account.split(':');
		const options = {};
		for (const option of tokens.slice(4)) {
			const [key, value] = option.split('=');
			options[key] = (value || true);
		}
		accounts.push({
			platform: tokens[0],
			instance: atob(tokens[1]),
			username: atob(tokens[2]),
			password: atob(tokens[3]),
			options,
		});
	}
	return accounts;
};

const accountsCookieStringFromData = (accountData) => {
	let accounts = '';
	for (const account of [].concat(accountData)) {
		accounts += `,${account.platform}:${btoa(account.instance)}:${btoa(account.username)}:${btoa(account.password)}`;
		for (const [key, value] of Object.entries(account.options)) {
			accounts += `:${key}` + (value === true ? '' : `=${value}`);
		}
	}
	return accounts.slice(1);
};

const makeCookieFlags = (opts) => ((opts === true || opts.remember === 'on') ? `; max-age=${365*24*60*60}` : '');

const main = async () => {
	if (isEnvServer && process.argv[2] !== 'writeStaticHtml') {
		staticFiles = [__filename.split(require('path').sep).slice(-1)[0], ...staticFiles];
	};

	const server = SpaccDotWebServer.setup({
		appName: appName,
		staticPrefix: '/res/',
		staticFiles, linkStyles,
		appPager, htmlPager,
	});

	if (isEnvServer && process.argv[2] === 'writeStaticHtml') {
		server.writeStaticHtml(appSelfContained);
	} else {
		escapeHtml = (await require('escape-html/index.js') || window.escapeHtml);
		if (isEnvServer) {
			crypto = require('crypto');
			console.log(`Running Server on :${serverPort}...`);
		};
		server.initServer({
			port: serverPort,
			address: '0.0.0.0',
			maxBodyUploadSize: 4e6, // 4 MB
			endpoints: [ endpointRoot, endpointInfo, /* endpointHub, */ endpointCompose, /* endpointRead, */ endpointSettings, endpointCatch ],
		});
	};
};

// TODO fix this for now that we have 2 sections but may not always have the needed account
const endpointRoot = [ (ctx) => (!ctx.urlSections[0]), (ctx) => {
	const account = accountsDataFromCookieString(ctx.getCookie('account'))?.[0];
	ctx.redirectTo((account ? (appPlatforms[account.platform].writing ? '/compose' : '/read') : '/info') + `?${ctx.urlQuery}`);
} ];

const endpointCatch = [ (ctx) => true, (ctx) => ctx.renderPage('<p>This page does not exist. <a href="/">Go back to the home page</a>.</p>', (ctx.response.statusCode = 404)) ];

const endpointInfo = [ 'GET /info/', (ctx) => {
	ctx.response.statusCode = 200;
	ctx.renderPage(`
		${!ctx.getCookie('account') ? `<p class="notice info">${appStrings.get('mustAddAccount', getUserLanguage(ctx))(ctx.urlParameters.ref)}</p>` : ''}
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
			${staticFiles.map(file => ` • <a href="/res/${file}">${file}</a>`).join('')}.
			` : 'To get the original, unminified source code, visit this same page on the server-side version (refer to the Versions section above).'}
			Alternatively, you can also find the source code on my shared Git repo: ${A('https://gitlab.com/octospacc/octospacc.gitlab.io/-/tree/master/source/WuppiMini/')}.
		</p>
		${isEnvServer ? `<h3>Terms of Use and Privacy Policy</h3>${appTerms}` : ''}
		<h3>Changelog</h3>
		<h4>2024-07-15 (deployed 2024-07-30)</h4><ul>
			<!--<li>New Read function, connecting to RSS servers via Google Reader API.</li>-->
			<li>Multi-account support (required changes to the cookie format), allowing for selection of destination in Compose and filtering of sources in Read.</li>
			<li>New multi-language support, using browser language as a default and allowing change in Settings.</li>
			<li>Slight UX improvements and bugfixes to existing forms and screens.</li>
			<li>Made a preview of the Compose screen visible before logging-in.</li>
		</ul>
		<h4>2024-02-24</h4><ul>
			<li>Allow uploading posts as published or draft, via 2 distinct buttons.</li>
			<li>Migrated fancy portable-server-codebase to <a href="https://gitlab.com/SpaccInc/SpaccDotWeb">SpaccDotWeb</a> for code reuse and slimming down of the application core.</li>
		</ul>
		<h4>2024-02-12</h4><ul>
			<li>First working client-side version of the current app, without backend server (still a bit buggy).</li>
			<li>Fixed suggested tags handling not working and making the post error out, by instead simply writing them in the post body</li>
		</ul>
		<h4>2024-02-10</h4><ul>
			<li>Add "remember me" login option.</li>
			<li>Add "suggested tags" publishing option, will automatically add this list of tags to the post: [${suggestedTags}].</li>
		</ul>
		<h4>2024-02-09</h4><ul>
			<li>First working version, with an UI reminiscent of [that dead social network that rhymes with Meterse], and Info, Settings, and Composition pages!</li>
			<li>Allow logging in with a WordPress.org profile, and creating new posts, including uploading images.</li>
			<li>Add licensing and proper source code listing.</li>
			<li>Tested on New and Old 3DS.</li>
		</ul>
	`);
} ];

const endpointCompose = [ 'GET|POST /compose/', async (ctx) => {
	let [noticeErrorHtml, noticeSuccessHtml] = ['', ''];
	const language = getUserLanguage(ctx);
	const accountString = ctx.getCookie('account');
	const accounts = accountsDataFromCookieString(accountString)?.filter(account => appPlatforms[account.platform].writing);//getAccountsData(ctx);
	ctx.response.statusCode = 200;
	const postUploadStatus = ((ctx.bodyParameters?.publish && 'publish') || (ctx.bodyParameters?.draft && 'draft'));
	if (ctx.request.method === 'POST' && postUploadStatus) {
		if (!matchCsrfToken(ctx.bodyParameters, accountString)) {
			ctx.response.statusCode = 401;
			noticeErrorHtml = appStrings.get('csrfError', language);
		}
		const isThereAnyFile = ((ctx.bodyParameters.file?.data?.length || ctx.bodyParameters.file?.size) > 0);
		if (!ctx.bodyParameters.text?.trim() && !isThereAnyFile) {
			ctx.response.statusCode = 500;
			noticeErrorHtml = appStrings.get('postEmpty', language);
		}
		const account = accountDataFromFormId(accounts, ctx.account); //accountsDataFromCookieString(accountString)[0];
		if (!checkUpstreamAllowed(account.instance)) {
			ctx.response.statusCode = 500;
			noticeErrorHtml = appStrings.get('upstreamDisallowed', language);
		}
		let mediaData;
		try {
			// there is a media to upload first
			if (httpCodes.success.includes(ctx.response.statusCode) && isThereAnyFile) {
				const mediaReq = await fetch(`${corsProxyIfNeed(account.cors)}${account.instance}/wp-json/wp/v2/media`, { headers: {
					...getBackendHeaders(account),
					"Content-Type": ctx.bodyParameters.file.type,
					"Content-Disposition": `attachment; filename=${ctx.bodyParameters.file.filename}`,
				}, method: "POST", body: (ctx.bodyParameters.file.data || ctx.bodyParameters.file) });
				mediaData = await mediaReq.json();
				if (!httpCodes.success.includes(mediaReq.status)) {
					noticeErrorHtml = `${appStrings.get('upstreamError', language)} ${ctx.response.statusCode = mediaReq.status}: ${escapeHtml(JSON.stringify(mediaData))}`;
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
					...getBackendHeaders(account),
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
					noticeSuccessHtml = `${appStrings.get((postUploadStatus === 'publish' ? 'postPublished' : postUploadStatus === 'draft' ? 'draftUploaded' : ''), language)}! ${A(postData.link)}`;
				} else {
					noticeErrorHtml = `${appStrings.get('upstreamError', language)} ${ctx.response.statusCode = postReq.status}: ${escapeHtml(JSON.stringify(postData))}`;
				}
			}
		} catch (err) {
			console.log(err);
			ctx.response.statusCode = 500;
			// display only generic error from server-side, for security
			noticeErrorHtml = (isEnvServer ? appStrings.get('unknownError', language) : err);
		}
		// TODO handle media upload success but post fail, either delete the remote media or find a way to reuse it when the user probably retries posting
	}
	const disabledHtml = (!Object.keys(accounts).length ? 'disabled="true"' : '');
	ctx.renderPage(`
		${disabledHtml ? `<p class="notice info">${appStrings.get('mustAddAccount', getUserLanguage(ctx))('compose')}</p>` : ''}
		${noticeErrorHtml ? `<p class="notice error">${noticeErrorHtml}</p>` : ''}
		${noticeSuccessHtml ? `<p class="notice success">${noticeSuccessHtml}</p>` : ''}
		<form method="POST" enctype="multipart/form-data">${makeFormCsrf(accountString)}
			<select name="account" ${disabledHtml}>${accounts.map(account => `<option value="${makeAccountFormId(account)}">
				${account.username}@${account.instance} (${account.platform})
			</option>`).join('')}</select>
			<input type="text" name="title" placeholder="${appStrings.get('postTitle', language)}" value="${ctx.bodyParameters.title && ctx.response.statusCode !== 200 ? ctx.bodyParameters.title : ''}" ${disabledHtml}/>
			<input type="file" accept="image/jpeg,image/gif,image/png,image/webp,image/bmp" name="file" ${disabledHtml}/>
			<textarea name="text" rows="10" placeholder="${appStrings.get('postingHint', language)}" ${disabledHtml}>${ctx.bodyParameters.text && ctx.response.statusCode !== 200 ? ctx.bodyParameters.text : ''}</textarea>
			<!-- TODO: fix the turn off-on on submit of these checkboxes... -->
			<label><input type="checkbox" name="html" ${ctx.bodyParameters.html === 'on' && ctx.response.statusCode !== 200 ? 'checked="true"' : ''} ${disabledHtml}/> Raw HTML mode</label>
			<label><input type="checkbox" name="tags" ${ctx.request.method === 'GET' || (ctx.bodyParameters.tags === 'on' && ctx.response.statusCode !== 200) ? 'checked="true"' : ''} ${disabledHtml}/> ${appStrings.get('includeTags', language)}</label>
			<input type="submit" name="draft" value="${appStrings.get('uploadDraft', language)}" ${disabledHtml}/>
			<input type="submit" name="publish" value="${appStrings.get('publish', language)}" ${disabledHtml}/>
		</form>
	`, appStrings.get('composePost', language));
} ];

const endpointRead = [ 'GET /read/', async (ctx) => {
	const accountString = ctx.getCookie('account');
	const accounts = accountsDataFromCookieString(accountString)?.filter(account => appPlatforms[account.platform].reading);
	if (!accounts || !Object.keys(accounts).length) {
		return ctx.redirectTo('/?ref=read');
	}
	ctx.response.statusCode = 200;
	const [accountIndex, channelIndex] = ctx.urlSections.slice(1);
	if (accountIndex && channelIndex) {
		const account = accounts[accountIndex];
		const postsReq = await fetch(`${corsProxyIfNeed()}${account.instance}/api/greader.php/reader/api/0/stream/contents/feed/${channelIndex}?output=json`/*`reading-list?output=json`*/, { headers: getBackendHeaders(account) });
		const postsData = await postsReq.json();
		ctx.renderPage(`<div class="posts">${postsData.items.map(post => `<article>
			<header>
				<b><a href="${post.origin.htmlUrl}">${post.origin.title}</a></b>
				<a href="${post.canonical[0].href}">${post.published}</a>
				<h3>${post.title}</h3>
			</header>
			<p>${post.summary.content}</p>
		</article>`).join('')}</div>`);
	} else {
		//if (ctx.request.method === 'POST') {
		//	// TODO handle reading of selected accounts, folders, other options
		//}
		const account = accounts[0];
		const channelsReq = await fetch(`${corsProxyIfNeed()}${account.instance}/api/greader.php/reader/api/0/subscription/list?output=json`, { headers: getBackendHeaders(account) });
		const channelsData = await channelsReq.json();
		const unreadReq = await fetch(`${corsProxyIfNeed()}${account.instance}/api/greader.php/reader/api/0/unread-count?output=json`, { headers: getBackendHeaders(account) });
		const unreadData = await unreadReq.json();
		const unreads = {};
		for (const unread of unreadData.unreadcounts) {
			unreads[unread.id] = unread.count;
		}
		const folders = {};
		for (const channel of channelsData.subscriptions) {
			const category = channel.categories[0];
			folders[category.id.slice('user/-/label/'.length)] = category.label;
		}
		ctx.renderPage(`
		<form>
			<select name="account" multiple="true">${Object.entries(accounts).map(account => `<option value="${account[0]/*makeAccountFormId(account)*/}" ${(!ctx.bodyParameters.account || ctx.bodyParameters.account.includes(account[0])) ? 'selected="true"' : ''}>
				${account[1].username}@${account[1].instance} (${account[1].platform})
			</option>`).join('')}</select>
			<select name="folder" multiple="true">${Object.entries(folders).map(folder => `<option value="${0}/${folder[0]}" selected="true">
				${folder[1]}
			</option>`).join('')}</select>
		</form>
		<div class="channels">${channelsData.subscriptions.map(channel => `<a href="/read/${0}/${channel.id.split('/')[1]}">
			<img src="${channel.iconUrl}"/> ${channel.title} ${unreads[channel.id] ? `<span>${unreads[channel.id]}</span>` : ''}
		</a>`).join('')}</div>
		`, 'Channels');
	}
} ];

const endpointSettings = [ 'GET|POST /settings/', async (ctx) => {
	let [noticeErrorHtml] = [''];
	const language = getUserLanguage(ctx);
	const accountString = ctx.getCookie('account');
	const accounts = accountsDataFromCookieString(accountString);//getAccountsData(ctx);
	ctx.response.statusCode = 200;
	if (ctx.request.method === 'POST') {
		if (accountString && !matchCsrfToken(ctx.bodyParameters, accountString)) {
			ctx.response.statusCode = 401;
			noticeErrorHtml = appStrings.get('csrfError', language);
		} else if (ctx.bodyParameters.language) {
			ctx.setCookie(`language=${ctx.bodyParameters.language}${makeCookieFlags(true)}`);
			return ctx.redirectTo('/settings'); // TODO remove, just a workaround to the server not updating readable cookies by itself
		} else if (ctx.bodyParameters.login) {
			ctx.bodyParameters.instance = ctx.bodyParameters.instance.trim();
			if (!checkUpstreamAllowed(ctx.bodyParameters.instance)) {
				ctx.response.statusCode = 500;
				noticeErrorHtml = appStrings.get('upstreamDisallowed', language);
			} else if (accounts.filter(account => (makeAccountFormId(account) === makeAccountFormId(ctx.bodyParameters))).length) {
				ctx.response.statusCode = 500;
				noticeErrorHtml = appStrings.get('accountExists', language);
			} else {
				const loginResult = await loginBackend(ctx.bodyParameters, language);
				if (loginResult.success) {
					ctx.setCookie(`account=${accountsCookieStringFromData([...accounts, {
						...ctx.bodyParameters,
						options: { remember: (ctx.bodyParameters.remember === 'on') },
						...loginResult.data,
					}])}${makeCookieFlags(ctx.bodyParameters)}`); // TODO: add cookie renewal procedure
				}
				if (loginResult.code) {
					ctx.response.statusCode = loginResult.code;
				}
				if (loginResult.error) {
					noticeErrorHtml = loginResult.error;
				}
				if (loginResult.redirect) {
					return ctx.redirectTo(loginResult.redirect);
				}
			}
		} else if (ctx.bodyParameters.logout) {
			if (ctx.bodyParameters.account) {
				for (const accountId of [].concat(ctx.bodyParameters.account)) {
					const formAccount = JSON.stringify(accountDataFromFormId(accounts, accountId));
					for (const dataAccountIndex in accounts) {
						if (formAccount === JSON.stringify(accounts[dataAccountIndex])) {
							accounts.splice(dataAccountIndex, 1);
						}
					}
				}
				ctx.setCookie(`account=${accountsCookieStringFromData(accounts)}${makeCookieFlags(ctx.bodyParameters)}`);
				return ctx.redirectTo('/');
			} else {
				ctx.response.statusCode = 500;
				noticeErrorHtml = appStrings.get('noAccountSelected', language);
			}
		}
	}
	const mustRememberAccount = accounts?.slice(-1)?.[0]?.options?.remember;
	const formSharedHtml = `${mustRememberAccount ? '<input type="hidden" name="remember" value="on"/>' : ''}`;
	ctx.renderPage(`
		${noticeErrorHtml ? `<p class="notice error">${noticeErrorHtml}</p>` : ''}
		<form method="POST">${makeFormCsrf(accountString)}
			<h3>${appStrings.get('language', language)}</h3>
			<select name="language">${Object.entries(appLanguages).map(lang => `<option value="${lang[0]}" ${language === lang[0] ? 'selected="true"' : ''}>${lang[1]}</option>`).join('')}</select>
			<input type="submit" value="${appStrings.get('applyLanguage', language)}"/>
		${formSharedHtml}</form>
		${accountString ? `<h3>${appStrings.get('currentAccounts', language)}</h3>
		<form method="POST">${makeFormCsrf(accountString)}
			${accounts.map(account => `<label><input type="checkbox" name="account" value="${makeAccountFormId(account)}"/>
				${getPlatformActionIcon(appPlatforms[account.platform])}
				${account.username}@${account.instance} (${account.platform})</label>`).join('')}
			<input type="submit" name="logout" value="${appStrings.get('logoutAccounts', language)}"/>
		${formSharedHtml}</form>
		` : ''}
		<h3>${appStrings.get('addNewAccount', language)}</h3>
		<form method="POST">${makeFormCsrf(accountString)}
			<select name="platform">${Object.entries(appPlatforms).map(platform => `<option value="${platform[0]}" ${ctx.bodyParameters.platform === platform[0] ? 'selected="true"' : ''}>
				${getPlatformActionIcon(platform[1])} ${platform[1].name}
			</option>`).join('')}</select>
			<p><i>
				Note: For WordPress.org you must use an "application password"
				( <code>/wp-admin/profile.php#application-passwords-section</code> )
			</i></p>
			<input type="url" name="instance" placeholder="${appStrings.get('siteInstanceUrl', language)}" value="${ctx.bodyParameters.instance || ''}" required="true"/>
			<input type="text" name="username" placeholder="Username" value="${ctx.bodyParameters.username || ''}" required="true"/>
			<input type="password" name="password" placeholder="Password" value="${ctx.bodyParameters.password || ''}" required="true"/>
			<label>
				<input type="checkbox" name="remember" ${ctx.request.method === 'POST'
					? (ctx.bodyParameters.remember === 'on' ? 'checked="true"' : '')
					: (mustRememberAccount ? 'checked="true"' : '')}
				${accounts?.length > 0 ? 'disabled="true"' : ''}
			/> ${appStrings.get('rememberMe', language)}</label>
			<input type="submit" name="login" value="${appStrings.get('loginAndSave', language)}"/>
		${formSharedHtml}</form>
	`, appStrings.get('settings', language));
} ];

const getBackendHeaders = (account) => {
	switch (account.platform) {
		case 'wp.org':
			return { "Authorization": `Basic ${btoa(account.username + ':' + account.password)}` };
		break;
		case 'greader':
			return { "Authorization": `GoogleLogin auth=${account.username}/${account.password}` };
		break;
	}
};

const loginBackend = async (loginData, language) => {
	const result = {};
	let upstreamReq, upstreamData;
	try {
		switch (loginData.platform) {
			case 'wp.org':
				upstreamReq = await fetch(`${corsProxyIfNeed(/*loginData.cors === 'on'*/)}${loginData.instance}/wp-json/wp/v2/users?context=edit`, { headers: getBackendHeaders(loginData) });
				upstreamData = await upstreamReq.json();
				if (upstreamReq.status === 200) {
					result.success = true;
					result.redirect = '/';
				} else {
					result.code = upstreamReq.status;
					result.error = `${appStrings.get('upstreamError', language)} ${upstreamReq.status}: ${escapeHtml(JSON.stringify(upstreamData))}`;
				}
			break;
			case 'greader':
				upstreamReq = await fetch(`${corsProxyIfNeed()}${loginData.instance}/api/greader.php/accounts/ClientLogin?Email=${encodeURIComponent(loginData.username)}&Passwd=${encodeURIComponent(loginData.password)}`);
				upstreamData = await upstreamReq.text();
				if (upstreamReq.status === 200) {
					const authToken = upstreamData.split('\n').filter(line => line.startsWith('Auth='))[0].split('=')[1].split('/');
					result.data = { username: authToken[0], password: authToken[1] };
					result.success = true;
					result.redirect = '/';
				} else {
					result.code = upstreamReq.status;
					result.error = `${appStrings.get('upstreamError', language)} ${upstreamReq.status}: ${escapeHtml(upstreamData)}`;
				}
			break;
		}
	} catch (err) {
		console.log(err);
		// display only generic error from server-side, for security
		result.code = 500;
		result.error = (isEnvServer ? appStrings.get('unknownError', language) : err);
	}
	return result;
};

main();
