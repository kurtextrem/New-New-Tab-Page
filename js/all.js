document.getElementsByTagName("body")[0].classList.remove("hidden")

function NTP() {
	this.news_ = this.weather_ = this.apps_ = this.mostVisited_ = this.search_ =  this.recentlyClosed_ = this.infoMenu_ =  this.newPopup_ = null
}
NTP.prototype.init = function() {
	this.search_ = new SearchBox;
	this.mostVisited_ = new MostVisited();
	this.mostVisited_.show();
	this.apps_ = new AppsUI();
	this.apps_.show();
	this.weather_ = new Weather();
	this.weather_.show();
	this.news_ = new News();
	this.news_.show();
	this.recentlyClosed_ = new recentlyClosed()
	this.recentlyClosed_.show()
	this.infoMenu_ = new infoMenu()
	this.newPopup_ = new newPopup()
	var hour = (new Date).getHours()
	if (hour>=5 && hour<8)
		$('body').addClass('bg-dawn')
	else if (hour>=8 && hour<19)
		$('body').addClass('bg-daylight')
	else if (hour>=19 && hour<21)
		$('body').addClass('bg-dusk')
	else
		$('body').addClass('bg-twilight')
	window.setTimeout(function(){
		var elem = document.getElementById('most-visited-container')
		if (elem.children.length < 2 || elem.children[0].nodeName === 'DIV') {
			location.reload()
		}
	}, 500)
}

var ntp = new NTP
$(document).ready(ntp.init.bind(ntp))

