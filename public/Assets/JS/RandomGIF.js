function RandomGIF() {
	GifID = Math.floor((Math.random() * 25)/2);
	GifURL = "https://octospacc.gitlab.io/Web-ThirdParty-Unknown/Assets/Media/Backgrounds/" + GifID + ".gif";
	document.body.style.backgroundImage = "url(" + GifURL + ")";
}

window.onload = RandomGIF;
