function Analytics() {
	this.sender_ = null;
	chrome.runtime.getBackgroundPage(function(a) {
		this.sender_ = a.analyticsSender;
		this.sender_.trackPageLoad()
	}.bind(this))
}
Analytics.prototype.track = function(a, b) {
	this.sender_ && this.sender_.track(a, b)
};
Analytics.prototype.trackLink = function(a, b) {
	this.track(b, a.href);
	return !0
};
Analytics.prototype.wrapLink = function(a, b) {
	a.addEventListener("click", this.trackLink.bind(this, a, b))
};
Analytics.prototype.wrapLinkNoHref = function(a, b) {
	a.addEventListener("click", function() {
		this.track(b, "");
		return !0
	}.bind(this))
};
var dominantColors = {
	get: function(a, b, c) {
		var d = new Image;
		d.onload = function() {
			var a = document.createElement("canvas");
			a.width = d.width;
			a.height = d.height;
			var e = a.getContext("2d");
			e.drawImage(d, 0, 0);
			for (var a = e.getImageData(0, 0, a.width, a.height), e = [], g = 0; g < a.data.length; g += 4)
				e.push(dominantColors.alphaCompose([a.data[g], a.data[g + 1], a.data[g + 2], a.data[g + 3]]));
			a = dominantColors.getClusterCenters_(e, b);
			c(a)
		};
		d.src = a
	},
	alphaCompose: function(a) {
		for (var b = [], c = a[3] / 255, d = 0; 3 > d; d++)
			b.push(Math.round(a[d] * c + 255 *
				(1 - c)));
		return b
	},
	NTRIES: 10,
	getClusterCenters_: function(a, b) {
		var c, d;
		a = a.sort();
		var f = [a[0]],
			e = [1];
		for (c = 1; c < a.length; c++)
			a[c - 1] < a[c] ? (f.push(a[c]), e.push(1)) : e[e.length - 1] += 1;
		var g = f.length;
		if (g <= b) {
			d = [];
			for (c = 0; c < g; c++)
				d.push(c);
			d = d.sort(function(a, b) {
				return e[b] - e[a]
			});
			d = [];
			for (c = 0; c < g; c++)
				d.push(f[c]);
			return d
		}
		g = dominantColors.getClusterCentersForCountedPoints_(f, e, b);
		d = [];
		for (c = 0; c < g.length; c++)
			d.push(f[g[c]]);
		return d
	},
	randomSubset: function(a, b) {
		if (b >= a)
			throw "Required random subset of size >= size of the set.";
		for (var c = [], d = 0; d < b; d++) {
			for (; ; ) {
				for (var f = Math.floor(a * Math.random()), e = 0; e < c.length && f !== c[e]; e++)
					;
				if (e === c.length)
					break
			}
			c.push(f)
		}
		return c
	},
	dist_: function(a, b) {
		for (var c = 0, d = 0; d < a.length; d++)
			c += Math.abs(a[d] - b[d]);
		return c
	},
	findClustersByCenters_: function(a, b) {
		for (var c = [], d = 0; d < b.length; d++)
			c.push([]);
		for (d = 0; d < a.length; d++) {
			for (var f = 0, e = dominantColors.dist_(a[d], a[b[0]]), g = 1; g < b.length; g++) {
				var h = dominantColors.dist_(a[d], a[b[g]]);
				h < e && (e = h, f = g)
			}
			c[f].push(d)
		}
		return c
	},
	findClusterCenter_: function(a,
		b, c) {
		for (var d = null, f = 1E10, e = 0; e < c.length; e++) {
			for (var g = a[c[e]], h = 0, j = 0; j < c.length; j++)
				h += b[c[j]] * dominantColors.dist_(g, a[c[j]]);
			h < f && (f = h, d = c[e])
		}
		return d
	},
	getClusterCentersForCountedPoints_: function(a, b, c) {
		for (var d, f = a.length, e, g, h = 0; h < dominantColors.NTRIES; h++) {
			e = dominantColors.randomSubset(f, c).sort();
			for (var j = 0; 10 > j; j++) {
				g = dominantColors.findClustersByCenters_(a, e);
				e = [];
				for (d = 0; d < c; d++)
					e.push(dominantColors.findClusterCenter_(a, b, g[d]))
			}
		}
		g = dominantColors.findClustersByCenters_(a, e);
		a = [];
		for (d = 0; d < c; d++)
			a.push(d);
		a.sort(function(a, b) {
			return g[b].length - g[a].length
		});
		b = [];
		for (d = 0; d < c; d++)
			b.push(e[a[d]]);
		return b
	}
};

