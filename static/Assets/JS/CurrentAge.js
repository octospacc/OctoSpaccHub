var OcttTime = {};

// All Unix time values are in milliseconds (ms)
OcttTime.UnixDay = 86400000;
OcttTime.UnixYear = 31536000000;
OcttTime.BirthTime = 1082713500000;
OcttTime.Duration = 0.00275; // ~1 day

OcttTime.UnixTime = function UnixTime() {
	var DateNow = Date.now();
	var TimeSinceBirth = DateNow - OcttTime.BirthTime;
	var YearsSinceBirth = TimeSinceBirth / OcttTime.UnixYear;
	var LeapYears = ~~(YearsSinceBirth / 4);
	return DateNow - (OcttTime.UnixDay * LeapYears);
}

OcttTime.UnixAgeNow = function UnixAgeNow() {
	return OcttTime.UnixTime() - OcttTime.BirthTime;
}

OcttTime.YearsAgeNow = function YearsAgeNow() {
	return OcttTime.UnixAgeNow() / OcttTime.UnixYear;
}
