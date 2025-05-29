#!/usr/bin/env node
const fs = require('fs');
const app = require('process').argv.slice(-1)[0];
const readme = `../source/${app}/README.md`;
if (fs.existsSync(readme)) {
	let index;
	for (const ext of ['js', 'html']) {
		const path = `./${app}/index.${ext}`;
		if (fs.existsSync(path)) {
			index = path;
			break;
		}
	}
	if (index) {
		fs.writeFileSync(
			index,
			fs.readFileSync(index, 'utf8').replaceAll(
				'<!-- <README /> -->',
				fs.readFileSync(readme, 'utf8').split('---').slice(1).join('---').trim()));	
	}
}