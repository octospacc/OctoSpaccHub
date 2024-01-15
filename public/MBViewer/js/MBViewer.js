// TODO:
// * handle opening the feed at a specific post id in time
// ** support opening from not only id but also permalink
// * custom colors
// * reduce lag on mobile somehow
// * open author profiles/bios as a channel and show only their messages instead of the full site
// * show site/profile info on click of navbar for mobile
// * in-app search of site content
// * homepage with history and sponsored sources
// * don't show redundant day markers
// * other supported sources
// ** Markdown WordPress export pages from Git?
// ** Atom/RSS feeds
// * app info in page without JS?
// * fix some messages being skipped when connection errors happen
// * optionally show post titles?
// * fix unfinished tasks still executing when clicking back
// * fix imported SVG buttons not fitting with dark theme
// * I think we might need to handle acronicized names for users when needed?

let MbState = {};

function ArgsRewrite (props={}) {
	for (const key in props) {
		const value = props[key];
		value ? (MbState.args[key] = value) : (delete MbState.args[key]);
	}
	let hash = '/';
	for (const arg in MbState.args) {
		hash += `${arg}=${MbState.args[arg]}|`;
	}
	location.hash = hash;
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
		if (MbState.platform === 'wordpress.org') {
			const proxies = ["corsproxy.io", "corsproxy.org"];
			return `https://${proxies[~~(Math.random() * proxies.length)]}/?${siteUrl}/wp-json/${path}`;
		} else if (MbState.platform === 'wordpress.com') {
			return `https://public-api.wordpress.com/rest/v1.1/sites/${GetDomainFromUrl(siteUrl)}/${path}`;
		}
	}
}