function MostVisited() {
	this.ui_ = new MostVisitedUI(this.undoDomainBlock_.bind(this), this.unblockAllDomains_.bind(this));
	this.thumbnails_ = this.lastBlockedDomain_ = null;
	chrome.runtime.getBackgroundPage(function(a) {
		this.thumbnails_ = a.thumbnails
	}.bind(this))
}
MostVisited.BUTTON_TYPE = "thumbnail";
MostVisited.DATA_SOURCE = "topSites"; // history / topSites
MostVisited.prototype.show = function() {
	if ("topSites" === MostVisited.DATA_SOURCE) {
		chrome.topSites.get(this.onTopSitesReceived_.bind(this))
	} else {
		var a = Date.now() - 2592E6;
		chrome.history.search({
			text: "",
			startTime: a,
			maxResults: 1E3
		}, this.onHistorySearchComplete_.bind(this))
	}
};
MostVisited.prototype.onTopSitesReceived_ = function(a) {
	for (var b = {}, c = 0; c < a.length; c++) {
		var d = util.domainFromURL(a[c].url);
		d && (b['most-visited-blocked-' + d] = !1)
	}
	b['favorites'] = {}
	chrome.storage.local.get(b, this.filterAndShow_.bind(this, a))
};
MostVisited.prototype.onHistorySearchComplete_ = function(a) {
	var b, c = {}, d = [],
		f = {};
	for (b = 0; b < a.length; b++) {
		var e = a[b],
			h = util.domainFromURL(e.url);
		h && (c[h] || (g = {
			domain: h,
			pages: [],
			count: 0
		}, c[h] = g, d.push(g), f["most-visited-blocked-" + h] = !1), h = c[h], h.pages.push(e), h.count +=
			e.visitCount)
	}
	d.sort(function(a, b) {
		return b.count - a.count
	});
	a = [];
	for (b = 0; b < d.length; b++) {
		for (var h = d[b], c = 0, e = g = null, j = 0; j < h.pages.length; j++)
			h.pages[j].visitCount > c && (c = h.pages[j].visitCount, g = h.pages[j].url, e = h.pages[j].title);
		a.push({
			url: g,
			title: e,
			count: c
		})
	}
	chrome.storage.local.get(f, this.filterAndShow_.bind(this, a))
};
MostVisited.prototype.getFavicon_ = function(a, b) {
	return "chrome://favicon/" + a
};
MostVisited.prototype.filterAndShow_ = function(a, b) {
	this.ui_.reset()
	for (var c = 0, d = 0, realD = 0; c < a.length && 7 > d; c++, realD++) {
		if (typeof b['favorites'][a[c].url] !== 'undefined' && b['favorites'][a[c].url].index !== realD) {
			realD--
			continue
		}
		$.each(b['favorites'], function(i, e) {
			if (!e.added && ((c < 14 && e.index === realD) || (c > 13 && e.index+13 === c))) {
				a[c].url = e.url
				a[c].title = e.title
				a[c].index = true
				b['favorites'][e.url].added = true
			}
		})
		var f = a[c].url,
			e = a[c].title,
			g = util.domainFromURL(f)
		if(!e)
			e = g
		if(!b["most-visited-blocked-" + g]) {
			d++
			if ("thumbnail" === MostVisited.BUTTON_TYPE) {
				e = this.ui_.addThumbnailButton(g, e, f, this.addDomainToBlacklist_.bind(this, g), a[c].index)
				g = this.getFavicon_(f, a[c].count)
				this.ui_.showFavicon(e, g)
				this.thumbnails_.get(f, this.onThumbnailFound_.bind(this, e), this.onThumbnailNotFound_.bind(this, e, f, g))
			} else if ("chrome-thumb" === MostVisited.BUTTON_TYPE) {
				e = this.ui_.addThumbnailButton(g, e, f, this.addDomainToBlacklist_.bind(this, g), a[c].index)
				this.ui_.showFavicon(e, this.getFavicon_(f, a[c].count))
				g = new Image
				g.onload = function(a, b) {
					this.ui_.showThumbnail(a, "chrome://thumb/" + b)
				}.bind(this, e, f)
				g.onerror = this.onThumbnailNotFound_.bind(this, e, f)
				g.src = "chrome://thumb/" + f
			}
		} else {
			realD--
		}
	}
}
MostVisited.prototype.addDomainToBlacklist_ = function(a) {
	this.lastBlockedDomain_ = a;
	var b = {};
	b["most-visited-blocked-" + a] = !0;
	chrome.storage.local.set(b, this.show.bind(this))
};
MostVisited.prototype.onThumbnailFound_ = function(a, b) {
	b && this.ui_.showThumbnail(a, b)
};
MostVisited.prototype.onThumbnailNotFound_ = function(a, b, c) {
	util.dominantColors.get(c, 2, function(b) {
		if (!(2 > b.length)) {
			var c = util.rgbToHsl(b[0]),
				e = util.rgbToHsl(b[1]);
			b = c;
			if (0.95 < c[2] || 0.05 > c[2]) {
				if (0.95 < e[2] || 0.05 > e[2])
					return;
				b = c
			}
			b[2] = 0.4;
			c = util.hslToRgb(b);
			b[2] = 0.85;
			e = util.hslToRgb(b);
			b[2] = 0.7;
			b = util.hslToRgb(b);
			this.ui_.setColors(a, util.rgbToCss(c), util.rgbToCss(e), util.rgbToCss(b))
		}
	}.bind(this))
};
MostVisited.prototype.undoDomainBlock_ = function() {
	if (this.lastBlockedDomain_) {
		var a = {};
		a["most-visited-blocked-" + this.lastBlockedDomain_] = !1;
		chrome.storage.local.set(a, this.show.bind(this));
		this.lastBlockedDomain_ = null
	}// else
	//	console.error("Undo shown while no domain was blocked.")
};
MostVisited.prototype.unblockAllDomains_ = function() {
	this.lastBlockedDomain_ = null;
	chrome.storage.local.get(null, function(a) {
		for (var b in a)
			0 === b.indexOf("most-visited-blocked-") ? a[b] = !1 : delete a[b];
		chrome.storage.local.set(a, this.show.bind(this))
	}.bind(this))
};

function News() {
	this.ui_ = new NewsUI();
	$(document).bind("news-loaded", this.show.bind(this))
}
News.prototype.show = function() {
	chrome.storage.local.get({
		news: null
	}, this.showCachedNews_.bind(this))
};
News.prototype.showCachedNews_ = function(a) {
	a = a.news;
	if (!a || 0 === a.length || 36E5 < Date.now() - a.date)
		this.ui_.hide(), chrome.runtime.getBackgroundPage(function(a) {
			a.newsFetcher.init()
		});
		//console.log("No news or old news, retrying.")
	else {
		this.ui_.reset();
		//this.ui_.addHeading();
		this.ui_.show();
		for (var b = 0; b < Math.min(6, a.length); b++)
			this.ui_.add(a[b].title, a[b].url, a[b].date);
		this.ui_.addMoreLink()
	}
};

