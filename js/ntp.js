+function (window, $, $ajax) {
	'use strict';

	var App = function () {
		this.now = $.now()

		this.checkResolution()
		this.addMissingDOM()
		this.loadBoxes()
		$.fn.ready(function () {
			window.setTimeout(this.addClasses.bind(this), 400)
		}.bind(this))
	}

	App.prototype.addMissingDOM = function () {
		$('#mngb').append('<div><div style="float:left;padding-left:10px;height:60px;min-width:0;padding-left:10px" class="gb_Z gb_Ac gb_e gb_Dc"><img alt="Chrome" src="chrome-search://theme/IDR_PRODUCT_LOGO"></div></div>')
	}

	App.prototype.loadBoxes = function () {
		$ajax.get(chrome.extension.getURL('boxes.html')).success(function (body) {
			$('body').append(body)
			this.bootUI()
		}.bind(this))
	}

	App.prototype.bootUI = function () {
		this.weather_ = this.weather.init()
		this.apps_ = this.apps.init()
		this.recentlyClosed_ = this.recentlyClosed.init()
		this.news_ = this.news.init()
		this.gmail_ = this.gmail.init()
	}

	App.prototype.checkResolution = function () {
		if (screen.availWidth < 1380) {
			$('#main-cards > .row > .col-lg-3').removeClass('col-lg-offset-1').addClass('col-lg-4')
			$('.mv-row').addClass('col-lg-12')
		}
	}

	App.prototype.addClasses = function () {
		$('#most-visited').addClass('container-fluid')
			.find('#mv-tiles').addClass('row').css('width', 'auto')
			.find('.mv-row').addClass('col-lg-6')
	}

	var weather = App.prototype.weather = {
		// copy Code
	}

	weather.init = function () {

	}

	var apps = App.prototype.apps = {
		// copy Code
	}

	apps.init = function () {

	}

	var recentlyClosed = App.prototype.recentlyClosed = {
		// session API
	}

	recentlyClosed.init = function () {

	}

	var news = App.prototype.news = {
		retryDelay_: 1000
	}

	news.init = function () {
		this.addListener()
		chrome.storage.local.get({
			news: null
		}, function (obj) {
			if (App.now - obj.news.date > 9E5)
				this.startRetrieval()
		}.bind(this))
		return window.setInterval(function () {
			this.startRetrieval()
		}.bind(this), 15 * 60000)
	}

	news.addListener = function () {
		chrome.idle.onStateChanged.addListener(function () {
			chrome.storage.local.get({
				news: null
			}, function (obj) {
				obj = obj.news
				if (!obj || 0 === obj.length || 9E5 < App.now - obj.date) // 900 000 ms / 15 min
					this.startRetrieval()
			}.bind(this))
		}.bind(this))
	}

	news.startRetrieval = function () {
		//console.log('Requesting news from RSS.');
		$ajax.get(chrome.i18n.getMessage('serviceURL', ['s', 'news']) + 'news/feeds', {
			output: 'rss',
			pz: '1',
			hl: chrome.i18n.getMessage('@@ui_locale')
		}, {
			type: 'xml'
		}).success(this.storeFromRss_.bind(this)).error(this.onError_.bind(this))
	}

	news.onError_ = function (message) {
		console.error('Failed news request.' + message)
		/*this.retryDelay_ = util.updateRetryDelay(this.retryDelay_)
		setTimeout(this.startRetrieval.bind(this), this.retryDelay_)*/
	}

	news.storeFromRss_ = function (xmlDoc) {
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

	var gmail = App.prototype.gmail = {
		instanceID: null
	}

	gmail.init = function () {
		chrome.storage.local.get({
			gmailID: null,
			gmailLastUpdate: null,
			gmailCount: 0
		}, function (obj) {
			if (!obj.gmailID) {
				this.instanceID = 'gmc' + parseInt(Date.now() * Math.random(), 10)
				chrome.storage.local.set({
					gmailID: obj.gmailID
				})
			}
			this.gmailCount = obj.gmailCount
			this.gmailLastUpdate = obj.gmailLastUpdate
			if (App.now - this.gmailLastUpdatec > 5 * 60000)
				this.update()
		}.bind(this))
		return window.setInterval(function () {
			this.startRetrieval()
		}.bind(this), 5 * 60000)
	}

	gmail.update = function () {
		$ajax.get('https://mail.google.com/mail/feed/atom', {
			zx: this.instanceID
		}, {
			type: 'xml'
		}).success(function (res) {
			chrome.storage.local.set({
				gmailLastUpdate: App.now,
				gmailCount: this.parseData(res)
			})
		}.bind(this)).error(this.error_.bind(this))
		// xhr.open("GET", url, true,"u","1");
	}


	gmail.parseData = function (xmlDoc) {
		var items = xmlDoc.querySelectorAll('item'),
			count = items.querySelectorAll('entry > summary').length

			/*var GmailData = {
			'summary': $xml.find('entry').find('summary'),
			'title': $xml.find('entry').find('title'),
			'count': $xml.find('fullcount'),
			'sub_title': $xml.find('title'),
			'name': $xml.find('entry').find('author').find('name'),
			'email': $xml.find('entry').find('author').find('email'),
			'url': $xml.find('entry').find('link')
		}*/

		if (count) {
			var opt = {
				type: 'basic',
				title: 'You have new unread emails',
				message: count + ' new email.',
				iconUrl: 'chrome://extension-icon/pjkljhegncpnkpknbcohdijeoejaedia/128/0'
			}
			chrome.notifications.create('gmail-notification', opt, function (ID) {
				chrome.notifications.onClicked.addListener(function (a) {
					chrome.tabs.create({
						//url: 'http://gmail.com'
					})

					chrome.notifications.clear(a, function () {})
				})
			})
		}
		return count
	}

	window.App = new App()
}(window, $, qwest)
