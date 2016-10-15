/* global Notification */
(function (window) {
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

	class Module extends window.Module {
		/** @type	{String}		The module's name. */
		static get name() { return 'gmail' }

		/** @type	{String}		The module's storage keys. */
		static get storageKeys() {
			return [{
				name: 'gmail',
				type: {
					count: 0,
					date: 0,
					title: window.App.getMessage('mails'),
					entries: []
				}
			}, {
				name: 'gmailHTML',
				type: ''
			}, {
				name: 'gmailOptions',
				type: {
					count: 6
				}
			}]
		}

		/** @see ntp.js */
		constructor(obj) {
			super(obj, Module.name, new ModuleUI('#box-' + Module.name, obj[Module.name + 'Options']), TIME)

			this.permission = 0
			this.requestPermission(function () {})
			this.count = obj[this.name].count
			this.gmailURL = chrome.extension.getURL('img/gmail.png')
		}

		/**
		 * [requestPermission description]
		 *
		 * @author Jacob Groß (kurtextrem)
		 * @date   2014-07-24
		 * @param  {Function} cb [description]
		 * @return {[type]}      [description]
		 */
		requestPermission(cb) {
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
		update() {
			super.update(URL, PARAMS, TYPE)
		}

		/** @see ntp.js */
		success(xhr, xmlDoc) {
			var items = xmlDoc.getElementsByTagName('entry'),
				data = {
					entries: []
				}

			console.log('Got ' + items.length + ' ' + this.name, items)
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
		showNotification(count, total) {
			var opt = {
					tag: 'gmail-notification' + window.App.now,
					lang: window.App.lang,
					title: 'You have ' + count + ' new mail(s)',
					body: count + ' new and a total of ' + total + ' unread mail(s).',
					icon: this.gmailURL // @todo: Switch to local image
				},
				notification = new Notification(opt.title, opt)
			notification.onclick = function () {
				window.open('https://mail.google.com/mail')
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
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	class ModuleUI extends window.ModuleUIExtended {
		/** @see ntp.js */
		constructor(name, options) {
			super(name, options)
		}

		/** @see ntp.js */
		update (data) {
			this.addHeading(data.count, data.title, data.date)

			super.update(data)
		}

		/** @see ntp.js */
		addHeading(count, title, date) {
			super.addHeading('<a href="http://mail.google.com/mail">' + title + ' (' + count + ')</a>', date)
		}

		/** @see ntp.js */
		buildContent(data) {
			var length = Math.min(this.options.amount, data.entries.length)
			for (var i = 0; i < length; i++)
				this._addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].author)

			super.buildContent(data)
		}

		/** @see ntp.js */
		_addHTML(title, url, date, author) {
			date = new Date(date)
			this.html += '<div class="box__item row"><div class="box__item--title col-lg-12"><div><a href="' + url + '">' + title + '</a></div><span class="box__author" title="' + author.getElementsByTagName('email')[0].innerHTML + '"><time datetime="' + date.toISOString() + '" title="' + window.App.prettyDate(date) + '">' + window.App.prettyTime(date) + '</time> &ndash;  ' + author.getElementsByTagName('name')[0].innerHTML + '</span></div></div>'
		}

		/** @see ntp.js */
		addToDOM(html) {
			chrome.storage.local.set({
				gmailHTML: super.addToDOM(html)
			})
		}
	}

	/** @see ntp.js */
	window.App.register(Module)

}(window));
