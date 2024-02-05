// TODO:
// * support opening posts from not only id but also permalink
// * custom colors
// * reduce lag on mobile somehow
// * open author profiles/bios as a channel and show only their messages instead of the full site
// * show site/profile info on click of navbar for mobile
// * in-app search of site content
// * homepage with history and sponsored sources
// * don't show redundant day markers
// * fetch and compile to show Markdown WordPress export pages from Git?
// * app info in main page without JS?
// * fix some messages being skipped when connection errors happen (already done?)
// * optionally show post titles?
// * fix some unfinished tasks still executing when clicking back
// * I think we might need to handle acronicized names for users when needed?
// * show, and/or sort by, posts tags/categories
// * scroll to post id when loading from dataInject or RSS

let MbState = {};
let MbApiTransformer;

function ArgsRewrite (props={}, navigate=true) {
	for (const key in props) {
		const value = props[key];
		value ? (MbState.args[key] = value) : (delete MbState.args[key]);
	}
	let hash = '/';
	for (const arg in MbState.args) {
		hash += `${arg}=${MbState.args[arg]}|`;
	}
	if (navigate) {
		location.hash = hash;
	}
	return hash
}

const SureArray = (obj) => (Array.isArray(obj) ? obj : [obj]);

// <https://stackoverflow.com/questions/29956338/how-to-accurately-determine-if-an-element-is-scrollable/71170105#71170105>
function CanScrollEl (el, scrollAxis) {
	if (0 === el[scrollAxis]) {
		el[scrollAxis] = 1;
		if (1 === el[scrollAxis]) {
			el[scrollAxis] = 0;
			return true;
		}
	} else {
		return true;
	}
	return false;
}
function IsScrollableY (el) {
	return (el.scrollHeight > el.clientHeight) && CanScrollEl(el, 'scrollTop') && ('hidden' !== getComputedStyle(el).overflowY);
}

