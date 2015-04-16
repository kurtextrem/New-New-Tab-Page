/* global console */
+function (window) {
	'use strict';

	/**
	 * Constants used in the constructor.
	 */
	var TIME = 15,
		URL = 'https://news.google.com/news/feeds',
		PARAMS = {
			output: 'rss',
			pz: '1',
			hl: chrome.i18n.getMessage('@@ui_locale')
		},
		TYPE = {
			responseType: 'xml'
		}

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
			amount: 6
		}
	}]

	/** @see ntp.js */
	Module.init = function (obj) {
		this.ui_ = new ModuleUI('#box-' + this.name, obj[this.name + 'Options'])
		this._super(obj, TIME)
	}

	/** @see ntp.js */
	Module.update = function () {
		//this._super(URL, PARAMS, TYPE)
	}

	/** @see ntp.js */
	Module.success = function (xmlDoc) {
		var items = xmlDoc.getElementsByTagName('item'),
			data = {
				entries: []
			}
		console.log('Got ' + items.length + ' ' + this.name)

		data.date = window.App.now
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
			return this.ui_.addToDOM(data)

		this.ui_.addHeading(data.url, data.title, data.date)
		this.ui_.buildContent(data.entries)

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
		this._super('<a href="' + url + '">' + title + '</a>', new Date(date))
	}

	/** @see ntp.js */
	ModuleUI.buildContent = function (data) {
		var length = Math.min(this.options.amount, data.length)
		for (var i = 0; i < length; i++)
			this._addHTML(data[i].title, data[i].url, data[i].date, data[i].img)
	}

	/** @see ntp.js */
	ModuleUI._addHTML = function (title, url, date, img) {
		title = title.split(' - ')
		var source = title.pop()
		title = title.join(' - ').replace(' - FAZ', '')
		date = new Date(date)
		this.html += '<div class="box__item row"><div class="box__img col-lg-3"><img src="' + img + '" onerror="this.remove()"></div><div class="box__item--title col-lg-9"><div><a href="' + url + '">' + title + '</a></div><span class="box__author"><time datetime="' + date.toISOString() + '" title="' + date.toLocaleString() + '" is="relative-time">' + window.App.prettyDate(date) + '</time> &ndash;  ' + source + '</span></div></div>'
	}

	/** @see ntp.js */
	ModuleUI.addToDOM = function (html) {
		chrome.storage.local.set({
			newsHTML: this._super(html)
		})
	}

	/** @see ntp.js */
	ModuleUI = window.App.ModuleUIExtended.extend(ModuleUI)

	/** @see ntp.js */
	window.App.register(Module)
}(window)
