+function(window, $) {
	'use strict';
	function NewsFetcher() {
		this.retryDelay_ = 1000
	}

	NewsFetcher.prototype.init = function() {
		chrome.alarms.create('newsFetcher', {delayInMinutes: 15, periodInMinutes: 15})
		this.startRetrieval()
	}

	NewsFetcher.prototype.addListener = function() {
		chrome.idle.onStateChanged.addListener(function() {
			chrome.storage.local.get({news: null}, function(a) {
				a = a.news
				if (!a || 0 === a.length || 9E5 < Date.now() - a.date) // 900 000 ms / 15 min
					this.startRetrieval()
			}.bind(this))
		}.bind(this))
		chrome.alarms.onAlarm.addListener(function(alarm) {
			if (alarm.name === 'newsFetcher') {
				//console.log('news listener' + new Date())
				this.startRetrieval()
			}
		}.bind(this))
	}

	NewsFetcher.prototype.startRetrieval = function() {
		//console.log('Requesting news from RSS.');
		var request = $.get(chrome.i18n.getMessage('serviceURL', ['s', 'news']) + 'news/feeds', {
				output: 'rss',
				pz: '1',
				hl: chrome.i18n.getMessage('@@ui_locale')
			}, { type: 'xml' }
		).success(this.storeFromRss_.bind(this)).error(this.onError_.bind(this))
	}

	NewsFetcher.prototype.onError_ = function(message) {
		/*console.error('Failed news request. readyState:', jqxhr.readyState,
			'status:', jqxhr.status);*/
		this.retryDelay_ = util.updateRetryDelay(this.retryDelay_)
		setTimeout(this.startRetrieval.bind(this), this.retryDelay_)
	}

	NewsFetcher.prototype.storeFromRss_ = function (xmlDoc) {
		this.retryDelay_ = 1000

		var items = xmlDoc.querySelectorAll('item')
		//console.log('Got ' + items.length + ' news at', new Date());
		var news = []
		news.date = Date.now()
		for (var i = 0; i < items.length; i++) {
			var item = items[i]
			var title = item.querySelectorAll('title')[0].innerHTML
			var url = item.querySelectorAll('link')[0].innerHTML
			var date = (new Date(item.querySelectorAll('pubDate')[0].innerHTML)).valueOf()
			var img = item.querySelectorAll('description')[0].textContent.match(/<img src="([^"]+)"/)
			if (img !== null)
				img = img[1]
			news.push({ title: title, url: url, date: date, img: img })
		}

		chrome.storage.local.set({ news: news }, util.sendEventToAllWindows.bind(null, 'news-loaded'))
	}

	window.newsFetcher = new NewsFetcher()
} (window, qwest);
