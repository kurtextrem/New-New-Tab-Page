/* global console,Intl,qwest */
+function (window, $, $ajax) {
	'use strict';

	function Module() {
		this.html = ''
		this.ui_ = new ModuleUI('#box-' + this.name)
	}

	Module.prototype.name = 'news'

	Module.prototype.storageKeys = [{
		name: 'news',
		type: {
			date: 0
		}
	}, {
		name: 'newsHTML',
		type: ''
	}]

	Module.prototype.init = function (obj) {
		this.html = obj[this.name + 'HTML']
		if (window.App.now - obj[this.name].date > 9E5)
			this.update()
		else
			this.showCached(this.html || obj[this.name])
	}

	Module.prototype.update = function () {
		console.log('Requesting ' + this.name)
		$ajax.get('https://news.google.com/news/feeds', {
			output: 'rss',
			pz: '1',
			hl: chrome.i18n.getMessage('@@ui_locale')
		}, {
			type: 'xml'
		}).success(this.success.bind(this)).error(this.error.bind(this))
	}

	Module.prototype.showCached = function (data) {
		console.log('Showing cached ' + this.name)
		this.updateUI(data)
	}

	Module.prototype.success = function (xmlDoc) {
		var items = xmlDoc.getElementsByTagName('item'),
		data = { entries: [] }
		console.log('Got ' + items.length + ' ' + this.name)
		data.date = window.App.now
		data.title = xmlDoc.querySelector('title').innerHTML
		data.url = xmlDoc.querySelector('link').innerHTML
		for (var i = 0; i < items.length; i++) {
			var item = items[i]
			var img = item.getElementsByTagName('description')[0].textContent.match(/<img src="([^"]+)"/)
			if (img !== null)
				img = img[1]
			data.entries[i] = {
				title: item.getElementsByTagName('title')[0].innerHTML,
				url: item.getElementsByTagName('link')[0].innerHTML,
				date: (new Date(item.getElementsByTagName('pubDate')[0].innerHTML)).valueOf(),
				img: img
			}
		}

		chrome.storage.local.set({
			news: data
		}, this.updateUI.bind(this, data))
	}

	Module.prototype.error = function (message) {
		console.error('Failed ' + this.name + ' request. ' + message)
		if (this.html)
			this.showCached(this.html)
	}

	Module.prototype.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)
		var length = Math.min(6, data.entries.length)
		this.ui_.addHeading(data.url, data.title)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].img)
		//this.ui_.addMoreLink(news.url)
		this.ui_.addToDOM()
	}

	var ModuleUI = function (name) {
		this.formatter_ = Intl.DateTimeFormat([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: false
		})
		this.html = ''
		this.content = name + ' > .box__content'
	}

	ModuleUI.prototype.addHeading = function (url, title) {
		this.html += '<div class="box__item box__caption"><h2><a href="' + url + '">' + title + '</a></h2></div>'
	}

	ModuleUI.prototype.addHTML = function (title, url, date, img) {
		date = this.formatter_.format(date)
		title = title.split(' - ')
		var source = title.pop()
		title = title.join(' - ').replace(' - FAZ', '')
		this.html += '<div class="box__item row"><div class="box__img col-lg-3"><img src="' + img + '" onerror="this.remove()"></div><div class="box__item__title col-lg-9"><div><a href="' + url + '">' + title + '</a></div><span class="box__author">' + date + ' &ndash;  ' + source + '</span></div></div>'
	}

	ModuleUI.prototype.addMoreLink = function (url) {
		this.html += '<div class="box__item box__caption"><a href="' + url + '">' + chrome.i18n.getMessage('moreNews') + '</a></div>'
	}

	ModuleUI.prototype.addToDOM = function (html) {
		html = html || this.html || 1
		$(this.content).html(html)
		chrome.storage.local.set({
			newsHTML: html
		})
	}

	//ModuleUI = window.App.ModuleUI.extend(ModuleUI)

	window.App.register(new Module()) // without new
}(window, $, qwest)