// <https://www.javascripttutorial.net/dom/css/check-if-an-element-is-visible-in-the-viewport/>
function IsElemInViewport (elem) {
	const rect = elem.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

function GetDomainFromUrl (url) {
	return url.split('//')[1].split('/')[0];
}

function MakeSiteRestUrl (path='') {
	const siteUrl = MbState.siteUrl;
	if (GetDomainFromUrl(siteUrl).toLowerCase() === 'octospacc.altervista.org') {
		return `${siteUrl}/wp-content/uploads/${siteUrl.split('.').slice(0, 1)[0].split('//')[1]}/scripts/stuff.php?&Thing=SiteWpJsonCors&AccessToken=9ab6e20c&$Query=${encodeURIComponent(path)}`;
	} else {
		if (["atom", "rss", "wordpress.org"].includes(MbState.platform)) {
			const proxies = ["corsproxy.io", "corsproxy.org"];
			return `https://${proxies[~~(Math.random() * proxies.length)]}/?${siteUrl}/${MbState.platform === 'wordpress.org' ? `wp-json/${path}` : ''}`;
		} else if (MbState.platform === 'wordpress.com') {
			return `https://public-api.wordpress.com/rest/v1.1/sites/${GetDomainFromUrl(siteUrl)}/${path}`;
		} else if (MbState.platform === 'mastodon') {
			return `${MbState.siteUrl.split('/').slice(0, 3).join('/')}/api/${path || 'v2/instance'}`;
		}
	}
}

function MakeApiEndpoint (type, options={}) {
	const translations = {
		"mastodon": {},
		"wordpress.org": {
			count: "per_page",
			orderBy: "orderby",
		},
		"wordpress.com": {
			count: "number",
			orderBy: "order_by",
		},
	}
	let query = '';
	for (const option in options) {
		if (option !== 'id') {
			query += `&${translations[MbState.platform][option] || option}=${options[option]}`;
		}
	}
	query = `${options.id || ''}?${query.slice(1)}`;
	switch (MbState.platform) {
		case 'mastodon':
			switch (type) {
				case 'acct' : query = `v1/accounts/lookup?acct=${options.username}`; break;
				case 'default':
				case 'posts': query = `v1/accounts/${MbState.userId}/statuses?exclude_replies=true`; break;
			}
		break;
		case 'wordpress.org': query = `wp/v2/${type}/${query}`; break;
		case 'wordpress.com': query = `${type}/${query}`;       break;
	}
	return query;
}

function MakeAcroName(name) {
	let acro = '';
	for (const word of name.split(' ').slice(0,3)) {
		acro += word[0].toUpperCase();
	}
	return acro;
}

async function MbViewerInit () {
	if (!location.hash) {
		location.hash = '/';
	}
	if (!MbApiTransformer) {
		MbApiTransformer = Trasformapi(MbViewerTrasformapiSchema).TransformForInput;
	}
	MbState = {
		args: {},
		siteData: {
			name: "👁️‍🗨️️ MBViewer",
			acroName: '👁️‍🗨️️ MBV',
			description: `
				The messages of this channel are baked inside the app,
				and serve as the centralized place for all kinds of information about it,
				while at the same time acting as a demo.
				Please enjoy your time here, or use the search bar to input a supported URL.
				<br/>
				For other projects, visit the Octo Hub at <a href="https://hub.octt.eu.org">hub.octt.eu.org</a>!
			`,
		},
		authors: {},
		lastPostOffsetAfter: 0,
		lastPostOffsetBefore: 0,
		lastMustScroll: true,
		internalIdCount: 0,
	};
	$('form.tgme_header_search_form')[0].action = '';
	$('form.tgme_header_search_form')[0].onsubmit = function(event){
		let url = event.target.querySelector('input').value;
		const urlLow = url.toLowerCase();
		if (!urlLow.startsWith('http://') && !urlLow.startsWith('https://')) {
			url = `https://${url}`;
		}
		if (["t.me", "telegram.me"].includes(url.toLowerCase().split('://')[1].split('/')[0])) {
			location = url;
		} else {
			ArgsRewrite({ siteurl: url });
		}
		event.preventDefault();
	};
	$('a.tgme_header_link')[0].onclick = function(){
		if (window.innerWidth <= 720 ) { // .tgme_header_right_column @media max-width
			if (!$('.tgme_header_right_column')[0].style.display) {
				$('body')[0].style.overflow = 'hidden';
				$('main.tgme_main')[0].style.visibility = 'hidden';
				$('.tgme_header_search')[0].style.display = 'none';
				$('.tgme_header_right_column')[0].style.display = 'revert';
				$('.tgme_header_right_column')[0].style.width = 'calc(100% - 24px)';
				$('.tgme_header_right_column .tgme_channel_info')[0].style.height = 'calc(100% - 32px)';
				$('.tgme_header_right_column a[name="closeColumn"]')[0].hidden = false;
			} else {
				HideMobileRightColumn();
			}
		}
	};
	$('.tgme_header_right_column a[name="closeColumn"]')[0].onclick = HideMobileRightColumn;
	$('.tgme_channel_info_header_username').html('');
	$('.tgme_page_photo_image').html('');
	$('.tgme_page_photo_image').removeClass('bgcolor0 bgcolor1 bgcolor2 bgcolor3 bgcolor4 bgcolor5 bgcolor6');
	$('.tgme_page_photo_image').attr('data-content', '');
	$('.tgme_header_title, .tgme_channel_info_header_title').html('');
	$('.tgme_channel_info_description').html('');
	$('section.tgme_channel_history.js-message_history').html('');
	for (const arg of location.hash.split('/').slice(1).join('/').split('|')) {
		if (arg) {
			const argTokens = arg.split('=');
			const valueItems = argTokens.slice(1).join('=').split(',');
			MbState.args[argTokens[0].toLowerCase()] = (valueItems.length > 1 ? valueItems : valueItems[0]);
		}
	}
	MbState.siteUrl = MbState.args.siteurl;
	MbState.platform = /*SureArray(*/MbState.args.platform/*)*/;
	MbState.postId = MbState.args.postid;
	//MbState.postSlug = MbState.args.postslug;
	RefreshIncludeStyle();
	RefreshIncludeScript();
	if (MbState.args.dataurl) {
		// TODO initially remove built-in site data?
		MbState.dataInject = {};
		try {
			const fileUrlPrefix = (MbState.args.dataurl.split('/').slice(0, -1).join('/') || '.');
			const dataRequest = await fetch(MbState.args.dataurl);
			MbState.dataInject = await dataRequest.json();
			let messagesNew = [];
			if (MbState.platform === 'telegram.export') {//(["telegram.export", "telegram.json"].includes(MbState.platform)) {
				MbState.siteData = {
					name: MbState.dataInject.name,
					description: `${MbState.dataInject.type} ${MbState.dataInject.id}`,
					acroName: (!MbState.siteData.iconUrl ? MbState.dataInject.name && MakeAcroName(MbState.dataInject.name) : ''),
					bgColor: ~~(Math.random() * 7),
				};
				const textEncoder = document.createElement('textarea');
				for (const message of MbState.dataInject.messages) {
					if (message.type !== 'message') {
						continue;
					}
					messagesNew.push({
						content: '',
						quoting: (message.forwarded_from && {
							author: {
								name: `Forwarded from ${message.forwarded_from}`,
							},
						}),
						time: message.date,
						url: `#${ArgsRewrite({ postid: null }, false)}PostId=${message.id}`,
					});
					//for (const piece of (Array.isArray(message.text) ? message.text : [message.text])) {
					//	messagesNew[messagesNew.length - 1].content += (piece.text || piece);
					//}
					//const encoder = document.createElement('textarea');
					//encoder.innerHTML = messagesNew[messagesNew.length - 1].content;
					//messagesNew[messagesNew.length - 1].content = encoder.innerHTML.replaceAll('\n', '<br/>');
					for (const entity of message.text_entities) {
						const entityTag = { bold: "b", italic: "i", link: "a", text_link: "a", pre: "pre", blockquote: "blockquote" }[entity.type];
						const entityHref = (entityTag === 'a' && (entity.href || entity.text));
						textEncoder.innerHTML = entity.text;
						entity.text = textEncoder.innerHTML.replaceAll('\n', '<br/>');
						messagesNew[messagesNew.length - 1].content += (entityTag
							? `<${entityTag} ${entityHref ? `href="${entityHref}"` : ''}>${entity.text}</${entityTag}>`
							: entity.text);
					}
					if (messagesNew[messagesNew.length - 1].content) {
						messagesNew[messagesNew.length - 1].content = `<p>${messagesNew[messagesNew.length - 1].content}</p>`;
					}
					if (message.photo) {
						messagesNew[messagesNew.length - 1].content = `<img src="${fileUrlPrefix}/${message.photo}"/>${messagesNew[messagesNew.length - 1].content}`;
					} else if (message.file && message.mime_type?.split('/')[0] === 'video') {
						messagesNew[messagesNew.length - 1].content = `<video controls="true" src="${fileUrlPrefix}/${message.file}"></video>${messagesNew[messagesNew.length - 1].content}`;
					}
				}
			} else {
				messagesNew = MbApiTransformer('message[]', MbState.platform, MbState.dataInject);
			}
			$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml());
			TWeb.loadMore($('.js-messages_more_wrap > a'), messagesNew);
		} catch(err) {
			console.log(err);
			setTimeout(MbViewerInit, 1000);
			return;
		}
	}
	else if (MbState.siteUrl) {
		if (!MbState.platform) {
			if (GetDomainFromUrl(MbState.siteUrl).toLowerCase().endsWith('wordpress.com')) {
				MbState.platform = 'wordpress.com';
			} else {
				MbState.platform = 'wordpress.org';
			}
		}
		try {
			const siteRequest = await fetch(MakeSiteRestUrl());
			MbState.siteData = (["atom", "rss"].includes(MbState.platform)
				? new DOMParser().parseFromString(await siteRequest.text(), 'text/xml')
				: await siteRequest.json());
			if (MbState.platform === 'mastodon') {
				MbState.siteData = MbApiTransformer('profile', MbState.platform, MbState.siteData);
				let username = MbState.siteUrl;
				if (username.endsWith('/')) username = username.slice(0, -1);
				username = username.split('/').slice(-1)[0];
				if (username.startsWith('@')) username = username.slice(1);
				const userRequest = await fetch(MakeSiteRestUrl(MakeApiEndpoint('acct', { username })));
				const userData = await userRequest.json();
				MbState.authors[MbState.userId = userData.id] = MbApiTransformer('profile', MbState.platform, userData);
			}
		} catch(err) {
			console.log(err);
			setTimeout(MbViewerInit, 1000);
			return;
		}
		const siteLink = (MbState.siteData.url || MbState.siteData.URL || MbState.siteUrl);
		MbState.startingPost = MbState.postId;//!!(MbState.postId || MbState.postSlug);
		if (MbState.startingPost) {
			try {
				const postRequest = await fetch(MakeSiteRestUrl(MakeApiEndpoint('posts', { id: MbState.postId })));
				MbState.startingPost = await postRequest.json();
				$('section.tgme_channel_history.js-message_history').append(MakeMoreWrapperHtml('after'));
				MbState.lastPostOffsetAfter = 0; // for some reason we need to clear this after making the wrapper or else we lose a post
				TWeb.loadMore($('.js-messages_more_wrap > a[data-after]'), MbState.startingPost);
				$('section.tgme_channel_history.js-message_history').prepend(MakeMoreWrapperHtml('before'));
			} catch(err) {
				console.log(err);
				setTimeout(MbViewerInit, 1000);
				return;
			}
		} else if (!["atom", "rss"].includes(MbState.platform)) {
			$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml('before'));
			TWeb.loadMore($('.js-messages_more_wrap > a'));
		}
		$('form.tgme_header_search_form')[0].action = `${siteLink}/?s`;
		$('form.tgme_header_search_form')[0].onsubmit = null;
		$('.tgme_channel_info_header_username').html(`<a href="${siteLink}">${GetDomainFromUrl(siteLink).toLowerCase()}</a>`);
	}
	if (MbState.siteUrl || MbState.dataInject) {
		$('a[name="goBack"]')[0].hidden = false;
	}
	if (["atom", "rss"].includes(MbState.platform)) {
		$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml());
		TWeb.loadMore($('.js-messages_more_wrap > a'), MbState.siteData);
		MbState.siteData = MbApiTransformer('profile', MbState.platform, MbState.siteData.querySelector(':scope > channel'));
	}
	MbState.siteData.iconUrl = (MbState.siteData.icon?.url || MbState.siteData.site_icon_url || MbState.siteData.icon?.img || MbState.siteData.icon?.ico);
	MbState.siteData.acroName ||= (!MbState.siteData.iconUrl ? MbState.siteData.name && MakeAcroName(MbState.siteData.name) : '');
	MbState.siteData.bgColor = ~~(Math.random() * 7);
	if (MbState.siteData.iconUrl && !["http", "https"].includes(MbState.siteData.iconUrl.split('://')[0])) {
		MbState.siteData.iconUrl = `${MbState.siteUrl}${MbState.siteData.iconUrl}`;
	}
	if (!MbState.siteUrl && !MbState.dataInject) {
		$('a[name="goBack"]')[0].hidden = true;
		$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml());
		TWeb.loadMore($('.js-messages_more_wrap > a'), [{ content: `<p>
			Here I am, doing another strange thing of mine.
			This is my personal experiment to make an MB-style frontend for sources that are by default not really friendly to that concept.
			Since this first day, we will start with just WordPress, and we'll see what comes from that.
			See <a href="https://octospacc.altervista.org/2024/01/13/wordpress-che-non-e/">https://octospacc.altervista.org/2024/01/13/wordpress-che-non-e/</a>.
		</p>`, time: '2024-01-13T21:00' }, { content: `<p>
			After fixing a few post-release issues driving me insane (scrolling cough cough), here are some new improvements:
			<br/> * Handling of posts without date is just a bit nicer.
			<br/> * Added a back button to return to this page here from a real site stream.
			<br/> * Added CORS proxies to handle sites normally inaccessible.
			<br/> * Hey there, this text and everything is new...
			<br/>
			I also just now realized that wordpress.com uses a different REST API with different endpoints and parameters,
			so I will need to handle that...
		</p>`, time: '2024-01-14T02:00' }, { content: `<p>
			New changes:
			<br/> * Correctly handle wordpress.com blogs
			<br/> * Show specific users as post authors whenever possible
			<br/> * Made the navigation bar smarter: now handles URLs without schema, and t.me links (redirects to official site)
			<br/> * Made the info box (right column on desktop) visible on small screens (by clicking the screen header)
			<br/> * Added an Altervista workaround for videos not loading (bypass anti-hotlinking)
			<br/> * Made URL hash parameter names case-insensitive
			<br/> * Now sites without an icon will display a random color and their acronicized name
			<br/> * Hopefully fixed all the scrolling-loading issues for real this time...
		</p>`, time: '2024-01-15T01:00' }, { content: `<p>
			New changes:
			<br/> * Adapt newly-added icons for dark mode
			<br/> * Improved visualization of info column for small screens
			<br/> * Improved video anti-hotlinking bypass, added fullscreen button for browsers which wouldn't otherwise show the native one
			<br/> * Allow opening the stream at the point in time of a specific post ID for a website
		</p>`, time: '2024-01-16T00:00' }, { content: `<p>
			I was thinking this tool would now just start to die,
			since I should try to get some time to develop my actual well-made and non-kanged frontend,
			but I will need a few libraries and things first, that I can actually already start developing and introduce here.
			<br/>
			So, here are some new changes:
			<br/> * Fixed video embed fullscreen, and added a reload button in case load fails
			<br/> * Initial support for handling data via Trasformapi lib
			<br/> * Initial, experimental support for RSS feeds specifically, via Trasformapi (very broken)
		</p>`, time: '2024-01-23T01:00' }, { content: `<p>
			New changes:
			<br/> * Updated Trasformapi.js with misc fixes, query constants, and streamlined/powerful data querying
				(XPath support for both XML sources, and JSON sources via defiant.js)
			<br/> * Only slightly better RSS support
			<br/> * Initial, experimental support for Mastodon profiles (broken)
			<br/> * Hotfixed a defiant parsing bug on Firefox
		</p>`, time: '2024-01-24T01:00' }, { content: `<p>
			New changes:
			<br/> * Read Telegram's JSON chat exports (experimental, very slow and resource-heavy)
			<br/>
			Regarding Trasformapi, I transformed some of my development tears into words, read here if you're curious:
			<a href="https://octospacc.altervista.org/2024/01/25/mbviewer-per-distrarci/">https://octospacc.altervista.org/2024/01/25/mbviewer-per-distrarci/</a>.
		</p>`, time: '2024-01-25T01:00' }, { content: `<p>
			Some small things:
			<br/> * Fixed RSS feeds parsing on Firefox (mentioned in the post linked above), by fixing a bug in Trasformapi
			<br/> * HTML is now sanitized for removal of dangerous tags and attributes before displaying
			<br/> * Support including user-defined CSS rules from URL (<code>data:</code> supported) via the <code>includeStyle</code> argument
		</p>`, time: '2024-01-27T20:00' }, { content: `<p>
			New changes:
			<br/> * Support including user-defined JS scripts from URL (<code>data:</code> supported) via the <code>includeScript</code> argument. A script must expose a <code>MbViewerFunction(data)</code> function to be invoked by the main application to do useful operations, and then return data by calling the <code>MbViewerReturn(data)</code> API function.
			<br/>
			...I will probably need to write actual documentation about this, but for sure I will post about this on <a href="https://octospacc.altervista.org/?p=1416">https://octospacc.altervista.org/?p=1416</a>.
		</p>`, time: '2024-02-01T00:00' }, { content: `<p>
			Updates:
			<br/> * Include special CSS for optimized PDF/paper printing
		</p>`, time: '2024-02-05T11:00' }, { content: `<p>
			Copyright notice: MBViewer uses code borrowed from <a href="https://t.me">t.me</a>,
			specially modified to handle customized data visualizations in an MB-style.
			<br/>
			This webapp is not affiliated with Telegram (Telegram FZ LLC, Telegram Messenger Inc.), and 
			all rights upon the original materials (which are: everything not strictly related to the "MBViewer" mod) belong to the original owners.
		</p>` }]);
	}
	document.title = `${MbState.siteData.name} — 👁️‍🗨️️ MBViewer`;
	$('.tgme_page_photo_image').attr('data-content', MbState.siteData.acroName);
	$('.tgme_header_title, .tgme_channel_info_header_title').html(MbState.siteData.name);
	$('.tgme_channel_info_description').html(MbState.siteData.description);
	if (MbState.siteData.iconUrl) {
		$('.tgme_page_photo_image').html(`<img src="${MbState.siteData.iconUrl}"/>`);
	} else {
		$('.tgme_page_photo_image').addClass(`bgcolor${MbState.siteData.bgColor}`);
	}
}

