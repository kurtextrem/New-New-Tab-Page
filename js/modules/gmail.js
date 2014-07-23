/* global Notification,console,Intl,qwest */
+function (window, $, $ajax) {
	'use strict';

	function Module() {
		this.permission = 0
		this.count = 0
		this.html = ''
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
		this.html = obj[this.name + 'HTML']

		if (window.App.now - obj[this.name].date > 5 * 60000)
			this.update()
		else
			this.showCached(this.html || obj[this.name])
	}

	Module.prototype.requestPermission = function (cb) {
		if (this.permission)
			return cb()
		Notification.requestPermission(function (status) {
			if (status === 'granted') {
				this.permission = 1
				cb()
			}
		}.bind(this))
	}

	Module.prototype.update = function () {
		console.log('Requesting ' + this.name)
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

	Module.prototype.error = function (message) {
		console.error('Failed ' + this.name + ' request. ' + message)
		if (this.html)
			this.showCached(this.html)
	}

	Module.prototype.showNotification = function (count, total) {
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

	Module.prototype.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)
		var length = Math.min(8, data.entries.length)
		this.ui_.addHeading(data.count, data.title)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].author)
			//this.ui_.addMoreLink(news.url)
		this.ui_.addToDOM()
	}

	function ModuleUI(name) {
		this.formatter_ = Intl.DateTimeFormat(window.App.lang, {
			year: '2-digit',
			month: '2-digit',
			day: 'numeric',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit'
		})
		this.html = ''
		this.content = name + ' > .box__content'
	}

	ModuleUI.prototype.addHeading = function (count, title) {
		this.html += '<div class="box__item box__caption"><h2><a href="http://mail.google.com/mail">' + title + ' (' + count + ')</a></h2></div>'
	}

	ModuleUI.prototype.addHTML = function (title, url, date, author) {
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

	ModuleUI.prototype.addMoreLink = function (url) {
		this.html += '<div class="box__item box__caption"><a href="' + url + '">' + chrome.i18n.getMessage('moreNews') + '</a></div>'
	}

	ModuleUI.prototype.addToDOM = function (html) {
		html = html || this.html || 1
		$(this.content).html(html)
		chrome.storage.local.set({
			gmailHTML: html
		})
	}

	window.App.register(new Module())
}(window, $, qwest)