function SuggestRequest(a) {
	this.query_ = a
}
SuggestRequest.URL = 'https://www.google.com/complete/search' //chrome.i18n.getMessage('google', 's') + "complete/search"
SuggestRequest.prototype.sendRequest = function(a) {
	this.callback_ = a;
	$.get(SuggestRequest.URL, {
		client: "ntp-russia",
		q: this.query_,
		hjson: "t"
	}, this.onResponse_.bind(this), "json")
};
SuggestRequest.prototype.cancel = function() {
	this.callback_ = null
};
SuggestRequest.prototype.onResponse_ = function(a) {
	if (this.callback_) {
		for (var b = [], c = 0; c < a[1].length; c++) b.push(a[1][c][0]);
			this.callback_(b)
	}
};

function Weather() {
	this.ui_ = new WeatherUI(a);
	this.delay_ = null;
	$(document).bind("weather-loaded", this.show.bind(this));
	chrome.runtime.getBackgroundPage(function(a) {
		this.delay_ = a.WeatherFetcher.DELAY
	}.bind(this))
}
Weather.prototype.show = function() {
	this.ui_.reset()
	chrome.storage.local.get({
		"location-permission": true,
		"location-name": null,
		forecast_length: 4,
		weather: null
	}, this.showValues_.bind(this))
};
Weather.prototype.requestNewWeather_ = function() {
	//console.log("requestNewWeather_");
	chrome.runtime.getBackgroundPage(function(a) {
		a.weatherFetcher.init()
	}.bind(this))
};
Weather.prototype.showValues_ = function(a) {
	if (!a["location-name"] || !a.weather)
		this.ui_.hide(), this.requestNewWeather_();
	else {
		this.ui_.show();
		var b = a.weather,
			c = a["location-name"],
			length = a.forecast_length
		36E5 < Date.now() - b.request_date && this.requestNewWeather_();
		this.ui_.reset();
		this.ui_.setAddress(c);
		this.ui_.setDate(this.getDateString_(b.date));
		this.ui_.setIcon(b.icon);
		this.ui_.setCurrentConditions(b.temperature, b.condition, b.wind, b.humidity);
		if (b.forecast.length < a.forecast_length)
			length = b.forecast.length
		for (c = 0; c < length; c++) {
			var d = b.forecast[c];
			this.ui_.addForecast(d.day, d.icon,
				d.high, d.low, d.condition)
		}
	}
};
Weather.prototype.getDateString_ = function(a) {
	var b;
	try {
		b = Intl
	} catch (c) {
		b = v8Intl
	}
	return b.DateTimeFormat(chrome.i18n.getMessage('@@ui_locale').replace('_', '-'), {
		year: "numeric",
		month: "long",
		day: "numeric",
		weekday: "long",
		hour: "2-digit",
		minute: "2-digit"
	}).format(a)
};

function AppsUI() {
}
AppsUI.prototype.show = function() {
	$("#apps-list a").remove()
	chrome.management.getAll(this.onAppsListReceived_.bind(this))
};
AppsUI.prototype.onAppsListReceived_ = function(a) {
	var b = $('<a href="https://chrome.google.com/webstore"><img src="chrome://extension-icon/ahfgeienlihckogmohjhadlkjgocpleb/64/1"><div class="icon-title">'+chrome.i18n.getMessage('chromeWebStore')+'</div></a>');
	$("#apps-list").append(b);
	for (b = 0; b < a.length; b++) {
		var c = a[b];
		if (c.enabled && !(0 > c.type.indexOf("app") || "blpcfgokakmgnkcojhhkbfbldkacnbeo" === c.id)) {
			for (var d =
				null, f = 0; f < c.icons.length; f++) {
				if (null === d || c.icons[f].size > d.size || 64 === c.icons[f].size)
					d = c.icons[f];
				if (d && 64 === d.size)
					break
			}
			c = this.createAppButton_(c.id, c.shortName || c.name, d.url);
			$("#apps-list").append(c)
		}
	}
};
AppsUI.prototype.createAppButton_ = function(a, b, c) {
	c = $('<a href="" class="closable-button"><img src="' + c + '"><div class="icon-title">' + b + '</div><div class="close-button" title="' + chrome.i18n.getMessage('remove') + '"></div></a>');
	c.click(function() {
		chrome.management.launchApp(a);
		return !1
	}.bind(this));
	c.find(".close-button").click(function() {
		chrome.management.uninstall(a, {
			showConfirmDialog: !0
		}, this.show.bind(this));
		return !1
	}.bind(this));
	return c
};