function RefreshIncludeStyle () {
	document.querySelector('link[href][rel="stylesheet"]#MbViewerIncludeStyle')?.remove();
	if (MbState.args.includestyle) {
		const linkElem = document.createElement('link');
		linkElem.id = 'MbViewerIncludeStyle';
		linkElem.rel = 'stylesheet';
		linkElem.href = MbState.args.includestyle;
		document.body.appendChild(linkElem);
	}
}

function RefreshIncludeScript () {
	document.querySelector('iframe#MbViewerIncludeScript')?.remove();
	if (MbState.args.includescript) {
		const frameElement = document.createElement('iframe');
		frameElement.id = 'MbViewerIncludeScript';
		frameElement.sandbox = 'allow-scripts';
		frameElement.src = `data:text/html;utf8,
			<script>
				function MbViewerReturn (data) {
					/* data.type = 'IncludeScriptResult'; */
					window.top.postMessage({ MbViewer: data }, '*');
				}
			</script>
			<script src="${MbState.args.includescript}"></script>
			<script>
				window.addEventListener('message', function(event){
					MbViewerFunction(event.data.MbViewer);
				});
			</script>
		`;
		frameElement.hidden = true;
		document.body.appendChild(frameElement);
	}
}

function MakeMoreWrapperHtml (wrapType) {
	let offset, order, relativeOpts;
	switch (wrapType) {
		case 'after':
			offset = MbState.lastPostOffsetAfter;
			MbState.lastPostOffsetAfter--;
			order = 'asc';
		break;
		case 'before':
			offset = MbState.lastPostOffsetBefore;
			MbState.lastPostOffsetBefore++;
			order = 'desc';
		break;
	}
	if (MbState.startingPost) {
		relativeOpts = { order: order, exclude: (MbState.startingPost.id || MbState.startingPost.ID) };
		relativeOpts[wrapType] = MbState.startingPost.date;
	}
	return `<div class="tgme_widget_message_centered js-messages_more_wrap">
		<a href="${MbState.siteUrl && !["atom", "rss"].includes(MbState.platform) && MakeSiteRestUrl(MakeApiEndpoint('posts', { count: 1, offset: offset, orderBy: "date", ...(MbState.startingPost && relativeOpts) }))}" data-${wrapType}="" class="tme_messages_more js-messages_more"></a>
	</div>`;
}

