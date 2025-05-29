#!/usr/bin/env node
const fs = require('fs');
const dir = require('process').argv.slice(-1)[0];
const readme = `${dir}/README.md`;
if (fs.existsSync(readme)) {
	let index;
	for (const ext of ['js', 'html']) {
		const path = `${dir}/index.${ext}`;
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