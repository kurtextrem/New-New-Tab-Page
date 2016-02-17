/* global console */
!function (window) {
	'use strict'

	var chrome = window.chrome,
		App = window.App

	/**
	 * Constants used in the constructor.
	 */
	var TIME = 15,
		URL = 'https://news.google.com/news/feeds',
		PARAMS = {
			output: 'rss',
			pz: '1',
			hl: chrome.i18n.getMessage('@@ui_locale'),
			num: 30
		},
		TYPE = {
			responseType: 'xml'
		},
		SHUFFLE = 2

	/** @see ntp.js */
	var Module = {}

	/** @see ntp.js */
	Module.name = 'news'

	/** @see ntp.js */
	Module.storageKeys = [{
		name: 'news',
		type: {
			date: 0,
			title: chrome.i18n.getMessage('news'),
			url: 'https://news.google.com',
			entries: []
		}
	}, {
		name: 'newsHTML',
		type: ''
	}, {
		name: 'newsOptions',
		type: {
			amount: 6,
			shuffle: true
		}
	}]

	/** @see ntp.js */
	Module.init = function (obj) {
		this.ui = new ModuleUI('#box-' + this.name, obj[this.name + 'Options'])
		this.html = obj[this.name + 'HTML']

		if (App.now - obj[this.name].date > TIME * 60000) // true update
			return this.update()

		this.showCached(this.html || obj[this.name])

		if (!this.ui.options.shuffle) return
		chrome.storage.local.get({ news_shuffle: 0 }, function (data) {
			if (App.now - data.news_shuffle > SHUFFLE * 60000) { // shuffle news
				console.log('Shuffling news')
				this.updateUI(obj[this.name])
				chrome.storage.local.set({ news_shuffle: App.now })
			}
		}.bind(this))
	}

	/** @see ntp.js */
	Module.update = function () {
		this._super(URL, PARAMS, TYPE)
	}

	/** @see ntp.js */
	Module.success = function (xhr, xmlDoc) {
		var items = xmlDoc.getElementsByTagName('item'),
			data = {
				entries: []
			}
		console.log('Got ' + items.length + ' ' + this.name, items)

		data.date = App.now
		data.title = xmlDoc.querySelector('title').innerHTML
		data.url = xmlDoc.querySelector('link').innerHTML
		for (var i = 0; i < items.length; i++) {
			var item = items[i],
			img = item.getElementsByTagName('description')[0].textContent.match(/<img src="([^"]+)"/)
			if (img !== null)
				img = img[1]
			data.entries[i] = {
				title: item.getElementsByTagName('title')[0].innerHTML,
				url: item.getElementsByTagName('link')[0].innerHTML,
				date: item.getElementsByTagName('pubDate')[0].innerHTML,
				img: img
			}
		}

		chrome.storage.local.set({
			news: data
		}, this.updateUI.bind(this, data))
	}

	/** @see ntp.js */
	Module.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui.addToDOM(data)

		this.ui.addHeading(data.url, data.title, data.date)
		this.ui.buildContent(data.entries)

		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = {}

	/** @see ntp.js */
	ModuleUI.init = function (name, options) {
		this._super(name, options)
	}

	/** @see ntp.js */
	ModuleUI.addHeading = function (url, title, date) {
		this._super('<a href="' + url + '">' + title + '</a>', date)
	}

	/** @see ntp.js */
	ModuleUI.buildContent = function (data) {
		var options = Math.min(this.options.amount, data.length),
		length = Math.floor(Math.random() * (data.length - options + 1))
		options += length
		for (var i = length; i < options; i++)
			this._addHTML(data[i].title, data[i].url, data[i].date, data[i].img)
	}

	/** @see ntp.js */
	ModuleUI._addHTML = function (title, url, date, img) {
		title = title.split(' - ')
		var source = title.pop()
		title = title.join(' - ').replace(' - FAZ', '')
		date = new Date(date)
		this.html += '<div class="box__item row"><div class="box__img col-lg-3 img-responsive"><img src="' + img + '" onerror="this.remove()"></div><div class="box__item--title col-lg-9"><div><a href="' + url + '">' + title + '</a></div><span class="box__author"><time datetime="' + date.toISOString() + '" title="' + App.prettyDate(date) + '">' + App.prettyTime(date) + '</time> &ndash;  ' + source + '</span></div></div>'
	}

	/** @see ntp.js */
	ModuleUI.addToDOM = function (html) {
		chrome.storage.local.set({
			newsHTML: this._super(html)
		})
	}

	/** @see ntp.js */
	ModuleUI = App.ModuleUIExtended.extend(ModuleUI)

	/** @see ntp.js */
	App.register(Module)
}(window)