function MostVisitedUI(a, b) {
	this.undoCallback_ = a;
	this.unblockAllCallback_ = b
}
MostVisitedUI.prototype.reset = function() {
	$('#most-visited-container').html('')
	//$(".most-visited-box").remove()
};
MostVisitedUI.prototype.addIconButton = function(a, b, c) {
	a = $('<a class="most-visited-box"><div class="most-visited-big-icon"></div></a>');
	a.attr("title", c);
	a.attr("href", c);
	c = $('<div class="most-visited-title"></div>');
	c.text(b);
	a.append(c);
	$("#most-visited-container").append(a);
	return a
};
MostVisitedUI.prototype.addThumbnailButton = function(a, b, c, d, favorited) {
	var f = $('<a class="most-visited-box most-visited-domain-' + a.replace(/\./g, "-") + '"></a>'),
		favorite = '<div class="favorite-button" title="' + chrome.i18n.getMessage('favorite') + '"></div>',
		close = '<div class="close-button" title="' + chrome.i18n.getMessage('remove') + '"></div>',
		url = c
	if (favorited) {
		favorite = '<div class="favorite-button favorited-button" title="' + chrome.i18n.getMessage('removeFavorite') + '"></div>'
		close = ''
	}
	f.attr('title', c).attr('href', c)
	c = $('<div class="most-visited-thumbnail closable-button">'+favorite+'<div class="most-visited-domain"></div><img class="most-visited-icon">'+close+'</div>')
	c.find('.most-visited-domain').text(a)
	c.find('.close-button').click(function() {
		d();
		this.showUndoBar_();
		return !1
	}.bind(this))
	c.find('.favorite-button').click(function() {
		var $this = $(this)
		chrome.storage.local.get({favorites: {}}, function(favorites){
			var obj = favorites['favorites']
			if ($this.hasClass('favorited-button')) {
				delete obj[url]
				$this.removeClass('favorited-button')
			} else {
				var index = 0
				$.each($('#most-visited-container').children(), function(i, e){
					if (e === $this.parents('.most-visited-box')[0])
						index = i
				})
				obj[url] = {
					index: index,
					url: url,
					title: $this.parent().next().text()
				}
				$this.addClass('favorited-button')
			}
			chrome.storage.local.set({favorites: obj})
		})
		return false
	})
	a = $('<div class="most-visited-title"></div>')
	a.text(b)
	f.append(c).append(a)
	$("#most-visited-container").append(f)
	return f
};
MostVisitedUI.prototype.showFavicon = function(a, b) {
	var c = a.find(".most-visited-big-icon");
	0 < c.length ? c.css("background-image", "url(" + b + ")") : a.find(".most-visited-icon").attr("src", b)
};
MostVisitedUI.prototype.showThumbnail = function(a, b) {
	a.find(".most-visited-domain").text("");
	a.find(".most-visited-thumbnail").css("background-image", "url(" + b + ")")
};
MostVisitedUI.prototype.setColors = function(a, b, c, d) {
	a = a.find(".most-visited-thumbnail");
	a.css("color", b);
	a.css("background-color", c);
	a.css("border-color", d)
};
MostVisitedUI.prototype.showUndoBar_ = function() {
	var obj = {},
		undo = chrome.i18n.getMessage('undo'),
		restoreAll = chrome.i18n.getMessage('restoreAll')
		obj[undo] = '#'
		obj[restoreAll] = '#'
	$('body').statusbar(chrome.i18n.getMessage('removedWebsite'), obj, {delay: 0, timerIn: 'slow', timerOut: 'slow'}, function(status, $a, e) {
		if (status == 'link') {
			var text = $a.text()
			if (text == undo) {
				this.undoCallback_()
			}
			if (text == restoreAll) {
				this.unblockAllCallback_()
			}
			$a.parent().next('.close-button').click()
			e.preventDefault()
		}
		if (status == 'closed') {
			//console.log("close")
		}
		if (status == 'added') {
			$a.css('top', '165px')
		}

	}.bind(this))
};

