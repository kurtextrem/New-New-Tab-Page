+function (window, $, $ajax) {
	'use strict';

	var Module = function () {
		this.retryDelay_ = 1000
	}

	Module.prototype.name = 'news'

	Module.prototype.storageKeys = [{
		name: 'news',
		type: null
	}]

	Module.prototype.init = function (obj) {
		if (window.App.now - obj.news.date > 9E5)
			this.startRetrieval()
		return window.setInterval(function () {
			this.startRetrieval()
		}.bind(this), 15 * 60000)
	}

	Module.prototype.startRetrieval = function () {
		//console.log('Requesting news from RSS.');
		$ajax.get(chrome.i18n.getMessage('serviceURL', ['s', 'news']) + 'news/feeds', {
			output: 'rss',
			pz: '1',
			hl: chrome.i18n.getMessage('@@ui_locale')
		}, {
			type: 'xml'
		}).success(this.storeFromRss_.bind(this)).error(this.onError_.bind(this))
	}

	Module.prototype.onError_ = function (message) {
		console.error('Failed news request.' + message)
		/*this.retryDelay_ = util.updateRetryDelay(this.retryDelay_)
		setTimeout(this.startRetrieval.bind(this), this.retryDelay_)*/
	}

	Module.prototype.storeFromRss_ = function (xmlDoc) {
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
			news.push({
				title: title,
				url: url,
				date: date,
				img: img
			})
		}

		chrome.storage.local.set({
			news: news
		}, this.updateUI.bind(this, news))
	}

	window.App.register(new Module())
}(window, $, qwest)
