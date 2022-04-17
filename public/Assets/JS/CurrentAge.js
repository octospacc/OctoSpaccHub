// All Unix time values are in milliseconds (ms)
const UnixDay = 86400000;
const UnixYear = 31536000000;
const BirthTime = 1082713500000;

function UnixTime() {
	let DateNow = Date.now();
	let TimeSinceBirth = DateNow - BirthTime;
	let YearsSinceBirth = TimeSinceBirth / UnixYear;
	let LeapYears = ~~(YearsSinceBirth / 4);
	return DateNow - UnixDay*LeapYears;
}

function UnixAgeNow() {
	return UnixTime() - BirthTime;
}

function UnixToYears() {
	return UnixAgeNow() / UnixYear;
}