function NewsUI() {
	var b
	try {
		b = Intl
	} catch (c) {
		b = v8Intl
	}
	this.formatter_ = b.DateTimeFormat([], {
		hour: "numeric",
		minute: "2-digit",
		hour12: false
	})
}
NewsUI.prototype.reset = function() {
	$("#news-container *").remove()
};
NewsUI.prototype.hide = function() {
	$("#box-news").hide()
};
NewsUI.prototype.show = function() {
	$("#box-news").show()
};

NewsUI.prototype.addHeading = function() {
	var a = $('<div class="news-item" id="news-heading"><h2>' + chrome.i18n.getMessage('news') + '</h2></div>');
	$("#box-news").append(a)
};
NewsUI.prototype.add = function(a, b, c) {
	c = this.formatter_.format(c);
	a = a.match(/(.+) -( .+)/)
	a = $('<div class="news-item"><div class="news-time">' + c.replace(':', '') + '</div><a href="' + b + '">' + a[1] + "<span class='news-publisher'>"+a[2]+"</span></a></div>");
	$("#news-container").append(a)
};
NewsUI.prototype.addMoreLink = function() {
	var a = $('<div class="news-item" id="news-more"><a href="' + chrome.i18n.getMessage('serviceURL', ['', 'news']) + '">' + chrome.i18n.getMessage('moreNews') + '</a></div>');
	$("#news-container").append(a)
	$('#apps-list').css('max-height', $('#box-news').height()-$('#promoted-services').height()-11)
};


function SearchBox() {
	this.pendingSuggest_ = null;
	this.suggestBox_ = new SuggestBox;
	this.input_ = $("#search-input");
	this.input_.bind("search", this.onSearch_.bind(this));
	this.input_.bind("webkitspeechchange", this.onSpeechChange_.bind(this));
	this.input_.bind("input", this.onChange_.bind(this));
	//this.input_.bind("focus", this.onFocus_.bind(this));
	//this.input_.bind("blur", this.onBlur_.bind(this));
	this.val_ = ""
}
SearchBox.GOOGLE_SEARCH_URL = chrome.i18n.getMessage;
SearchBox.prototype.navigateToGoogle_ = function(a) {
	a = SearchBox.GOOGLE_SEARCH_URL('searchURL', ['s', encodeURIComponent(a)]);
	location.replace(a)
};
SearchBox.prototype.onSpeechChange_ = function() {
	if (this.input_.hasClass("empty")) {
		var a = this.input_.val();
		this.input_.val(a.substring(5));
		this.input_.removeClass("empty")
	}
	this.onSearch_()
};
SearchBox.prototype.onSearch_ = function() {
	this.input_.val() && this.navigateToGoogle_(this.input_.val())
};
SearchBox.prototype.onChange_ = function() {
	var a = this.input_.val();
	if(a != this.val_ && $.trim(a) != '') {
		this.val_ = a
		if (this.pendingSuggest_)
			this.pendingSuggest_.cancel()
		this.pendingSuggest_ = new SuggestRequest(a)
		this.pendingSuggest_.sendRequest(this.onSuggestReceived_.bind(this))
	}
};
SearchBox.prototype.onSuggestReceived_ = function(a) {
	this.suggestBox_.reset();
	for (var b = 0; b < a.length; b++)
		this.suggestBox_.add(a[b]);
	0 < a.length && this.suggestBox_.show(this.onSuggestionClick_.bind(this))
};
SearchBox.prototype.onSuggestionClick_ = function(a) {
	a = a.replace(/<b>(.*)<\/b>/g, "$1")
	this.navigateToGoogle_(a)
};

