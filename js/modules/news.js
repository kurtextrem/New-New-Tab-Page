/* global console,Intl */
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
			type: 'xml'
		}

	/** @see ntp.js */
	var Module = {}

	/** @see ntp.js */
	Module.name = 'news'

	/** @see ntp.js */
	Module.storageKeys = [{
		name: 'news',
		type: {
			date: 0
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
		this._super(URL, PARAMS, TYPE)
	}

	/** @see ntp.js */
	Module.success = function (xmlDoc) {
		var items = xmlDoc.getElementsByTagName('item'),
			data = {
				entries: []
			}
		console.log('Got ' + items.length + ' ' + this.name)
		data.date = window.App.date
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

	/** @see ntp.js */
	Module.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)
		var length = Math.min(6, data.entries.length)
		this.ui_.addHeading(data.url, data.title, data.date)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].img)
		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = {}

	/** @see ntp.js */
	ModuleUI.init = function (name, options) {
		this.formatter = Intl.DateTimeFormat([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: false
		})
		this._super(name, options)
	}

	/** @see ntp.js */
	ModuleUI.addHeading = function (url, title, date) {
		this._super('<a href="' + url + '">' + title + '</a>', date)
	}

	/** @see ntp.js */
	ModuleUI.addHTML = function (title, url, date, img) {
		date = this.formatter.format(date)
		title = title.split(' - ')
		var source = title.pop()
		title = title.join(' - ').replace(' - FAZ', '')
		this.html += '<div class="box__item row"><div class="box__img col-lg-3"><img src="' + img + '" onerror="this.remove()"></div><div class="box__item__title col-lg-9"><div><a href="' + url + '">' + title + '</a></div><span class="box__author">' + date + ' &ndash;  ' + source + '</span></div></div>'
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
