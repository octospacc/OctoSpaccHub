const CurrentAgeElem = document.getElementById("CurrentAge");
const RefreshTime = 50;

const ConfettiSleep = 600;
const ConfettiIter = 32;

var ConfettiCalled = false;

var SoundObject = new Audio( // Borrowed music: https://0101.bandcamp.com/track/fireworks
	"https://matrix-client.matrix.org/_matrix/media/r0/download/matrix.org/bPhubIokhLQpTfMZhNsVucVO");
SoundObject.muted = true;

function Sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function Confetti() {
	for (let i = 0; i < ConfettiIter; i++) {
		const ConfettiCanvas = document.getElementById('ConfettiCanvas');
		const JsConfetti = new JSConfetti({ConfettiCanvas});
		JsConfetti.addConfetti({
			emojis: [
				'🌈', '⚡️', '💥',
				'✨', '💫', '🌸',
				'🏳️‍⚧️️', '🎉️', '🎊️',
				'🏳️‍🌈️', '🎈️', '🎆️',
				'💘️', '💝️', '💖️',
				'💗️', '💞️', '❤️',
				'💛️', '💚️', '💜️',
				'🤎️', '🖤️', '🤍️',
			]
		});
		JsConfetti.addConfetti();
		await Sleep(ConfettiSleep);
	}
}


function UpdateAge() {
	let Years = UnixToYears();
	CurrentAgeElem.innerHTML = "Currently " + Years + " years old..";
	if ((Years % 1 < 0.0000001) && (!ConfettiCalled)) {
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