function SuggestBox() {
	this.box_ = $("#search-suggestions");
	this.input_ = $("#search-input");
	this.input_.blur(this.onBlur_.bind(this));
	this.box_.keydown(this.onKeydown_.bind(this));
	this.input_.keydown(this.onKeydown_.bind(this));
	this.lead_ = null;
	this.dontHide_ = !1;
	$(document).mouseup(this.onMouseup_.bind(this))
}
SuggestBox.prototype.reset = function() {
	this.hideLead_();
	this.box_.find(".suggestion-line").remove()
};
SuggestBox.prototype.add = function(a) {
	var b = $('<div class="suggestion-line"></div>');
	b.html(a)
	b.click(this.onClick_.bind(this, a));
	b.mousedown(this.onMousedown_.bind(this));
	b.mouseover(this.hideLead_.bind(this));
	this.box_.append(b)
};
SuggestBox.prototype.show = function(a) {
	this.callback_ = a;
	this.box_.addClass("open")
};
SuggestBox.prototype.hide = function() {
	this.hideLead_();
	this.box_.removeClass("open")
};
SuggestBox.prototype.hideLead_ = function() {
	this.lead_ = null;
	$(".suggestion-line.lead").removeClass("lead")
};
SuggestBox.prototype.onClick_ = function(a) {
	this.hide();
	this.callback_(a);
	return !1
};
SuggestBox.prototype.onKeydown_ = function(a) {
	var b = $(".suggestion-line").length;
	38 !== a.keyCode && 40 !== a.keyCode || (0 === b || 0 < $(".suggestion-line:hover").length) || (null === this.lead_ ? this.lead_ = 40 === a.keyCode ? 0 : b - 1 : 40 === a.keyCode ? (this.lead_++, this.lead_ >= b && (this.lead_ = null)) : (this.lead_--, 0 > this.lead_ && (this.lead_ = null)), $(".suggestion-line.lead").removeClass("lead"), null !== this.lead_ && ($(".suggestion-line:eq(" + this.lead_ + ")").addClass("lead"), this.input_.val($(".suggestion-line:eq(" + this.lead_ + ")").text())))
};
SuggestBox.prototype.onMousedown_ = function() {
	this.dontHide_ = !0;
	this.input_.focus()
};
SuggestBox.prototype.onMouseup_ = function() {
	this.dontHide_ && this.input_.focus();
	this.dontHide_ = !1
};
SuggestBox.prototype.onBlur_ = function() {
	this.dontHide_ || this.hide()
};

function WeatherUI() {
	this.box_ = $("#box-weather");
	this.link_ = chrome.i18n.getMessage('searchURL', ['', chrome.i18n.getMessage('weather')]);
	this.coolWeather = false
	chrome.storage.local.get({
		'use-cool-weather': false,
		'weather-unit': chrome.i18n.getMessage('temperatureUnit'),
		forecast_length: 4
	}, function(val){
			if (val['use-cool-weather']) {
				this.coolWeather = true
				$('#coolWeather').find('input[type=checkbox]').prop('checked', true)
			}
			var unit = val['weather-unit'] == 'C'
			$('#unitSlider').find('input[type=checkbox]').prop('checked', unit)
			$('#forecastSlider').find('input').val(val.forecast_length)
			if (val.forecast_length != 4)
				window.setTimeout(function(){ $('.weather-forecast').css('border-right', 'none') }, 200)
	}.bind(this))
	this.box_.find("a").attr("href", this.link_)
}
WeatherUI.prototype.reset = function() {
	this.box_.find("#weather-forecast-box *").remove()
};
WeatherUI.prototype.hide = function() {
	this.box_.hide()
};
WeatherUI.prototype.show = function() {
	this.box_.show()
};
WeatherUI.prototype.setAddress = function(a) {
	this.link_ = chrome.i18n.getMessage('searchURL', ['', encodeURIComponent(chrome.i18n.getMessage('weather') + ' ' + a)])
	this.box_.find("h2 > a").text(a).attr('href', this.link_)
	//this.box_.find("a").attr("href", this.link_)
};
WeatherUI.prototype.setDate = function(a) {
	//this.box_.find("#weather-date").text(a)
	this.box_.find('h2 > a').attr('title', a)
};
WeatherUI.prototype.setIcon = function(a) {
	var weatherS = 'weather'
	if (this.coolWeather && a.search('night') == -1) {
		weatherS = 'cool weather'
		a = a.replace('weather', weatherS)
	}
	this.box_.find("#weather-current-icon").error(function() {
		console.log('Unknown weather state: ' + a)
		$(this).attr("src", "images/"+weatherS+"/unknown.png")
	}).attr("src", a)
};
WeatherUI.prototype.setCurrentConditions = function(a, b, c, d) {
	this.box_.find("#weather-temperature").text(a);
	this.box_.find("#weather-condition").text(b);
	var wind = c.match(/, ([^ ]+) (.+)/)
	if (wind === null)
		wind = [null, c, '']
	this.box_.find("#weather-wind").text(wind[1]).append('<sup>'+wind[2]+'</sup>').attr('title', chrome.i18n.getMessage('wind')+': '+c)
	this.box_.find("#weather-humidity").text(d).attr('title', chrome.i18n.getMessage('humidity')+': '+d+'%')
};
WeatherUI.prototype.addForecast = function(a, b, c, d, f) {
	if (this.coolWeather && b.search('night') == -1)
		b = b.replace('weather', 'cool weather')
	a = $('<div class="weather-forecast"><div>' + a + '</div><a href=""><img src="' + b + '" title="' + f + '"></a><div><span class="temperature-high">' + c + '</span> <span class="temperature-low">' + d + "</span> </div></div");
	a.find("a").attr("href", this.link_);
	this.box_.find("#weather-forecast-box").append(a)
};