async function MakeMbHtml (postData, makeMoreWrap) {
	postData = (typeof(postData) === 'string' ? JSON.parse(postData) : postData);
	if (["atom", "rss"].includes(MbState.platform)) {
		postData = Array.from(postData.querySelectorAll(':scope > channel > item'));
	}
	if (["atom", "rss", "mastodon"].includes(MbState.platform)) {
		postData.reverse();
	}
	let html = '';
	const siteLink = (MbState.siteData.url || MbState.siteData.URL || MbState.siteLink);
	const siteHref = (siteLink ? `href="${siteLink}"` : '');
	for (postData of (postData.posts ? postData.posts : SureArray(postData))) {
		if (MbState.platform && MbState.platform !== 'telegram.export') {
			postData = MbApiTransformer('message', MbState.platform, postData);
		}
		const authorId = (postData.author?.id || postData._links?.author[0]?.href?.split('/')?.slice(-1)[0]);
		if (authorId && !MbState.authors[authorId]) {
			MbState.authors[authorId] = (typeof(postData.author) === 'object' && Object.keys(postData.author).join(' ') !== 'id'
				? postData.author
				: await (await fetch(MakeSiteRestUrl(MakeApiEndpoint('users', { id: authorId })))).json());
		}
		const authorData = (MbState.authors[authorId] || postData.author || (postData.quoting?.author && !postData.quoting?.content));
		const authorLink = (authorData?.link || (siteLink && `${siteLink}/author/${authorData?.name}`));
		const authorHref = (authorLink ? `href="${authorLink}"` : '');
		const iconUrl = (Object.values(authorData?.avatar_urls || {}).slice(-1)[0] || authorData?.icon?.url || MbState.siteData.iconUrl);
		let attachmentsHtml = '';
		for (const attachment of (postData.attachments || postData.quoting?.attachments || [])) {
			if (attachment) {
				const mediaKind = attachment.type?.split('/')[0];
				const elemTag = (mediaKind === 'image' ? 'img' : mediaKind);
				const elemClosing = (mediaKind === 'image' ? '/>' : `></${elemTag}>`);
				attachmentsHtml += `<${elemTag} controls="true" src="${attachment.url}" alt="${attachment.description?.replaceAll('&', '&amp;')?.replaceAll('"', '&quot;') || ''}"/>`;
			}
		}
		const postInternalId = MbState.internalIdCount++;
		const postInnerHtml = `
			${attachmentsHtml}
			${ReformatPostHtml(postData.content)}
			${postData.quoting?.content ? `[♻️ Reblog]: ${ReformatPostHtml(postData.quoting.content)}` : ''}
		`;
		html += `
			<div class="tgme_widget_message_wrap js-widget_message_wrap date_visible">
				<div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="${postData.id || postData.ID}">
					<div class="tgme_widget_message_user">
						<a ${authorHref || siteHref}>
							<i class="tgme_widget_message_user_photo ${iconUrl ? '' : `bgcolor${MbState.siteData.bgColor}`}" style="background-color: unset;" data-content="${MbState.siteData.acroName}">
								${iconUrl ? `<img src="${iconUrl}"/>` : ''}
							</i>
						</a>
					</div>
					<div class="tgme_widget_message_bubble">
						<i class="tgme_widget_message_bubble_tail">
							<svg class="bubble_icon" width="9px" height="20px" viewBox="0 0 9 20">
								<g fill="none">
									<path class="background" fill="#ffffff" d="M8,1 L9,1 L9,20 L8,20 L8,18 C7.807,15.161 7.124,12.233 5.950,9.218 C5.046,6.893 3.504,4.733 1.325,2.738 L1.325,2.738 C0.917,2.365 0.89,1.732 1.263,1.325 C1.452,1.118 1.72,1 2,1 L8,1 Z"></path>
									<path class="border_1x" fill="#d7e3ec" d="M9,1 L2,1 C1.72,1 1.452,1.118 1.263,1.325 C0.89,1.732 0.917,2.365 1.325,2.738 C3.504,4.733 5.046,6.893 5.95,9.218 C7.124,12.233 7.807,15.161 8,18 L8,20 L9,20 L9,1 Z M2,0 L9,0 L9,20 L7,20 L7,20 L7.002,18.068 C6.816,15.333 6.156,12.504 5.018,9.58 C4.172,7.406 2.72,5.371 0.649,3.475 C-0.165,2.729 -0.221,1.464 0.525,0.649 C0.904,0.236 1.439,0 2,0 Z"></path>
									<path class="border_2x" d="M9,1 L2,1 C1.72,1 1.452,1.118 1.263,1.325 C0.89,1.732 0.917,2.365 1.325,2.738 C3.504,4.733 5.046,6.893 5.95,9.218 C7.124,12.233 7.807,15.161 8,18 L8,20 L9,20 L9,1 Z M2,0.5 L9,0.5 L9,20 L7.5,20 L7.5,20 L7.501,18.034 C7.312,15.247 6.64,12.369 5.484,9.399 C4.609,7.15 3.112,5.052 0.987,3.106 C0.376,2.547 0.334,1.598 0.894,0.987 C1.178,0.677 1.579,0.5 2,0.5 Z"></path>
									<path class="border_3x" d="M9,1 L2,1 C1.72,1 1.452,1.118 1.263,1.325 C0.89,1.732 0.917,2.365 1.325,2.738 C3.504,4.733 5.046,6.893 5.95,9.218 C7.124,12.233 7.807,15.161 8,18 L8,20 L9,20 L9,1 Z M2,0.667 L9,0.667 L9,20 L7.667,20 L7.667,20 L7.668,18.023 C7.477,15.218 6.802,12.324 5.64,9.338 C4.755,7.064 3.243,4.946 1.1,2.983 C0.557,2.486 0.52,1.643 1.017,1.1 C1.269,0.824 1.626,0.667 2,0.667 Z"></path>
								</g>
							</svg>
						</i>
						<div class="tgme_widget_message_author accent_color">
							<a class="tgme_widget_message_owner_name" ${authorHref || siteHref}>
								<span dir="auto">
									${authorData?.name
										? `${authorData.name} [${MbState.siteData.name}]`
										: MbState.siteData.name
									}
								</span>
							</a>
						</div>
						<div class="tgme_widget_message_text js-message_text before_footer" dir="auto">
							<div class="MbPost" data-internal-id="${postInternalId}">
								${postInnerHtml}
							</div>
						</div>
						<div class="tgme_widget_message_footer compact js-message_footer">
							<div class="tgme_widget_message_info short js-message_info">
								<span class="tgme_widget_message_meta">
									<a class="tgme_widget_message_date" ${postData.url ? `href="${postData.url}"` : ''}>
										<time datetime="${postData.time}" class="time"></time>
										<!-- TODO: show edited status -->
									</a>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
		if (document.querySelector('iframe#MbViewerIncludeScript')) {
			function pollPostElement () {
				const postElement = document.querySelector(`div.tgme_widget_message_text > div.MbPost[data-internal-id="${postInternalId}"]`);
				if (postElement) {
					document.querySelector('iframe#MbViewerIncludeScript').contentWindow.postMessage({ MbViewer: { id: postInternalId, html: postInnerHtml } }, '*');
				} else {
					setTimeout(pollPostElement, 75);
				}
			}
			pollPostElement();
		}
	}
	if (!html) {
		// no more messages?
		return;
	}
	if (makeMoreWrap && MbState.siteUrl) {
		const wrapHtml = MakeMoreWrapperHtml(makeMoreWrap);
		switch (makeMoreWrap) {
			case 'after': html = `${html}${wrapHtml}`; break;
			case 'before': html = `${wrapHtml}${html}`; break;
		}
	}
	MbState.lastMoreWrap = makeMoreWrap;
	return html;
}

function ReformatPostHtml (html) {
	const content = $(`<div>${cleanHTML(html, false)}</div>`);
	// bypass Altervista's anti-hotlinking protection by hiding our HTTP Referer header
	// TODO: only do this for altervista sites maybe
	if (MbState.platform === 'wordpress.org') {
		for (const videoElem of content.find('video').toArray()) {
			videoElem.preload = 'none';
			const frameElem = document.createElement('iframe');
			frameElem.style = 'border: none; width: 100%;';
			frameElem.allowFullscreen = true;
			frameElem.src = `data:text/html;utf8,<!DOCTYPE html><body>
				<style>
					html, body { margin: 0; overflow: hidden; }
					video { max-width: 100%; }
				</style>
				${encodeURIComponent(videoElem.outerHTML)}
				<button style="position: absolute; top: 0; right: 0; z-index: 1;">
					Reload Media
				</button>
				<script>
					var videoElem = document.querySelector('video');
					var buttonElem = document.querySelector('button');
					buttonElem.onclick = function(){
						videoElem.load();
					};
					videoElem.onloadedmetadata = function(){
						window.top.postMessage((videoElem.src + ' ' + getComputedStyle(videoElem).height), '*');
					};
					videoElem.load();
				</script>
			</body>`;
			videoElem.replaceWith(frameElem);
		}
	}
	return content.html();
}

function HideMobileRightColumn () {
	$('body')[0].style.overflow = '';
	$('main.tgme_main')[0].style.visibility = '';
	$('.tgme_header_search')[0].style.display = '';
	$('.tgme_header_right_column')[0].style.display = '';
	$('.tgme_header_right_column')[0].style.width = '';
	$('.tgme_header_right_column .tgme_channel_info')[0].style.height = '';
	$('.tgme_header_right_column a[name="closeColumn"]')[0].hidden = true;
}

function ResizeLayouts () {
	if (window.innerWidth <= 720 ) { // .tgme_header_right_column @media max-width
		$('a.tgme_header_link')[0].href = 'javascript:;';
	} else {
		HideMobileRightColumn();
		$('a.tgme_header_link')[0].removeAttribute('href');
	}
}

$('a[name="goBack"]')[0].onclick = function(){
	ArgsRewrite({ dataurl: null, siteurl: null, postid: null, platform: null, includestyle: null, includescript: null /*postslug: null*/ });
};

// TODO: we should check origin
window.addEventListener('message', function(event){
	// TODO edit the video embed function to send objects for consistency
	if (typeof(event.data) === 'string') {
		const tokens = event.data.split(' ');
		$(`iframe[src*="${encodeURIComponent(tokens[0])}"]`).height(tokens[1]);
	}
	else if (event.data.MbViewer) {
		const data = event.data.MbViewer;
		//switch (data.type) {
		//	case 'IncludeScriptResult':
		document.querySelector(`div.tgme_widget_message_text > div.MbPost[data-internal-id="${parseInt(data.id)}"]`).innerHTML = cleanHTML(data.html);
		//	break;
		//}
	}
});

window.addEventListener('resize', ResizeLayouts);
window.addEventListener('hashchange', MbViewerInit);
