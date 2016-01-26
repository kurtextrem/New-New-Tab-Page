/* global Notification, console */
!function (window) {
	'use strict'

	/**
	 * Constants used in the constructor.
	 */
	var TIME = 5,
		URL = 'https://mail.google.com/mail/feed/atom',
		PARAMS = {},
		TYPE = {
			responseType: 'xml'
		}

	/** @see ntp.js */
	var Module = {}

	/** @see ntp.js */
	Module.name = 'gmail'

	/** @see ntp.js */
	Module.storageKeys = [{
		name: 'gmail',
		type: {
			count: 0,
			date: 0,
			title: chrome.i18n.getMessage('mails'),
			entries: []
		}
	}, {
		name: 'gmailHTML',
		type: ''
	}, {
		name: 'gmailOptions',
		type: {
			amount: 6
		}
	}]

	/** @see ntp.js */
	Module.init = function (obj) {
		this.permission = 0
		this.requestPermission(function () {})
		this.count = obj[this.name].count

		this.ui_ = new ModuleUI('#box-' + this.name, obj[this.name + 'Options'])
		this._super(obj, TIME)
	}

	/**
	 * [requestPermission description]
	 *
	 * @author Jacob Groß (kurtextrem)
	 * @date   2014-07-24
	 * @param  {Function} cb [description]
	 * @return {[type]}      [description]
	 */
	Module.requestPermission = function (cb) {
		if (this.permission)
			return cb()
		Notification.requestPermission(function (status) {
			if (status === 'granted') {
				this.permission = 1
				cb()
			}
		}.bind(this))
	}

	/** @see ntp.js */
	Module.update = function () {
		this._super(URL, PARAMS, TYPE)
	}

	/** @see ntp.js */
	Module.success = function (xhr, xmlDoc) {
		var items = xmlDoc.getElementsByTagName('entry'),
			data = {
				entries: []
			}

		console.log('Got ' + items.length + ' ' + this.name)
		data.date = window.App.now
		data.title = xmlDoc.querySelector('title').innerHTML
		data.count = xmlDoc.getElementsByTagName('fullcount')[0].innerHTML
		for (var i = 0; i < items.length; i++) {
			var item = items[i]
			data.entries[i] = {
				title: item.getElementsByTagName('title')[0].innerHTML,
				url: item.getElementsByTagName('link')[0].attributes.href.value,
				date: item.getElementsByTagName('modified')[0].innerHTML,
				author: item.getElementsByTagName('author')[0]
			}
		}

		console.log('new ' + data.count)
		console.log('old ' + this.count)
		if (data.count > this.count)
			this.requestPermission(this.showNotification.bind(this, data.count >= this.count ? data.count - this.count : data.count, data.count))

		chrome.storage.local.set({
			gmail: data
		}, this.updateUI.bind(this, data))
	}

	/** @see ntp.js */
	Module.showNotification = function (count, total) {
		var opt = {
			tag: 'gmail-notification' + window.App.now,
			lang: window.App.lang,
			title: 'You have ' + count + ' new mail(s)',
			body: count + ' new and a total of ' + total + ' unread mail(s).',
			icon: 'https://cdn1.iconfinder.com/data/icons/free-colorful-icons/128/gmail.png' // @todo: Switch to local image
		},
			notification = new Notification(opt.title, opt)
			notification.onclick = function () {
				window.open('http://mail.google.com/mail')
				notification.close()
			}
		notification.onshow = function () {
			window.setTimeout(function () {
				notification.close()
			}, 15000)
		}
		notification.onerror = function () {
			this.error()
		}.bind(this)
		//notification.onclose = function () {}

		window.addEventListener('unload', function () {
			notification.close()
		}, false)
	}

	/** @see ntp.js */
	Module.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)

		this.ui_.addHeading(data.count, data.title, data.date)
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
	ModuleUI.addHeading = function (count, title, date) {
		this._super('<a href="http://mail.google.com/mail">' + title + ' (' + count + ')</a>', date)
	}

	/** @see ntp.js */
	ModuleUI.buildContent = function (data) {
		var length = Math.min(this.options.amount, data.length)
		for (var i = 0; i < length; i++)
			this._addHTML(data[i].title, data[i].url, data[i].date, data[i].author)
	}

	/** @see ntp.js */
	ModuleUI._addHTML = function (title, url, date, author) {
		date = new Date(date)
		this.html += '<div class="box__item row"><div class="box__item--title col-lg-12"><div><a href="' + url + '">' + title + '</a></div><span class="box__author" title="' + author.getElementsByTagName('email')[0].innerHTML + '"><time datetime="' + date.toISOString() + '" title="' + window.App.prettyDate(date) + '">' + window.App.prettyTime(date) + '</time> &ndash;  ' + author.getElementsByTagName('name')[0].innerHTML + '</span></div></div>'
	}

	/** @see ntp.js */
	ModuleUI.addToDOM = function (html) {
		chrome.storage.local.set({
			gmailHTML: this._super(html)
		})
	}

	/** @see ntp.js */
	ModuleUI = window.App.ModuleUIExtended.extend(ModuleUI)

	/** @see ntp.js */
	window.App.register(Module)
}(window)
