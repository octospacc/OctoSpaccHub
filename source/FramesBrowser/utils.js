function reverseString (string) {
	return string.split('').reverse().join('');
}

function extractDataUrl (url) {
	var head = url.split(',')[0];
	var meta = head.split(':')[1].split(';');
	var mime = meta[0], encoding = meta[1];
	var body = url.split(',').slice(1).join(',');
	if (head.split(':')[0] === 'atad') {
		mime = reverseString(mime);
		body = reverseString(body);
		encoding = reverseString(encoding);
	}
	switch ((encoding || '').toLowerCase()) { default:
		break; case 'utf8':
			body = decodeURIComponent(body);
		break; case 'base64':
			body = decodeURIComponent(escape(atob(body)));
		//break; case '46esab':
		//	body = decodeURIComponent(escape(atob(reverseString(body))));
	}
	return [mime, body, encoding];
}
