window.addEventListener('load', (function() {

$('::[data-action-sidebar]').forEach(function(actionSidebarElem){
	var sidebarElem = $('[data-sidebar="' + actionSidebarElem.dataset.actionSidebar + '"]');
	actionSidebarElem.onclick = sidebarElem.onclick = (function(){
		sidebarElem.dataset.open = (sidebarElem.dataset.open !== 'open' ? 'open' : false);
	});
	sidebarElem.querySelector('.holo-list').onclick = (function(event){
		event.stopPropagation();
	});
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

}));
