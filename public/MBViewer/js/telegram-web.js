(function($) {
	$.fn.redraw = function() {
		return this.map(function(){ this.offsetTop; return this; });
	};
	$.fn.scrollIntoView = function(options) {
		options = options || {}
		return this.first().each(function() {
			var position = options.position || 'auto',
					padding = options.padding || 0,
					duration = options.duration || 0;
			var $item			 = $(this),
					$cont			 = $item.scrollParent(),
					scrollTop	 = $cont.scrollTop(),
					positionTop = 0,
					paddingTop	= 0,
					itemHeight	= $item.outerHeight(),
					isBody			= false;
			if ($cont.get(0) === document) {
				isBody		 = true;
				$cont			= $(window);
				positionTop = $item.offset().top;
				paddingTop = $('header').height() + 1;
			} else {
				positionTop = $item.offset().top - $cont.offset().top + scrollTop;
			}
			if (options.slidedEl) {
				if (options.slidedEl === 'this') {
					options.slidedEl = this;
				}
				$(options.slidedEl, this).each(function() {
					itemHeight += (this.scrollHeight - this.clientHeight);
				});
			}
			var itemTop		 = positionTop,
					itemBottom	= itemTop + itemHeight,
					contHeight	= $cont.height(),
					contTop		 = scrollTop + padding + paddingTop,
					contBottom	= scrollTop + contHeight - padding,
					scrollTo		= null;
			if (position == 'auto') {
				if (itemTop < contTop) {
					scrollTo = itemTop - padding - paddingTop;
				} else if (itemBottom > contBottom) {
					if (itemHeight > contHeight - padding - padding) {
						scrollTo = itemTop - padding - paddingTop;
					} else {
						scrollTo = itemBottom - contHeight + padding;
					}
				}
			} else if (position == 'top' || position == 'center') {
				if (contHeight > itemHeight) {
					padding = (contHeight - paddingTop - itemHeight) / 2;
				}
				scrollTo = itemTop - padding - paddingTop;
			} else if (position == 'bottom') {
				if (itemHeight > contHeight - padding - padding) {
					scrollTo = itemTop - padding - paddingTop;
				} else {
					scrollTo = itemBottom - contHeight + padding;
				}
			}
			if (scrollTo) {
				if (duration) {
					if (isBody) {
						$cont = $('html');
					}
					$cont.stop().animate({scrollTop: scrollTo}, duration);
				} else {
					$cont.scrollTop(scrollTo);
				}
			}
		});
	};
})(jQuery);

function doesSupportThinBoxShadow() {
	if (!window.getComputedStyle) return;
	var div = document.createElement('div');
	div.style.boxShadow = '0 0 0 0.5px black';
	div.style.display = 'none';
	document.body.appendChild(div);
	var box_shadow = window.getComputedStyle(div).boxShadow;
	document.body.removeChild(div);
	return box_shadow.indexOf('0.5') >= 0;
}

function formatDate(datetime) {
	var date = new Date(datetime);
	var cur_date = new Date();
	var j = date.getDate();
	var M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()];
	var Y = date.getFullYear();
	if (cur_date.getFullYear() == date.getFullYear()) {
		return M + ' ' + j;
	}
	if (!j && !M && !Y) {
		return 'Undefined';
	}
	return M + ' ' + j + ', ' + Y;
}

function getCssProperty(el, prop) {
	if (window.getComputedStyle) {
		return window.getComputedStyle(el, '').getPropertyValue(prop) || null;
	} else if (el.currentStyle) {
		return el.currentStyle[prop] || null;
	}
	return null;
}

function isVisible(el, padding) {
	var node = el, val;
	var visibility = getCssProperty(node, 'visibility');
	if (visibility == 'hidden') return false;
	while (node) {
		if (node === document.documentElement) break;
		var display = getCssProperty(node, 'display');
		if (display == 'none') return false;
		var opacity = getCssProperty(node, 'opacity');
		if (opacity !== null && opacity < 0.1) return false;
		node = node.parentNode;
	}
	if (el.getBoundingClientRect) {
		padding = +padding || 0;
		var rect = el.getBoundingClientRect();
		var html = document.documentElement;
		if (rect.bottom < padding ||
				rect.right < padding ||
				rect.top > (window.innerHeight || html.clientHeight) - padding ||
				rect.left > (window.innerWidth || html.clientWidth) - padding) {
			return false;
		}
	}
	return true;
}

