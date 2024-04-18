window.addEventListener('load', (function() {

var initialSectionName = $('[data-section][data-open]').dataset.section;

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
}
refreshDisplaySections();

function hashChange () {
	var sectionHash = location.hash.slice(2).split('/')[0];
	$(`[data-action-section="${sectionHash || initialSectionName}"]`).click();
}
window.addEventListener('hashchange', hashChange);
hashChange();

}));