function NTP() {
	this.news_ = this.weather_ = this.apps_ = this.mostVisited_ = this.search_ =  this.recentlyClosed_ = this.infoMenu_ = null
}
NTP.prototype.init = function() {
	this.analytics_ = new Analytics;
	this.search_ = new SearchBox;
	this.mostVisited_ = new MostVisited(this.analytics_);
	this.mostVisited_.show();
	this.apps_ = new AppsUI(this.analytics_);
	this.apps_.show();
	this.weather_ = new Weather(this.analytics_);
	this.weather_.show();
	this.news_ = new News(this.analytics_);
	this.news_.show();
	this.recentlyClosed_ = new recentlyClosed()
	this.recentlyClosed_.show()
	this.infoMenu_ = new infoMenu()
	this.infoMenu_.regEvents()
	$("#logo-link").click(this.analytics_.trackLink.bind(this.analytics_, $("#logo-link")[0], "logo"))
	var hour = (new Date).getHours();
	if (hour>5 && hour<8)
		$('body').addClass('bg-dawn')
	else if (hour>8 && hour<19)
		$('body').addClass('bg-daylight')
	else if (hour>19 && hour<21)
		$('body').addClass('bg-dusk')
	else
		$('body').addClass('bg-twilight')
};
var ntp = new NTP;
$(document).ready(ntp.init.bind(ntp));

