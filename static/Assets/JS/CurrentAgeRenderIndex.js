var CurrentAgeElem = document.getElementById('OcttCurrentAge');
var RefreshTime = 50;

var ConfettiSleep = 600;
var ConfettiIter = 32;

var ConfettiCalled = false;

var SoundObject = new Audio( // Borrowed music: https://0101.bandcamp.com/track/fireworks
	"https://matrix-client.matrix.org/_matrix/media/r0/download/matrix.org/bPhubIokhLQpTfMZhNsVucVO");
SoundObject.muted = true;

function Sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function Confetti() {
	for (var i = 0; i < ConfettiIter; i++) {
		var ConfettiCanvas = document.getElementById('ConfettiCanvas');
		var JsConfetti = new JSConfetti({ConfettiCanvas});
		JsConfetti.addConfetti({
			emojis: [
				'🌈', '⚡️', '💥', '✨',
				'💫', '🌸', '🏳️‍⚧️️', '🎉️',
				'🎊️', '🏳️‍🌈️', '🎈️', '🎆️',
				'💘️', '💝️', '💖️', '💗️',
				'💞️', '❤️', '💛️', '💚️',
				'💜️', '🤎️', '🖤️', '🤍️',
				'💯', '❣️', '👾', '🎁',
			]
		});
		JsConfetti.addConfetti();
		await Sleep(ConfettiSleep);
	}
}


function UpdateAge() {
	var Years = OcttTime.YearsAgeNow();
	CurrentAgeElem.innerHTML = "Currently " + Years + " years old..";
	if ((Years % 1 < OcttTime.Duration) && (!ConfettiCalled)) {
		Confetti();
		ConfettiCalled = true;
	}
	// music playing code
}

setInterval(UpdateAge, RefreshTime);

function ClickBody() {
	SoundObject.muted = false;
}
document.body.addEventListener("click", ClickBody);

