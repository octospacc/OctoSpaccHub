const CurrentAgeElem = document.getElementById("CurrentAge");
const RefreshTime = 50;

function UpdateHTML() {
	CurrentAgeElem.innerHTML =
		"Currently " + UnixToYears() + " years old..";
}

setInterval(UpdateHTML, RefreshTime);
