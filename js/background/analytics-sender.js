"use strict"
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38506892-1']);
_gaq.push(['_trackPageview']);

function AnalyticsSender() {
	this.loaded_ = false;
	//this.bookmarksExtensionInstalled_ = false;
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.onload = this.onload_.bind(this);
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);

	//this.checkBookmarksExtension_();
}

AnalyticsSender.prototype.checkBookmarksExtension_ = function() {
	/*chrome.management.get('kcaffnbidpkidalidcbejnhkeklodplg', function(ext) {
		if (ext)
			this.bookmarksExtensionInstalled_ = true;
	}.bind(this));*/
};

AnalyticsSender.prototype.onload_ = function() {
	this.loaded_ = true;
};

AnalyticsSender.prototype.trackPageLoad = function() {
	//console.log('trackPageLoad');
	var url = '/index.html';
	//if (this.bookmarksExtensionInstalled_)
	//	url += '+bookmarks';
	_gaq.push(['_trackPageview', url]);
};

AnalyticsSender.prototype.track = function(category, label) {
	//if (this.bookmarksExtensionInstalled_)
	//	category += '+bookmarks';
	//console.log('track', category, label);
	_gaq.push(['_trackEvent', category, 'click', label]);
};

var analyticsSender = new AnalyticsSender();
