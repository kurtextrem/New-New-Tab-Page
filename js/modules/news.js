+ function (window, $, $ajax) {
	'use strict';

	function Module() {
		this.retryDelay_ = 1000
		this.html = ''
		this.ui_ = new ModuleUI()
	}

	Module.prototype.name = 'news'

	Module.prototype.storageKeys = [{
		name: 'news',
		type: {
			date: 0
		}
	}]

	Module.prototype.init = function (obj) {
		if (window.App.now - obj.news.date > 9E5)
			this.startRetrieval()
		else
			this.showCached(obj.news)
	}

	Module.prototype.startRetrieval = function () {
		console.log('Requesting news from RSS.');
		$ajax.get('https://news.google.com/news/feeds', {
			output: 'rss',
			pz: '1',
			hl: chrome.i18n.getMessage('@@ui_locale')
		}, {
			type: 'xml'
		}).success(this.storeFromRss_.bind(this)).error(this.onError_.bind(this))
	}

	Module.prototype.showCached = function (news) {
		console.log('Showing cached news.')
		this.updateUI(news)
	}

	Module.prototype.onError_ = function (message) {
		console.error('Failed news request.' + message)
		/*this.retryDelay_ = util.updateRetryDelay(this.retryDelay_)
		setTimeout(this.startRetrieval.bind(this), this.retryDelay_)*/
	}

	Module.prototype.storeFromRss_ = function (xmlDoc) {
		this.retryDelay_ = 1000

		var items = xmlDoc.getElementsByTagName('item')
		//console.log('Got ' + items.length + ' news at', new Date());
		var news = []
		news.date = Date.now()
		for (var i = 0; i < items.length; i++) {
			var item = items[i]
			var title = item.getElementsByTagName('title')[0].innerHTML
			var url = item.getElementsByTagName('link')[0].innerHTML
			var date = (new Date(item.getElementsByTagName('pubDate')[0].innerHTML)).valueOf()
			var img = item.getElementsByTagName('description')[0].textContent.match(/<img src="([^"]+)"/)
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

	Module.prototype.updateUI = function (news) {
		this.ui_.reset()
		var length = Math.min(6, news.length)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(news[i].title, news[i].url, news[i].date, news[i].img)
		this.ui_.addMoreLink()
		this.ui_.addToDOM()
	}

	function ModuleUI() {
		this.formatter_ = Intl.DateTimeFormat([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: false
		})
	}

	ModuleUI.prototype.reset = function () {
		$('#news-container').empty()
	}

	ModuleUI.prototype.addHeading = function () {
		this.html += '<div class="news-item" id="news-heading"><h2>' + chrome.i18n.getMessage('news') + '</h2></div>'
	}

	ModuleUI.prototype.addHTML = function (title, url, date, img) {
		date = this.formatter_.format(date)
		title = title.split(' - ')
		var source = title.pop()
		title = title.join(' - ').replace(' - FAZ', '')
		this.html += '<div class="news-item row"><div class="news-img col-lg-3"><img src="' + img + '"></div><div class="news-title col-lg-9"><div><a href="' + url + '">' + title + '</a></div><span class="news-publisher">' + date + ' &ndash;  ' + source + '</span></div></div>'
	}

	ModuleUI.prototype.addMoreLink = function () {
		this.html += '<div class="news-item" id="news-more"><a href="' + chrome.i18n.getMessage('serviceURL', ['', 'news']) + '">' + chrome.i18n.getMessage('moreNews') + '</a></div>'
	}

	ModuleUI.prototype.addToDOM = function () {
		$('#news-container').append(this.html)
	}

	window.App.register(new Module())
}(window, $, qwest)
