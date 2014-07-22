/* global Notification,console,Intl,qwest */
+function (window, $, $ajax) {
	'use strict';

	function Module() {
		this.retryDelay_ = 1000
		this.permission = 0
		this.ui_ = new ModuleUI('#box-' + this.name)
	}

	Module.prototype.name = 'gmail'

	Module.prototype.storageKeys = [{
		name: 'gmail',
		type: {
			count: 0,
			date: 0
		}
	}, {
		name: 'gmailHTML',
		type: ''
	}]

	Module.prototype.init = function (obj) {
		this.requestPermission(function () {})
		this.count = obj[this.name].count

		if (window.App.now - 0 > 5 * 60000)
			this.update()
		else
			this.showCached(obj[this.name + 'HTML'] || obj[this.name])
	}

	Module.prototype.requestPermission = function (cb) {
		if (this.permission)
			return cb()
		Notification.requestPermission(function (status) {
			this.permission = status === 'granted'
			cb()
		}.bind(this))
	}

	Module.prototype.update = function () {
		$ajax.get('https://mail.google.com/mail/feed/atom', {}, {
			type: 'xml'
		}).success(this.success.bind(this)).error(this.error.bind(this))
		// xhr.open("GET", url, true,"u","1");
	}

	Module.prototype.showCached = function (data) {
		console.log('Showing cached ' + this.name)
		this.updateUI(data)
	}

	Module.prototype.success = function (xmlDoc) {
		var items = xmlDoc.getElementsByTagName('entry'),
			data = { entries: [] }

		console.log('Got ' + items.length + ' ' + this.name)
		data.date = window.App.now
		data.count = items.length
		data.title = xmlDoc.querySelector('title').innerHTML
		data.fullcount = xmlDoc.getElementsByTagName('fullcount')[0].innerHTML
		for (var i = 0; i < data.count; i++) {
			var item = items[i]
			data.entries[i] = {
				title: item.getElementsByTagName('title')[0].innerHTML,
				url: item.getElementsByTagName('link')[0].attributes.href.value,
				date: (new Date(item.getElementsByTagName('modified')[0].innerHTML)).valueOf(),
				author: item.getElementsByTagName('author')[0]
			}
		}

		if (data.count !== this.count)
			this.requestPermission(this.showNotification.bind(this, data.count))
		chrome.storage.local.set({
			gmail: data
		}, this.updateUI.bind(this, data))
	}

	Module.prototype.error = function (message) {
		console.error('Failed mails request. ' + message)
		/*this.retryDelay_ = util.updateRetryDelay(this.retryDelay_)
		setTimeout(this.startRetrieval.bind(this), this.retryDelay_)*/
	}

	Module.prototype.showNotification = function (count) {
		var opt = {
			tag: 'gmail-notification' + window.App.now,
			lang: window.App.lang,
			title: 'You have new unread emails',
			body: count + ' new email.',
			iconUrl: chrome.extension.getURL('img/icon-48.png')
		},
			notification = new Notification(opt.title, opt)
			notification.onclick = function () {
					window.open('http://mail.google.com/')
					notification.close()
			}
			notification.onshow = function () {
				window.setTimeout(function () {
					notification.close()
				}, 10000)
			}
			notification.onerror = function () {
				this.error()
			}.bind(this)
			notification.onclose = function () {}
	}

	Module.prototype.updateUI = function (data) {
		this.ui_.empty()
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)
		var length = Math.min(6, data.entries.length)
		this.ui_.addHeading(data.count, data.title)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].author)
			//this.ui_.addMoreLink(news.url)
		this.ui_.addToDOM()
	}

	function ModuleUI(name) {
		this.formatter_ = Intl.DateTimeFormat([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: false
		})
		this.html = ''
		this.content = name + ' > .box__content'
	}

	ModuleUI.prototype.empty = function () {
		$(this.content).empty()
	}

	ModuleUI.prototype.addHeading = function (count, title) {
		this.html += '<div class="box__item box__caption"><h2><a href="http://mail.google.com/mail">' + title + ' (' + count + ')</a></h2></div>'
	}

	ModuleUI.prototype.addHTML = function (title, url, date, author) {
		date = this.formatter_.format(date)
		this.html += '<div class="box__item row"><div class="box__item__title col-lg-12"><div><a href="' + url + '">' + title + '</a></div><span class="box__author" title="' + author.getElementsByTagName('email')[0].innerHTML + '">' + date + ' &ndash;  ' + author.getElementsByTagName('name')[0].innerHTML + '</span></div></div>'
	}

	ModuleUI.prototype.addMoreLink = function (url) {
		this.html += '<div class="box__item box__caption"><a href="' + url + '">' + chrome.i18n.getMessage('moreNews') + '</a></div>'
	}

	ModuleUI.prototype.addToDOM = function (html) {
		html = html || this.html
		$(this.content).append(html)
		chrome.storage.local.set({
			gmailHTML: html
		})
	}

	window.App.register(new Module())
}(window, $, qwest)