function recentlyClosed() {
	this.ui_ = new recentlyClosedUI()
	$(document).bind('tab-closed', this.show.bind(this))
}

recentlyClosed.prototype.requestRecentlyClosed = function() {
	chrome.runtime.getBackgroundPage(function(a) {
		a.recentlyClosed.get(function(a){
			this.ui_.setRecentlyClosed(a)
		}.bind(this))
	}.bind(this))
}

recentlyClosed.prototype.show = function() {
	this.requestRecentlyClosed()
}

function recentlyClosedUI() {
	this.box_ = $('#box-recent')
}

recentlyClosedUI.prototype.setRecentlyClosed = function(a) {
	var length = Object.keys(a).length,
	elem
	for (var i = 0; i < length; i++) {
		elem = a[i]
		if (typeof elem != 'undefined')
			this.box_.find('div:nth-of-type('+(i+1)+') > a').attr('href', elem.url).attr('title', elem.title+ ' － '+elem.url).find('img').css('background-image', 'url(chrome://favicon/'+elem.url+')').show()
	}
}

recentlyClosedUI.prototype.hide = function() {
	this.box_.hide()
}
recentlyClosedUI.prototype.show = function() {
	this.box_.show()
}

function infoMenu() {
	this.regEvents()
}

infoMenu.prototype.regEvents = function() {
	this.click()
	this.footerToggle()
}
infoMenu.prototype.click = function() {
	$('.infoButton').click(function(){
		$(this).toggleClass('active').parents('.content-box').find('.extendedInfo').slideToggle()
	})
}
infoMenu.prototype.footerToggle = function() {
	$('#coolWeather').click(function(){
		window.setTimeout(function(){
			var checked = $(this).find('input[type=checkbox]').is(':checked')
			chrome.storage.local.set({'use-cool-weather': checked},
				function(){
					ntp.weather_.ui_.coolWeather = checked
					chrome.runtime.getBackgroundPage(function(a) {
						a.weatherFetcher.startWeatherRetrieval(true)
					})
				}
			)
		}.bind(this), 50)

	})
	$('#unitSlider').click(function(){
		window.setTimeout(function(){
			var checked = $(this).find('input[type=checkbox]').is(':checked')?'C':'F'
			chrome.storage.local.set({'weather-unit': checked},
				function(){
					chrome.runtime.getBackgroundPage(function(a) {
						a.weatherFetcher.startWeatherRetrieval(true)
					})
				}
			)
		}.bind(this), 50)

	})
	$('#forecastSlider').change(function(){
		var $input = $(this).find('input'),
			length = $input.val()
		chrome.storage.local.set({forecast_length: length},
			function(){

				ntp.weather_.show()
				if (length != 4)
					window.setTimeout(function(){ $('.weather-forecast').css('border-right', 'none') }, 100)
			}
		)
	})
}

function newPopup() {
	this.obj = {}
	this.obj[newPopup.STRING] = false
	this.start()
	this.regEvents()
}

newPopup.STRING = 'newPopupV111'

newPopup.prototype.start = function() {
	chrome.storage.local.get(this.obj, this.received.bind(this))
}

newPopup.prototype.received = function(obj) {
	if(!obj[newPopup.STRING]) {
		var $promo = $('#new-promo')
		$promo.fadeIn('slow', function(){
			$promo.addClass('shake')
			window.setTimeout(function(){
				$promo.removeClass('shake')
			}, 800)
		})
	}
}

newPopup.prototype.regEvents = function() {
	this.obj[newPopup.STRING] = true
	$('#new-promo-close-button, #new-promo-learn-more').click(function(){
		chrome.storage.local.set(this.obj)
		$('#new-promo').fadeOut('slow')
	}.bind(this))
}