var TWeb = {
	init: function(options) {
		options = options || {};
		if (!doesSupportThinBoxShadow()) {
			$('body').addClass('thin_box_shadow');
		}
		$('.js-widget_message').each(function() {
			TPost.init(this);
		});
		TWeb.updateServiceDate($('.js-widget_message_wrap'));
		if (options.scrollToPost) {
			TWeb.highlightPost(options.scrollToPost, true);
		} else {
			$('.js-widget_message_wrap').last().scrollIntoView({position: 'top'});
		}
		$('body').removeClass('no_transitions');
		$('.js-header_search').on('focus', function() {
			$('header.tgme_header').removeClass('search_collapsed');
			$(this).select();
		});
		$('.js-header_search').on('blur', function() {
			$('header.tgme_header').addClass('search_collapsed');
		});
		TWeb.initScroll();
		TWeb.initViews();
		if (window.matchMedia) {
			var darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
			TWeb.toggleTheme(darkMedia.matches);
			darkMedia.addListener(function(e) {
				TWeb.toggleTheme(e.matches);
			});
		}
		if (true) { // wallpaper supported
			$('body').addClass('twallpaper');
			TWallpaper.init($('#tgme_background').get(0));
			$(window).on('focus', function() { // chrome fix
				TWallpaper.update();
			});
			var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
			reduceMotion.addEventListener('change', function() {
				TWallpaper.scrollAnimate(!reduceMotion.matches);
			});
			TWallpaper.scrollAnimate(!reduceMotion.matches);
		}
	},
	toggleTheme: function(dark) {
		$('html').toggleClass('theme_dark', dark);
	},
	initScroll: function() {
		var $document = $(document);
		$document.on('scroll', function() {
			$before = $('.js-messages_more[data-before]');
			$after	= $('.js-messages_more[data-after]');
			var wheight = $(window).height();
			var scrollTop = $(window).scrollTop();
			if ($before.length) {
				var bottom = $before.offset().top + $before.height() - scrollTop;
				if (bottom > -wheight * 3) {
					TWeb.loadMore($before);
				}
			}
			if ($after.length) {
				var top = $after.offset().top - scrollTop;
				if (top < wheight * 3) {
					TWeb.loadMore($after);
				}
			}
		});
		$document.on('click', '.js-messages_more', function() {
			var $el = $(this);
			TWeb.loadMore($el);
		});
	},
	initViews: function() {
		TWeb.viewsMap = {};
		TWeb.viewsQueue = [];
		TWeb.viewsLastLoad = 0;
		var $document = $(document), $window = $(window);
		$document.ready(function() {
			$window.on('scroll resize', TWeb.checkVisiblePosts);
			TWeb.checkVisiblePosts();
		});
	},
	checkVisiblePosts: function() {
		$('.js-widget_message[data-view]').each(function() {
			if (isVisible(this, 50)) {
				var view = this.getAttribute('data-view');
				if (view) {
					TWeb.addViewToQueue(view);
				}
				this.removeAttribute('data-view');
			}
		});
	},
	addViewToQueue: function(view) {
		if (!TWeb.viewsMap[view]) {
			TWeb.viewsMap[view] = true;
			TWeb.viewsQueue.push(view);
			TWeb.sendViewsMaybe();
		}
	},
	sendViewsMaybe: function() {
		var now = +(new Date);
		if (now - TWeb.viewsLastLoad < 10000 && TWeb.viewsQueue.length < 50) {
			return setTimeout(TWeb.sendViewsMaybe, 10000);
		}
		if (TWeb.viewsQueue.length > 0) {
			var views = TWeb.viewsQueue.join(';');
			TWeb.viewsQueue = [];
			$.ajax('/v/', {type: 'POST', data: {views: views}});
			TWeb.viewsLastLoad = now;
		}
	},
	highlightPost: function(post_id, scroll) {
		var $postWrap = $('.js-widget_message[data-post="' + post_id + '"]').parents('.js-widget_message_wrap');
		if (scroll) {
			$postWrap.scrollIntoView({position: 'top'});
		}
		$postWrap.addClass('prepare_highlight').redraw().addClass('highlight');
		setTimeout(function() {
			$postWrap.removeClass('highlight');
			setTimeout(function() {
				$postWrap.removeClass('prepare_highlight');
			}, 300);
		}, 1500);
	},
	updateServiceDate: function($wrapEls, skip_first) {
		$wrapEls.each(function() {
			if (!$(this).data('msg_date')) {
				var datetime = $('time[datetime]', this).attr('datetime');
				if (datetime) {
					var date_formatted = formatDate(datetime);
					$('<div class="tgme_widget_message_service_date_wrap"><div class="tgme_widget_message_service_date">' + date_formatted + '</div></div>').appendTo(this);
					$(this).data('msg_date', date_formatted);
				}
			}
		});
		var len = $wrapEls.size();
		for (var i = len - 1; i >= 0; i--) {
			var $wrapEl = $wrapEls.eq(i);
			var $prevWrapEl = i > 0 ? $wrapEls.eq(i - 1) : null;
			if (!$prevWrapEl && skip_first) continue;
			var date_visible = !$prevWrapEl || $prevWrapEl.data('msg_date') != $wrapEl.data('msg_date');
			$wrapEl.toggleClass('date_visible', date_visible);
		}
	},
	loadMore: function($moreEl, dataOverride) {
		var loading = $moreEl.data('loading');
		if (loading) {
			return false;
		}
		var wrapType = '';
		var after = $moreEl.attr('data-after');
		var before = $moreEl.attr('data-before');
		if (after !== undefined) {
			wrapType = 'after';
		} else if (before !== undefined) {
			wrapType = 'before';
		}
		var url = $moreEl.attr('href');
		$moreEl.data('loading', true);
		$moreEl.addClass('dots-animated');
		var _load = function(url, before, after) {
			if (dataOverride) {
				_loadContinue(dataOverride);
			} else if (url) {
				$.ajax(url, {
					success: function(data) { _loadContinue(data) },
					error: function(data) {
						var timeout = $moreEl.data('timeout') || 1000;
						$moreEl.data('timeout', timeout > 60000 ? timeout : timeout * 2);
						setTimeout(function(){ _load(url, before, after); }, timeout);
					}
				});
			}
		};
		var _loadContinue = async function(data) {
			var messageHistoryCountBefore = $('section.tgme_channel_history.js-message_history .tgme_widget_message_wrap.js-widget_message_wrap').length;
			var [initialHtmlScroll, initialHtmlHeight] = [$('html').scrollTop(), $('html').height()];
			var $data = $(await MakeMbHtml(data, wrapType));
			var $helper = $('<div class="tgme_widget_messages_helper"></div>');
			$helper.append($data);
			$('.js-message_history').append($helper);
			$helper.find('.js-widget_message').each(function() {
				TPost.init(this);
			});
			$helper.remove();
			var wrapEls = $data.filter('.js-widget_message_wrap').get();
			var $moreElWrap = $moreEl.parents('.js-messages_more_wrap');
			if (before) {
				var firstWrapEl = $moreElWrap.next('.js-widget_message_wrap').get();
				var $wrapEls = $(wrapEls.concat(firstWrapEl));
				TWeb.updateServiceDate($wrapEls);
				var y = $moreElWrap.offset().top + $moreElWrap.outerHeight(true) - $(document).scrollTop();
				$data.insertBefore($moreElWrap);
				var st = $moreElWrap.offset().top - y;
				$moreElWrap.remove();
				$(window).scrollTop(st);
			} else {
				var lastWrapEl = $moreElWrap.prev('.js-widget_message_wrap').get();
				var $wrapEls = $(lastWrapEl.concat(wrapEls));
				TWeb.updateServiceDate($wrapEls, lastWrapEl.length > 0);
				$data.insertBefore($moreElWrap);
				$moreElWrap.remove();
			}
			// load more messages if the current viewport is not tall enough to be scrolled
			if (!IsScrollableY($('html')[0])) {
				MbState.wasEverNonScrollable = true;
				MbState.lastMustScroll = true;
				TWeb.loadMore($('.js-messages_more_wrap > a'));
				return;
			}
			if (MbState.lastMustScroll) {
				return _scrollToLastMessage();
			}
			if (MbState.wasEverNonScrollable) {
				return _scrollToLastMessage();
			}
			if (wrapType === 'before') {
				$('html').scrollTop(initialHtmlScroll + $('html').height() - initialHtmlHeight);
			}
			if (MbState.startingPost && messageHistoryCountBefore === 1) {
				TWeb.highlightPost(MbState.startingPost?.id || MbState.startingPost?.ID);
			}
		};
		var _scrollToLastMessage = function() {
			//$('#BottomAnchor')[0].scrollIntoView();
			var lastMessageElem = $('.tgme_widget_message_wrap').last()[0];
			lastMessageElem.scrollIntoView();
			// scroll a bit more to show the message nicely if it's taller than viewport
			if (lastMessageElem.clientHeight > ($('html')[0].clientHeight - 48)) {
				$('html')[0].scrollTop -= 48;
			}
			MbState.lastMustScroll = false;
		};
		// avoid automatic infinite upscrolling
		if ($('html')[0].scrollTop === 0) {
			$('html')[0].scrollTop = 16;
		}
		_load(url, before, after);
	},
}
window.TWeb = TWeb;
