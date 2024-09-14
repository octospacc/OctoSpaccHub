window.addEventListener('load', (function(){

if (['', 'hub.octt.eu.org'].includes(location.host)) {
	if (('serviceWorker' in navigator) && (location.protocol.slice(0, 4) === 'http')) {
		navigator.serviceWorker.register('/ServiceWorker.js');
	}
} else {
	var noticeElem = document.createElement('p');
	noticeElem.style = `
		position: fixed;
		z-index: 1000;
		top: 0;
		left: 0;
		margin: 0;
		width: 100%;
		color: black;
		background-color: thistle;
		font-size: initial;
		font-size: smaller;
		text-align: center;
	`;
	noticeElem.innerHTML = `You are viewing this page on a secondary/backup domain. <a style="color: darkblue;" href="https://hub.octt.eu.org${location.pathname}">Open it on hub.octt.eu.org</a>.
	<button style="
		float: right;
		height: 1.25em;
		margin: 0;
		padding-top: 0;
		padding-bottom: 0;
	" onclick="this.parentElement.remove()">X</button>`;
	document.body.appendChild(noticeElem);
}

if (["www.octt.eu.org", "hub.octt.eu.org"].includes(location.hostname)) {
	fetch('https://private-analytics-not-for-public-use.octt.eu.org/octospacchub/count?p=' + location.href /* + '&rnd=' + Date.now() */)
		.catch(function(err){
			console.error(err);
			fetch('https://octospacchub.goatcounter.com/count?p=' + location.href);
		});
}

}));
