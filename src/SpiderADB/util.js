(function(){

function arrayFrom (items) {
	var itemsArray = [];
	for (var i=0; i<items.length; i++) {
		itemsArray.push(items[i]);
	}
	return itemsArray;
}

function domSelector (query, tree=document) {
	query = query.trim();
	return (query.startsWith('::')
		? arrayFrom(tree.querySelectorAll(domSpecialQuery(query.slice(2).trim())))
		: tree.querySelector(domSpecialQuery(query))
	);
}

function domSpecialQuery (query) {
	query = query.trim();
	if (query.endsWith('$')) {
		query = query.split('$');
		return `${query.slice(0, -2).join('$')}[name="${query.slice(-2)[0]}"]`;
	} else {
		return query;
	}
}

window.arrayFrom = arrayFrom;
window.$ = domSelector;

})();
