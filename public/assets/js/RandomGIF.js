function RandomGIF() {
	gifid = Math.floor((Math.random() * 11)/2);
	gifurl = top.glob + gifid + ".gif";
	gifcss = "url(" + gifurl + ")";
	document.body.style.backgroundImage = gifcss;
}

window.onload = RandomGIF;