function MakeApiEndpoint (type, options={}) {
	const translations = {
		"wordpress.org": {
			count: "per_page",
		},
		"wordpress.com": {
			count: "number",
		}
	}
	let query = '';
	for (const option in options) {
		if (option !== 'id') {
			query += `&${translations[MbState.platform][option] || option}=${options[option]}`;
		}
	}
	query = `${options.id || ''}?${query.slice(1)}`;
	switch (MbState.platform) {
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
				$('main.tgme_main')[0].style.visibility = 'hidden';
				$('.tgme_header_right_column')[0].style.display = 'revert';
				$('.tgme_header_right_column')[0].style.width = 'revert';
				$('.tgme_header_right_column .tgme_channel_info')[0].style.height = 'calc(100% - 32px)';
				$('.tgme_header_right_column a[name="closeColumn"]')[0].hidden = false;
			} else {
				HideMobileRightColumn();
			}
		}
	};
	$('.tgme_header_right_column a[name="closeColumn"]')[0].onclick = HideMobileRightColumn;
	//$('a.tgme_header_link')[0].removeAttribute('href');
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
	if (MbState.siteUrl) {
		if (!MbState.platform) {
			if (GetDomainFromUrl(MbState.siteUrl).toLowerCase().endsWith('wordpress.com')) {
				MbState.platform = 'wordpress.com';
			} else {
				MbState.platform = 'wordpress.org';
			}
		}
		try {
			const siteRequest = await fetch(MakeSiteRestUrl());
			MbState.siteData = await siteRequest.json();
		} catch(err) {
			setTimeout(MbViewerInit, 1000);
		}
		const siteLink = (MbState.siteData.url || MbState.siteData.URL || MbState.siteUrl);
		$('form.tgme_header_search_form')[0].action = `${siteLink}/?s`;
		$('form.tgme_header_search_form')[0].onsubmit = null;
		//$('a.tgme_header_link')[0].href = siteLink;
		$('.tgme_channel_info_header_username').html(`<a href="${siteLink}">${GetDomainFromUrl(siteLink).toLowerCase()}</a>`);
		$('a[name="goBack"]')[0].hidden = false;
		$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml(0, 'before'));
		MbState.lastMustScroll = true;
		TWeb.loadMore($('.js-messages_more_wrap > a'));
	}
	MbState.siteData.iconUrl = (MbState.siteData.site_icon_url || MbState.siteData.icon?.img || MbState.siteData.icon?.ico);
	MbState.siteData.acroName ||= (!MbState.siteData.iconUrl ? MakeAcroName(MbState.siteData.name) : '');
	MbState.siteData.bgColor = ~~(Math.random() * 7);
	if (MbState.siteData.iconUrl && !["http", "https"].includes(MbState.siteData.iconUrl.split('://')[0])) {
		MbState.siteData.iconUrl = `${MbState.siteUrl}${MbState.siteData.iconUrl}`;
	}
	if (!MbState.siteUrl) {
		$('a[name="goBack"]')[0].hidden = true;
		$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml());
		TWeb.loadMore($('.js-messages_more_wrap > a'), [{ content: `<p>
			Here I am, doing another strange thing of mine.
			This is my personal experiment to make an MB-style frontend for sources that are by default not really friendly to that concept.
			Since this first day, we will start with just WordPress, and we'll see what comes from that.
			See <a href="https://octospacc.altervista.org/2024/01/13/wordpress-che-non-e/">https://octospacc.altervista.org/2024/01/13/wordpress-che-non-e/</a>.
		</p>`, date: '2024-01-13T21:00' }, { content: `<p>
			After fixing a few post-release issues driving me insane (scrolling cough cough), here are some new improvements:
			<br/> * Handling of posts without date is just a bit nicer.
			<br/> * Added a back button to return to this page here from a real site stream.
			<br/> * Added CORS proxies to handle sites normally inaccessible.
			<br/> * Hey there, this text and everything is new...
			<br/>
			I also just now realized that wordpress.com uses a different REST API with different endpoints and parameters,
			so I will need to handle that...
		</p>`, date: '2024-01-14T02:00' }, { content: `<p>
			New changes:
			<br/> * Correctly handle wordpress.com blogs
			<br/> * Show specific users as post authors whenever possible
			<br/> * Made the navigation bar smarter: now handles URLs without schema, and t.me links (redirects to official site)
			<br/> * Made the info box (right column on desktop) visible on small screens (by clicking the screen header)
			<br/> * Added an Altervista workaround for videos not loading (bypass anti-hotlinking)
			<br/> * Made URL hash parameter names case-insensitive
			<br/> * Now sites without an icon will display a random color and their acronicized name
			<br/> * Hopefully fixed all the scrolling-loading issues for real this time...
		</p>`, date: '2024-01-15T01:00' }, { content: `<p>
			Copyright notice: MBViewer uses code borrowed from <a href="https://t.me">t.me</a>,
			specially modified to handle customized data visualizations in an MB-style.
			<br/>
			This webapp is not affiliated with Telegram (Telegram FZ LLC, Telegram Messenger Inc.), and 
			all rights upon the original materials (which are: everything not strictly related to the "MBViewer" mod) belong to the original owners.
		</p>` }]);
	}
	$('.tgme_page_photo_image').attr('data-content', MbState.siteData.acroName);
	$('.tgme_header_title, .tgme_channel_info_header_title').html(MbState.siteData.name);
	$('.tgme_channel_info_description').html(MbState.siteData.description);
	if (MbState.siteData.iconUrl) {
		$('.tgme_page_photo_image').html(`<img src="${MbState.siteData.iconUrl}"/>`);
	} else {
		$('.tgme_page_photo_image').addClass(`bgcolor${MbState.siteData.bgColor}`);
	}
	MbState.lastMustScroll = true;
}

function MakeMoreWrapperHtml (postOffset, wrapType) {
	if (postOffset >= 0) {
		MbState.lastPostOffset = (postOffset + 1);
	}
	return `<div class="tgme_widget_message_centered js-messages_more_wrap">
		<a href="${MbState.siteUrl && MakeSiteRestUrl(MakeApiEndpoint('posts', { offset: postOffset, count: 1 }))}" data-${wrapType}="" class="tme_messages_more js-messages_more"></a>
	</div>`;
}

