// TODO:
// * handle opening the feed at a specific post id in time
// * custom colors
// * author profiles, bios, and showing only their messages instead of the full site
// * show site/profile info on click of navbar for mobile
// * in-app search of site content
// * homepage with history and sponsored sources
// * don't show redundant day markers
// * navigate markdown Wordpress export pages from Git
// * app info in page without JS

let MbState = {};

const SureArray = (obj) => (Array.isArray(obj) ? obj : [obj]);

// <https://stackoverflow.com/questions/29956338/how-to-accurately-determine-if-an-element-is-scrollable/71170105#71170105>
function CanScrollEl(el, scrollAxis) {
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
function IsScrollableY(el) {
	return (el.scrollHeight > el.clientHeight) && CanScrollEl(el, 'scrollTop') && ('hidden' !== getComputedStyle(el).overflowY);
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

function MakeApiEndpoint (platform, options) {
	// ...
}

async function MbViewerInit () {
	if (!location.hash) {
		location.hash = '/';
	}
	MbState = {
		siteData: {
			name: "MBViewer",
			description: `
				The messages of this channel are baked inside the app,
				and serve as the centralized place for all kinds of information about it,
				while at the same time acting as a demo.
				Please enjoy your time here, or use the search bar to input a supported URL.
			`,
		},
		platform: "wordpress.org",
	};
	$('form.tgme_header_search_form')[0].action = '';
	$('form.tgme_header_search_form')[0].onsubmit = function(event){
		location.hash = `/siteUrl=${event.target.querySelector('input').value}`;
		event.preventDefault();
	};
	$('a.tgme_header_link')[0].href = '';
	$('.tgme_channel_info_header_username').html('');
	$('.tgme_page_photo_image').html('');
	$('.tgme_page_photo_image').removeClass('bgcolor0');
	$('.tgme_page_photo_image').attr('data-content', '');
	$('section.tgme_channel_history.js-message_history').html('');
	for (const arg of location.hash.split('/').slice(1).join('/').split('|')) {
		const argTokens = arg.split('=');
		MbState[argTokens[0]] = argTokens.slice(1).join('=');
	}
	if (MbState.siteUrl) {
		if (GetDomainFromUrl(MbState.siteUrl).toLowerCase().endsWith('wordpress.com')) {
			MbState.platform = 'wordpress.com';
		}
		const siteRequest = await fetch(MakeSiteRestUrl());
		MbState.siteData = await siteRequest.json();
		$('form.tgme_header_search_form')[0].action = `${MbState.siteUrl}/?s`;
		$('form.tgme_header_search_form')[0].onsubmit = null;
		$('a.tgme_header_link')[0].href = MbState.siteUrl;
		$('.tgme_channel_info_header_username').html(`<a href="${MbState.siteUrl}">${GetDomainFromUrl(MbState.siteUrl).toLowerCase()}</a>`);
		$('.tgme_page_photo_image').html(`<img src="${MbState.siteUrl}${MbState.siteData.site_icon_url}"/>`);
		$('a[name="goBack"]')[0].hidden = false;
		$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml(0, 'before'));
		MbState.lastMustScroll = 3; // Firefox fix
		TWeb.loadMore($('.js-messages_more_wrap > a'), true);
	} else {
		$('a[name="goBack"]')[0].hidden = true;
		$('.tgme_page_photo_image').addClass('bgcolor0');
		$('.tgme_page_photo_image').attr('data-content', 'MBV');
		$('section.tgme_channel_history.js-message_history').html(MakeMoreWrapperHtml());
		TWeb.loadMore($('.js-messages_more_wrap > a'), true, [{ content: `<p>
			Here I am doing, another strange thing of mine.
			This is my personal experiment to make an MB-style frontend for sources that are by default not really friendly to that concept.
			Since this first day, we will start with just WordPress, and we'll see what comes from that.
			See <a href="https://octospacc.altervista.org/2024/01/13/wordpress-che-non-e/">https://octospacc.altervista.org/2024/01/13/wordpress-che-non-e/</a>.
		</p>`, date: '2024-01-13' }, { content: `<p>
			After fixing a few post-release issues driving me insane (scrolling cough cough), here are some new improvements:
			<br/> * Handling of posts without date is just a bit nicer.
			<br/> * Added a back button to return to this page here from a real site stream.
			<br/> * Added CORS proxies to handle sites normally inaccessible.
			<br/> * Hey there, this text and everything is new...
			<br/>
			I also just now realized that wordpress.com uses a different REST API with different endpoints and parameters,
			so I will need to handle that...
		</p>`, date: '2024-01-14T02:00' }, { content: `<p>
			Copyright notice: MBViewer uses code borrowed from <a href="https://t.me">t.me</a>,
			specially modified to handle customized data visualizations in an MB-style.
			<br/>
			This webapp is not affiliated with Telegram (Telegram FZ LLC, Telegram Messenger Inc.), and 
			all rights upon the original materials (which are: everything not strictly related to the "MBViewer" mod) belong to the original owners.
		</p>` }]);
	}

	$('.tgme_header_title, .tgme_channel_info_header_title').html(MbState.siteData.name);
	$('.tgme_channel_info_description').html(MbState.siteData.description);
}

function MakeMoreWrapperHtml (postOffset, wrapType) {
	if (postOffset >= 0) {
		MbState.lastPostOffset = (postOffset + 1);
	}
	return `<div class="tgme_widget_message_centered js-messages_more_wrap">
		<a href="${MbState.siteUrl && MakeSiteRestUrl(`wp/v2/posts/?offset=${postOffset}&per_page=1`)}" data-${wrapType}="" class="tme_messages_more js-messages_more"></a>
	</div>`;
}

function MakeMbHtml (postData) {
	postData = (typeof(postData) === 'string' ? JSON.parse(postData) : postData);
	let html = '';
	const siteHref = (MbState.siteUrl ? `href="${MbState.siteUrl}"` : '');
	for (postData of SureArray(postData)) {
		html += `
			${MbState.siteUrl ? MakeMoreWrapperHtml(MbState.lastPostOffset, 'before') : ''}
			<div class="tgme_widget_message_wrap js-widget_message_wrap date_visible">
				<div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="">
					<div class="tgme_widget_message_user">
						<a ${siteHref}>
							<i class="tgme_widget_message_user_photo ${MbState.siteUrl ? '' : 'bgcolor0'}" style="background-color: unset;" data-content="${MbState.siteUrl ? '' : 'MBV'}">
								${MbState.siteUrl ? `<img src="${MbState.siteUrl}${MbState.siteData.site_icon_url}"/>` : ''}
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
							<a class="tgme_widget_message_owner_name" ${siteHref}>
								<span dir="auto">
									${MbState.siteData.name}
								</span>
							</a>
						</div>
						<div class="tgme_widget_message_text js-message_text before_footer" dir="auto">
							<div class="MBPost">
								${postData.content?.rendered || postData.content}
							</div>
						</div>
						<div class="tgme_widget_message_footer compact js-message_footer">
							<div class="tgme_widget_message_info short js-message_info">
								<span class="tgme_widget_message_meta">
									<a class="tgme_widget_message_date" ${postData.link ? `href="${postData.link}"` : ''}>
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

$('a[name="goBack"]')[0].onclick = function(){
	location.hash = '/';
};

window.addEventListener('hashchange', MbViewerInit);