function MostVisited(a) {
	this.ui_ = new MostVisitedUI(a, this.undoDomainBlock_.bind(this), this.unblockAllDomains_.bind(this));
	this.thumbnails_ = this.lastBlockedDomain_ = this.favicons_ = null;
	chrome.runtime.getBackgroundPage(function(a) {
		this.favicons_ = a.favicons;
		this.thumbnails_ = a.thumbnails
	}.bind(this))
}
MostVisited.BUTTON_TYPE = "thumbnail";
MostVisited.DATA_SOURCE = "topSites"; // history / topSites
MostVisited.prototype.show = function() {
	if ("topSites" === MostVisited.DATA_SOURCE)
		window.setTimeout(function() {
			chrome.topSites.get(this.onTopSitesReceived_.bind(this))
		}.bind(this), 40) // fixes no thumbs on startup
	else {
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
	chrome.storage.local.get(b, this.filterAndShow_.bind(this, a))
};
MostVisited.DEFAULT_SITES = [{
		domain: "vk.com",
		title: "\u0412\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0435"
	}, {
		domain: "youtube.com",
		title: "YouTube"
	}, {
		domain: "odnoklassniki.ru",
		title: "\u041e\u0434\u043d\u043e\u043a\u043b\u0430\u0441\u0441\u043d\u0438\u043a\u0438"
	}, {
		domain: "wikipedia.org",
		url: "http://wikipedia.org/",
		title: "Wikipedia"
	}, {
		domain: "livejournal.ru",
		url: "http://www.livejournal.ru/",
		title: "\u0416\u0438\u0432\u043e\u0439 \u0436\u0443\u0440\u043d\u0430\u043b"
	}, {
		domain: "mail.ru",
		title: "Mail.Ru"
	}
];
MostVisited.prototype.onHistorySearchComplete_ = function(a) {
	var b, c = {}, d = [],
		f = {};
	for (b = 0; b < MostVisited.DEFAULT_SITES.length; b++) {
		var e = MostVisited.DEFAULT_SITES[b],
			g = e.url || "http://" + e.domain + "/",
			g = {
			domain: e.domain,
			pages: [{
					url: g,
					title: e.title,
					visitCount: 2
				}
			],
			count: 2
		};
		c[e.domain] = g;
		d.push(g);
		f["most-visited-blocked-" + h] = !1
	}
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
	var c = util.domainFromURL(a);
	if (5 > b)
		for (var d = 0; d < MostVisited.DEFAULT_SITES.length; d++)
			if (MostVisited.DEFAULT_SITES[d].domain === c)
				return "icons/" + c + ".ico";
	return "chrome://favicon/" + a
};
MostVisited.prototype.filterAndShow_ = function(a, b) {
	this.ui_.reset();
	for (var c = 0, d = 0; c < a.length && 7 > d; c++) {
		var f = a[c].url,
			e = a[c].title,
			g = util.domainFromURL(f);
		e || (e = g);
		b["most-visited-blocked-" + g] || (d++, "thumbnail" === MostVisited.BUTTON_TYPE ? (e = this.ui_.addThumbnailButton(g, e, f, this.addDomainToBlacklist_.bind(this, g)), g = this.getFavicon_(f, a[c].count), this.ui_.showFavicon(e, g), this.thumbnails_.get(f, this.onThumbnailFound_.bind(this, e), this.onThumbnailNotFound_.bind(this, e, f, g))) : "icon" === MostVisited.BUTTON_TYPE ?
			(e = this.ui_.addIconButton(g, e, f, this.addDomainToBlacklist_.bind(this, g)), this.favicons_.getScaled(f, 64, this.ui_.showFavicon.bind(this.ui_, e))) : "chrome-thumb" === MostVisited.BUTTON_TYPE && (e = this.ui_.addThumbnailButton(g, e, f, this.addDomainToBlacklist_.bind(this, g)), this.ui_.showFavicon(e, this.getFavicon_(f, a[c].count)), g = new Image, g.onload = function(a, b) {
			this.ui_.showThumbnail(a, "chrome://thumb/" + b)
		}.bind(this, e, f), g.onerror = this.onThumbnailNotFound_.bind(this, e, f), g.src = "chrome://thumb/" + f))
	}
};
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
	dominantColors.get(c, 2, function(b) {
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

function News(a) {
	this.ui_ = new NewsUI(a);
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
SuggestRequest.URL = chrome.i18n.getMessage('google', 's') + "complete/search";
SuggestRequest.prototype.sendRequest = function(a) {
	this.callback_ = a;
	$.get(SuggestRequest.URL, {
		client: "ntp-russia",
		q: this.query_,
		json: "t"
	}, this.onResponse_.bind(this), "json")
};
SuggestRequest.prototype.cancel = function() {
	this.callback_ = null
};
SuggestRequest.prototype.onResponse_ = function(a) {
	this.callback_ && this.callback_(a[1])
};
var util = {
	getVersion: function() {
		return parseInt(navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10)
	},
	getOS: function() {
		return -1 != navigator.appVersion.indexOf("Linux") ? "linux" : -1 != navigator.appVersion.indexOf("CrOS") ? "cros" : -1 != navigator.appVersion.indexOf("Mac OS X") ? "mac" : "other"
	},
	showError: function(a) {
		//console.error("Error:", a)
	},
	makeURL: function(a, b) {
		var c = [],
			d;
		for (d in b)
			c.push(d + "=" + encodeURIComponent(b[d]));
		return 0 < c.length ? a + "?" + c.join("&") : a
	},
	domainFromURL: function(a) {
		var b = a.match(/^(\w+)\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
		if (!b)
			return null;
		a = b[1];
		b = b[2];
		return "http" !== a && "https" !== a ? null : 0 === b.indexOf("www.") ? b.substring(4) : b
	},
	protocolAndDomainFromURL: function(a) {
		return (a = a.match(/^(\w+\:\/\/[^\/?#]+)(?:[\/?#]|$)/i)) && a[1]
	},
	updateRetryDelay: function(a) {
		return 36E5 > a ? 1.5 * a : 36E5
	},
	scaleImage: function(a, b, c) {
		var d = new Image;
		d.onload = function() {
			var a = document.createElement("canvas");
			a.width = d.width;
			a.height = d.height;
			a.getContext("2d").drawImage(d, 0, 0);
			var e = Math.round(b * d.height / d.width);
			util.scaleCanvas(a, b, e);
			c(a.toDataURL())
		};
		d.src = a
	},
	blurCanvas: function(a, b) {
		var c = document.createElement("canvas");
		c.width = a.width;
		c.height = a.height;
		var d = c.getContext("2d");
		b = Math.round(b);
		var f = b / 6,
			e = 1 / (f * Math.sqrt(2 * Math.PI)),
			g = 0;
		d.globalCompositeOperation = "lighter";
		for (var h = -b; h < b + 1; h++)
			g += e * Math.exp(-(h * h) / (2 * f * f)), d.globalAlpha = e * Math.exp(-(h * h) / (2 * f * f)), d.drawImage(a, h, 0);
		a = c;
		c = document.createElement("canvas");
		c.width = a.width;
		c.height = a.height;
		d = c.getContext("2d");
		d.globalCompositeOperation = "lighter";
		for (g = - b; g < b + 1; g++)
			d.globalAlpha =
				e * Math.exp(-(g * g) / (2 * f * f)), d.drawImage(a, 0, g);
		return c
	},
	scaleCanvas: function(a, b, c) {
		a = util.blurCanvas(a, 1 * a.width / b);
		for (var d = a.getContext("2d"), f = d.getImageData(0, 0, a.width, a.height), e = 3; e < f.data.length; e += 4)
			f.data[e] = 255;
		e = {
			height: f.height,
			width: b,
			data: Array(4 * f.height * b)
		};
		util.doScaleX_(f, e);
		e = util.transpose_(e);
		f = {
			height: e.height,
			width: c,
			data: Array(4 * e.height * c)
		};
		util.doScaleX_(e, f);
		f = util.transpose_(f);
		a.width = b;
		a.height = c;
		d = a.getContext("2d");
		b = d.getImageData(0, 0, b, c);
		for (e = 0; e < b.data.length; e++)
			c =
				f.data[e], b.data[e] = 0 > c ? 0 : 255 < c ? 255 : Math.round(c);
		d.putImageData(b, 0, 0);
		return a
	},
	transpose_: function(a) {
		for (var b = {
			width: a.height,
			height: a.width,
			data: Array(a.data.length)
		}, c = 0; c < a.width; c++)
			for (var d = 0; d < a.height; d++) {
				var f = 4 * (d * a.width + c),
					e = 4 * (c * a.height + d);
				b.data[e] = a.data[f];
				b.data[e + 1] = a.data[f + 1];
				b.data[e + 2] = a.data[f + 2];
				b.data[e + 3] = a.data[f + 3]
			}
		return b
	},
	LANCZOS_SIZE: 3,
	lanczosKernel_: function(a) {
		0 > a && (a = -a);
		if (1E-10 > a)
			return 1;
		if (a >= util.LANCZOS_SIZE)
			return 0;
		a *= Math.PI;
		return util.LANCZOS_SIZE *
			Math.sin(a) * Math.sin(a / util.LANCZOS_SIZE) / (a * a)
	},
	doScaleX_: function(a, b) {
		//if (a.height !== b.height)
			//console.error("The height does not match in one-dimension scale.");
		//else
		if (a.height === b.height)
			for (var c = (b.width - 1) / (a.width - 1), d = 0, f = 0; f < b.height; f++)
				for (var e = 0; e < b.width; e++) {
					var g = e / c;
					b.data[d] = 0;
					b.data[d + 1] = 0;
					b.data[d + 2] = 0;
					for (var h = b.data[d + 3] = 0, j = Math.ceil(g - util.LANCZOS_SIZE); j < g + util.LANCZOS_SIZE; j += 1)
						if (0 <= j && j < a.width) {
							var l = 4 * (f * a.width + j),
								k = util.lanczosKernel_(j - g),
								h = h + k;
							b.data[d] += k * a.data[l];
							b.data[d + 1] += k * a.data[l +
								1];
							b.data[d + 2] += k * a.data[l + 2];
							b.data[d + 3] += k * a.data[l + 3]
						}
					b.data[d] /= h;
					b.data[d + 1] /= h;
					b.data[d + 2] /= h;
					b.data[d + 3] /= h;
					d += 4
				}
	},
	rgbToHsl: function(a) {
		var b = a[0],
			c = a[1];
		a = a[2];
		b /= 255;
		c /= 255;
		a /= 255;
		var d = Math.max(b, c, a),
			f = Math.min(b, c, a),
			e = (d + f) / 2,
			g;
		if (d === f)
			g = f = 0;
		else {
			var h = d - f,
				f = 0.5 < e ? h / (2 - d - f) : h / (d + f);
			switch (d) {
				case b:
					g = (c - a) / h + (c < a ? 6 : 0);
					break;
				case c:
					g = (a - b) / h + 2;
					break;
				case a:
					g = (b - c) / h + 4
			}
			g /= 6
		}
		return [g, f, e]
	},
	hslToRgb: function(a) {
		function b(a, b, c) {
			0 > c && (c += 1);
			1 < c && (c -= 1);
			return c < 1 / 6 ? a + 6 * (b - a) * c : 0.5 > c ? b : c <
				2 / 3 ? a + 6 * (b - a) * (2 / 3 - c) : a
		}
		var c = a[0],
			d = a[1];
		a = a[2];
		if (0 === d)
			d = a = c = a;
		else {
			var f = 0.5 > a ? a * (1 + d) : a + d - a * d,
				e = 2 * a - f,
				d = b(e, f, c + 1 / 3);
			a = b(e, f, c);
			c = b(e, f, c - 1 / 3)
		}
		return [255 * d, 255 * a, 255 * c]
	},
	rgbToCss: function(a) {
		for (var b = "#", c = 0; 3 > c; c++) {
			var d = Math.round(a[c]).toString(16);
			1 === d.length && (d = "0" + d);
			b += d
		}
		return b
	},
	sendEventToAllWindows: function(a) {
		for (var b = chrome.extension.getViews(), c = 0; c < b.length; c++)
			doc = b[c].jQuery.event.trigger(a)
	}
};

function Weather(a) {
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
			c = a["location-name"];
		Date.now() - b.date > this.delay_ && this.requestNewWeather_();
		this.ui_.reset();
		this.ui_.setAddress(c);
		this.ui_.setDate(this.getDateString_(b.date));
		this.ui_.setIcon(b.icon);
		this.ui_.setCurrentConditions(b.temperature, b.condition, b.wind, b.humidity);
		for (c = 0; c < b.forecast.length; c++) {
			var d = b.forecast[c];
			this.ui_.addForecast(d.day, d.icon,
				d.high, d.low, d.condition)
		}
		//a["location-permission"] || this.ui_.showPermissionConfirmation(this.permitGeolocation_.bind(this))
	}
};
/*Weather.prototype.permitGeolocation_ = function() {
	chrome.storage.local.set({
		"location-permission": true
	}, function() {
		chrome.runtime.getBackgroundPage(function(a) {
			a.weatherFetcher.startWeatherRetrieval()
		})
	})
};*/
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

function AppsUI(a) {
	this.analytics_ = a
}
AppsUI.prototype.show = function() {
	this.analyticsForPromo_();
	"cros" === util.getOS() ? $("#apps-list").hide() : ($("#apps-list a").remove(), chrome.management.getAll(this.onAppsListReceived_.bind(this)))
};
AppsUI.prototype.analyticsForPromo_ = function() {
	for (var a = $("#promoted-services a"), b = 0; b < a.length; b++)
		a[b].onclick = this.analytics_.trackLink.bind(this.analytics_, a[b], "promoted-services")
};
AppsUI.prototype.onAppsListReceived_ = function(a) {
	var b = $('<a href="https://chrome.google.com/webstore"><img src="chrome://extension-icon/ahfgeienlihckogmohjhadlkjgocpleb/64/1"><div class="icon-title">Chrome Web Store</div></a>');
	this.analytics_.wrapLink(b[0], "webstore");
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
			c = this.createAppButton_(c.id, c.name, d.url);
			$("#apps-list").append(c)
		}
	}
};
AppsUI.prototype.createAppButton_ = function(a, b, c) {
	c = $('<a href="" class="closable-button"><img src="' + c + '"><div class="icon-title">' + b + '</div><div class="close-button" title="' + chrome.i18n.getMessage('remove') + '"></div></a>');
	c.click(function() {
		this.analytics_.track("app", "");
		chrome.management.launchApp(a);
		return !1
	}.bind(this));
	c.find(".close-button").click(function() {
		this.analytics_.track("app-uninstall", b);
		chrome.management.uninstall(a, {
			showConfirmDialog: !0
		}, this.show.bind(this));
		return !1
	}.bind(this));
	return c
};

function MostVisitedUI(a, b, c) {
	this.analytics_ = a;
	this.undoCallback_ = b;
	this.unblockAllCallback_ = c
}
MostVisitedUI.prototype.reset = function() {
	$(".most-visited-box").remove();
	$("#undo-block-most-visited").unbind();
	$("#undo-block-most-visited").click(function() {
		this.analytics_.track("most-visited-confirmation", "undo");
		this.undoCallback_();
		this.hideUndoBar_();
		return !1
	}.bind(this));
	$("#unblock-all-most-visited").unbind();
	$("#unblock-all-most-visited").click(function() {
		this.analytics_.track("most-visited-confirmation", "undo-all");
		this.unblockAllCallback_();
		this.hideUndoBar_();
		return !1
	}.bind(this));
	$("#block-most-visited-confirmation .close-button").unbind();
	$("#block-most-visited-confirmation .close-button").click(function() {
		//console.log("close");
		this.analytics_.track("most-visited-confirmation", "close");
		this.hideUndoBar_(this)
	}.bind(this))
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
MostVisitedUI.prototype.addThumbnailButton = function(a, b, c, d) {
	var f = $('<a class="most-visited-box most-visited-domain-' + a.replace(/\./g, "-") + '"></a>');
	f.attr("title", c);
	f.attr("href", c);
	c = $('<div class="most-visited-thumbnail closable-button"><div class="most-visited-domain"></div><img class="most-visited-icon"><div class="close-button" title="' + chrome.i18n.getMessage('remove') + '"></div></div>');
	c.find(".most-visited-domain").text(a);
	c.find(".close-button").click(function() {
		d();
		this.showUndoBar_();
		return !1
	}.bind(this));
	a = $('<div class="most-visited-title"></div>');
	a.text(b);
	f.append(c);
	f.append(a);
	this.analytics_.wrapLinkNoHref(f[0], "most-visited");
	$("#most-visited-container").append(f);
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
MostVisitedUI.prototype.hideUndoBar_ = function() {
	$("#block-most-visited-confirmation").addClass("hidden")
};
MostVisitedUI.prototype.showUndoBar_ = function() {
	$("#block-most-visited-confirmation").removeClass("hidden")
};

function NewsUI(a) {
	this.analytics_ = a;
	var b;
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
	this.analytics_.wrapLinkNoHref(a.find("h2")[0], "news-heading");
	$("#box-news").append(a)
};
NewsUI.prototype.add = function(a, b, c) {
	c = this.formatter_.format(c);
	a = a.match(/(.+) -( .+)/)
	a = $('<div class="news-item"><div class="news-time">' + c.replace(':', '') + '</div><a href="' + b + '">' + a[1] + "<span class='news-publisher'>"+a[2]+"</span></a></div>");
	this.analytics_.wrapLinkNoHref(a.find("a")[0], "news");
	$("#news-container").append(a)
};
NewsUI.prototype.addMoreLink = function() {
	var a = $('<div class="news-item" id="news-more"><a href="' + chrome.i18n.getMessage('serviceURL', ['', 'news']) + '">' + chrome.i18n.getMessage('moreNews') + '</a></div>');
	this.analytics_.wrapLinkNoHref(a.find("a")[0], "news-more");
	$("#news-container").append(a)
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
	a != this.val_ && (this.val_ = a, this.pendingSuggest_ && this.pendingSuggest_.cancel(), this.pendingSuggest_ = new SuggestRequest(a), this.pendingSuggest_.sendRequest(this.onSuggestReceived_.bind(this)))
};
SearchBox.prototype.onSuggestReceived_ = function(a) {
	this.suggestBox_.reset();
	for (var b = 0; b < a.length; b++)
		this.suggestBox_.add(a[b]);
	0 < a.length && this.suggestBox_.show(this.onSuggestionClick_.bind(this))
};
SearchBox.prototype.onSuggestionClick_ = function(a) {
	this.navigateToGoogle_(a)
};
SearchBox.prototype.onFocus_ = function() {
	this.input_.hasClass("empty") && (this.input_.val(""), this.input_.removeClass("empty"))
};
SearchBox.prototype.onBlur_ = function() {
	"" === this.input_.val() && (this.input_.addClass("empty"), this.input_.val(chrome.i18n.getMessage('search')))
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
	b.text(a);
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

function WeatherUI(a) {
	this.analytics_ = a;
	this.box_ = $("#box-weather");
	this.analytics_.wrapLink(this.box_.find("a")[0], "weather");
	this.link_ = chrome.i18n.getMessage('searchURL', ['', chrome.i18n.getMessage('weather')]);
	this.coolWeather = false
	chrome.storage.local.get({'use-cool-weather': false}, function(val){
			if (val['use-cool-weather']) {
				this.coolWeather = true
				$('#coolWeather').find('input[type=checkbox]').prop('checked', true)
			}
	}.bind(this))
	chrome.storage.local.get({'weather-unit': chrome.i18n.getMessage('temperatureUnit')}, function(val){
			var unit = val['weather-unit'] == 'C'
			$('#unitSlider').find('input[type=checkbox]').prop('checked', unit)
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
	if (this.coolWeather && a.search('night') == -1)
		a = a.replace('weather', 'cool weather')
	this.box_.find("#weather-current-icon").error(function() {
		//console.log('Unknown weather state: ' + a)
		$(this).attr("src", "images/weather/unknown.png")
	}).attr("src", a)
};
WeatherUI.prototype.setCurrentConditions = function(a, b, c, d) {
	this.box_.find("#weather-temperature").text(a);
	this.box_.find("#weather-condition").text(b);
	var wind = c.match(/.+ (\d+) (.+)/)
	humidity = d.match(/(\w+): (\d+)/)
	this.box_.find("#weather-wind").text(wind[1]).append('<sup>'+wind[2]+'</sup>').attr('title', wind[0])
	this.box_.find("#weather-humidity").text(humidity[2]+'%').attr('title', humidity[1])
};
WeatherUI.prototype.addForecast = function(a, b, c, d, f) {
	if (this.coolWeather && b.search('night') == -1)
		b = b.replace('weather', 'cool weather')
	a = $('<div class="weather-forecast"><div>' + a + '</div><a href=""><img src="' + b + '" title="' + f + '"></a><div><span class="temperature-high">' + c + '</span> <span class="temperature-low">' + d + "</span> </div></div");
	a.find("a").attr("href", this.link_);
	this.analytics_.wrapLink(a.find("a")[0], "weather-forecast");
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
}