async function MakeMbHtml (postData) {
	postData = (typeof(postData) === 'string' ? JSON.parse(postData) : postData);
	let html = (MbState.siteUrl ? MakeMoreWrapperHtml(MbState.lastPostOffset, 'before') : '');
	const siteLink = (MbState.siteData.url || MbState.siteData.URL || MbState.siteLink);
	const siteHref = (siteLink ? `href="${siteLink}"` : '');
	for (postData of (postData.posts ? postData.posts : SureArray(postData))) {
		const postLink = (postData.link || postData.URL);
		const authorId = (postData.author?.ID || postData.author || postData._links?.author[0]?.href?.split('/')?.slice(-1)[0]);
		if (authorId && !MbState.authors[authorId]) {
			MbState.authors[authorId] = (typeof(postData.author) === 'object'
				? postData.author
				: await (await fetch(MakeSiteRestUrl(MakeApiEndpoint('users', { id: authorId })))).json());
		}
		const authorData = MbState.authors[authorId];
		const authorLink = (authorData?.link || (siteLink && `${siteLink}/author/${authorData?.name}`));
		const authorHref = (authorLink ? `href="${authorLink}"` : '');
		const iconUrl = (Object.values(authorData?.avatar_urls || {}).slice(-1)[0] || authorData?.avatar_URL || MbState.siteData.iconUrl);
		html += `
			<div class="tgme_widget_message_wrap js-widget_message_wrap date_visible">
				<div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="">
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
									${MbState.authors[authorId]?.name
										? `${MbState.authors[authorId]?.name} [${MbState.siteData.name}]`
										: MbState.siteData.name
									}
								</span>
							</a>
						</div>
						<div class="tgme_widget_message_text js-message_text before_footer" dir="auto">
							<div class="MbPost">
								${ReformatPostHtml(postData.content?.rendered || postData.content)}
							</div>
						</div>
						<div class="tgme_widget_message_footer compact js-message_footer">
							<div class="tgme_widget_message_info short js-message_info">
								<span class="tgme_widget_message_meta">
									<a class="tgme_widget_message_date" ${postLink ? `href="${postLink}"` : ''}>
										<time datetime="${postData.date}" class="time"></time>
										<!-- TODO: show edited status -->
									</a>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
	return html;
}

function ReformatPostHtml (html) {
	const content = $(`<div>${html}</div>`);
	// bypass Altervista's anti-hotlinking protection by hiding our HTTP Referer header
	// TODO: only do this for altervista sites maybe
	for (const videoElem of content.find('video').toArray()) {
		const frameElem = document.createElement('iframe');
		frameElem.style = 'border: none; width: 100%;';
		frameElem.allow = 'fullscreen';
		frameElem.src = `data:text/html;utf8,
			<style>
				html, body { margin: 0; overflow: hidden; }
				video { max-width: 100%; }
			</style>
			${encodeURIComponent(videoElem.outerHTML)}
			<script>
				var videoElem = document.querySelector('video');
				var oldVideoHeight = getComputedStyle(videoElem).height;
				setInterval(function(){
					var newVideoHeight = getComputedStyle(videoElem).height;
					if (newVideoHeight !== oldVideoHeight) {
						top.postMessage((videoElem.src + ' ' + newVideoHeight), '*');
						oldVideoHeight = oldVideoHeight;
					}
				}, 750);
			</script>
		`;
		videoElem.replaceWith(frameElem);
	}
	return content.html();
}

function HideMobileRightColumn () {
	$('main.tgme_main')[0].style.visibility = '';
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
	ArgsRewrite({ siteurl: null, postid: null });
};

window.onmessage = function(event){
	const tokens = event.data.split(' ');
	$(`iframe[src*="${encodeURIComponent(tokens[0])}"]`).height(tokens[1]);
};

window.addEventListener('resize', ResizeLayouts);
window.addEventListener('hashchange', MbViewerInit);
