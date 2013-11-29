"use strict"
function NewsFetcher() {
	this.retryDelay_ = 1000;
	this.interval_ = null;
}

NewsFetcher.prototype.init = function() {
	clearInterval(this.interval_);
	this.interval_ = setInterval(this.startRetrieval.bind(this), 900 * 1000);
	this.startRetrieval();
};

NewsFetcher.prototype.startRetrieval = function() {
	//console.log('Requesting news from RSS.');
	var request = $.get(
	chrome.i18n.getMessage('serviceURL', ['s', 'news']) + 'news/feeds?pz=1&hl=' + chrome.i18n.getMessage('@@ui_locale') + '&output=rss',
		this.storeFromRss_.bind(this),
		'xml');
	request.fail(this.onError_.bind(this, request));
};

NewsFetcher.prototype.onError_ = function(jqxhr) {
	/*console.error('Failed news request. readyState:', jqxhr.readyState,
		'status:', jqxhr.status);*/
	setTimeout(this.startRetrieval.bind(this), this.retryDelay_);
	this.retryDelay_ = util.updateRetryDelay(this.retryDelay_);
};

NewsFetcher.prototype.storeFromRss_ = function(xmlDoc) {
	this.retryDelay_ = 1000;

	var rss = $(xmlDoc);
	var items = rss.find('item');
	//console.log('Got ' + items.length + ' news at', new Date());
	var news = [];
	news.date = Date.now();
	for (var i = 0; i < items.length; i++) {
		var item = $(items[i]);
		var title = item.find('title').text();
		var url = item.find('link').text();
		var date = (new Date(item.find('pubDate').text())).valueOf();
		news.push({'title': title, 'url': url, 'date': date});
	}

	chrome.storage.local.set(
		{news: news},
	util.sendEventToAllWindows.bind(null, 'news-loaded'));
};

var newsFetcher = new NewsFetcher();
window.addEventListener('load', newsFetcher.init.bind(newsFetcher));
