window.addEventListener('load', (function() {

//function getElemPrototype (elem) { return elem.outerHTML.split('>') }

/* https://stackoverflow.com/a/47932848 */
//function camelToDash(str){ return str.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();}) }

/* function elemToQuery (elem) {
	var query = elem.tagName;
	if (elem.id) {
		query += `[id="${elem.id}"]`;
	}
	if (elem.className) {
		query += `[class="${elem.className}"]`;
	}
	for (var key in elem.dataset) {
		query += `[data-${camelToDash(key)}="${elem.dataset[key]}"]`;
	}
	return query;
} */

var initialSectionName = $('[data-section][data-open]').dataset.section;

$(':: .holo-actionbar > .holo-list, .holo-actionBar > .holo-list').forEach(function(actionListElem){
	var actionListElemNew = actionListElem.cloneNode(true);
	actionListElemNew.classList.add('collapsible');
	actionListElemNew.querySelector('[data-collapser]').remove();
	arrayFrom(actionListElemNew.querySelectorAll('.holo-list li')).forEach(function(itemElem){
		itemElem.remove();
	});
	actionListElem.insertAdjacentElement('afterend', actionListElemNew);
	actionListElem.querySelector('button[data-collapser], [data-collapser] > button').onclick = (function(){
		actionListElemNew.style.display = (actionListElemNew.style.display ? null : 'revert');
	});
});

$('::[data-action-sidebar]').forEach(function(actionSidebarElem){
	var sidebarElem = $('[data-sidebar="' + actionSidebarElem.dataset.actionSidebar + '"]');
	function toggleSidebar () {
		sidebarElem.dataset.open = (sidebarElem.dataset.open !== 'open' ? 'open' : false);
	}
	actionSidebarElem.addEventListener('click', toggleSidebar);
	sidebarElem.addEventListener('click', toggleSidebar);
	sidebarElem.querySelector('.holo-list').addEventListener('click', (function(event){
		event.stopPropagation();
	}));
	arrayFrom(sidebarElem.querySelectorAll('.holo-list li button, .holo-list li [role="button"]')).forEach(function(buttonElem){
		buttonElem.addEventListener('click', (function(){
			sidebarElem.dataset.open = false;
		}));
	})
});

$('::[data-action-section]').forEach(function(actionSectionElem){
	var sectionElems = $('::[data-section]');
	var sectionTargetName = actionSectionElem.dataset.actionSection;
	var sectionTargetElem = $('[data-section="' + sectionTargetName + '"]');
	actionSectionElem.addEventListener('click', (function(event){
		sectionElems.forEach(function(sectionElem){
			sectionElem.dataset.open = false;
		});
		sectionTargetElem.dataset.open = 'open';
		location.hash = `/${sectionTargetName}`;
		refreshDisplaySections(sectionTargetName);
	}));
});

function refreshDisplaySections (sectionTargetName) {
	$('::[data-display-sections]').forEach(function(displaySectionsElem){
		if (displaySectionsElem.dataset.displaySections.split(' ').includes(sectionTargetName)) {
			displaySectionsElem.style.display = null;
		} else {
			displaySectionsElem.style.display = 'none';
		}
	});
	reorderActionBar();
}
refreshDisplaySections();

function hashChange () {
	var sectionHash = location.hash.slice(2).split('/')[0];
	$(`[data-action-section="${sectionHash || initialSectionName}"]`).click();
}
window.addEventListener('hashchange', hashChange);
hashChange();

function reorderActionBar () {
	$(':: .holo-actionbar, .holo-actionBar').forEach(function(actionBarElem){
		var childrenWidth = 0;
		var collapsedChildren = 0;
		childrenWidth += actionBarElem.querySelector('button.holo-title').clientWidth;
		arrayFrom(actionBarElem.querySelectorAll('.holo-list.collapsible li')).forEach(function(itemElem){
			var destParentElem = actionBarElem.querySelector('.holo-list:not(.collapsible)');
			//if (!destParentElem.className.includes('holo-list')) {
			//if (getElemPrototype(itemElem.parentElement) !== getElemPrototype(destParentElem)) {
			//	destParentElem = actionBarElem.querySelector(`.holo-list:not(.collapsible) > ${elemToQuery(itemElem.parentElement)}`);
			//}
			destParentElem.insertBefore(itemElem, destParentElem.lastElementChild);
		});
		arrayFrom(actionBarElem.querySelectorAll('.holo-list:not(.collapsible) li')).forEach(function(itemElem){
			itemElem.dataset.collapsed = false;
			childrenWidth += itemElem.clientWidth;
		});
		//arrayFrom(actionBarElem.querySelectorAll('.holo-list.collapsible li')).forEach(function(itemElem){
		//	itemElem.dataset.collapsed = false;
		//});
		if (childrenWidth <= actionBarElem.clientWidth) {
			actionBarElem.querySelector('[data-collapser]').style.display = 'none';
		}
		while (childrenWidth > actionBarElem.clientWidth) {
			var itemElem = arrayFrom(actionBarElem.querySelectorAll('.holo-list:not(.collapsible) li:not([data-collapsed="true"]):not([data-collapser])')).slice(-1)[0];
			if (!itemElem) {
				return;
			}
			collapsedChildren++;
			childrenWidth -= itemElem.clientWidth;
			itemElem.dataset.collapsed = true;
			var destParentElem = actionBarElem.querySelector('.holo-list.collapsible');
			//if (!destParentElem.className.includes('holo-list')) {
			//	destParentElem = actionBarElem.querySelector(`.holo-list.collapsible > ${elemToQuery(itemElem.parentElement)}`);
			//}
			destParentElem.insertBefore(itemElem, destParentElem.firstElementChild);
			actionBarElem.querySelector('[data-collapser]').style.display = null;
		}
		//if (collapsedChildren > 0) {
		//	arrayFrom(actionBarElem.querySelectorAll('.holo-list.collapsible li:not([data-collapsed="true"]):not([data-collapser])')).slice(-collapsedChildren).forEach(function(itemElem){
		//		itemElem.dataset.collapsed = true;
		//	});
		//}
	});
}
window.addEventListener('resize', reorderActionBar);
reorderActionBar();

}));
