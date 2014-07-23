/* global Notification,console,Intl */
+function (window) {
	'use strict';

	var TIME = 5,
		URL = 'https://mail.google.com/mail/feed/atom',
		PARAMS = {},
		TYPE = {
			type: 'xml'
		}

	var Module = {}

	/** @see ntp.js */
	Module.name = 'gmail'

	Module.storageKeys = [{
		name: 'gmail',
		type: {
			count: 0,
			date: 0
		}
	}, {
		name: 'gmailHTML',
		type: ''
	}]

	/** @see ntp.js */
	Module.init = function (obj) {
		this.requestPermission(function () {})
		this.count = obj[this.name].count
		this.permission = 0

		this.ui_ = new ModuleUI('#box-' + this.name)
		this._super(obj, TIME)
	}

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
		// xhr.open("GET", url, true,"u","1");
	}

	/** @see ntp.js */
	Module.success = function (xmlDoc) {
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
				date: (new Date(item.getElementsByTagName('modified')[0].innerHTML)).valueOf(),
				author: item.getElementsByTagName('author')[0]
			}
		}

		if (data.count !== this.count)
			this.requestPermission(this.showNotification.bind(this, data.count > this.count ? data.count - this.count : data.count, data.count))

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
			icon: 'https://cdn1.iconfinder.com/data/icons/free-colorful-icons/128/gmail.png'
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
		notification.onclose = function () {}
	}

	/** @see ntp.js */
	Module.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)
		var length = Math.min(8, data.entries.length)
		this.ui_.addHeading(data.count, data.title)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].author)
		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = function (name) {
		this.formatter_ = Intl.DateTimeFormat(window.App.lang, {
			year: '2-digit',
			month: '2-digit',
			day: 'numeric',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit'
		})
		this._super(name)
	}

	/** @see ntp.js */
	ModuleUI.addHeading = function (count, title) {
		this.html += '<div class="box__item box__caption"><h2><a href="http://mail.google.com/mail">' + title + ' (' + count + ')</a></h2></div>'
	}

	/** @see ntp.js */
	ModuleUI.addHTML = function (title, url, date, author) {
		var dateObj = new Date(date),
			dateDay = dateObj.getDay()
			if (dateObj.toDateString() === new Date(window.App.now).toDateString())
				date = 'Today'
			else if (new Date(dateObj.valueOf() - 86400000).getDay() === dateDay - 1)
				date = 'Yesterday'
			else if (new Date(dateObj.valueOf() - 86400000 * 2).getDay() === dateDay - 2)
				date = 'The day before yesterday'

		if (typeof date === 'number')
			date = this.formatter_.format(date)
		else
			date = date + ', ' + ('0' + dateObj.getHours()).slice(-2) + ':' + ('0' + dateObj.getMinutes()).slice(-2)
		this.html += '<div class="box__item row"><div class="box__item__title col-lg-12"><div><a href="' + url + '">' + title + '</a></div><span class="box__author" title="' + author.getElementsByTagName('email')[0].innerHTML + '">' + date + ' &ndash;  ' + author.getElementsByTagName('name')[0].innerHTML + '</span></div></div>'
	}

	/** @see ntp.js */
	ModuleUI.addToDOM = function (html) {
		chrome.storage.local.set({
			gmailHTML: this._super(html)
		})
	}

	ModuleUI = window.App.ModuleUI.extend(ModuleUI)

	window.App.register(Module)
}(window)
