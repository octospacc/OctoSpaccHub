function RandomGIF() {
	GifID = Math.floor((Math.random() * 25)/2);
	GifURL = top.glob + GifID + ".gif";
	document.body.style.backgroundImage = "url(" + GifURL + ")";
}

window.onload = RandomGIF;
