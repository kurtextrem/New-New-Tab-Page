(function(window) {
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
		static get name() {
			return 'gmail'
		}

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
			super(obj, Module.name, new ModuleUI(Module.name, obj[Module.name + 'Options']), TIME)

			this.permission = 0
			this.requestPermission(function() {})
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
			Notification.requestPermission(function(status) {
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
			data.title = xmlDoc.querySelector('title')
				.innerHTML // innerHTML is fine for the following, as we need to have entities encoded (textContent would leave them decoded) - as we render plain text/html
			data.count = xmlDoc.getElementsByTagName('fullcount')[0].innerHTML
			for (var i = 0; i < items.length; ++i) {
				var item = items[i]
				data.entries[i] = {
					title: item.getElementsByTagName('title')[0].innerHTML,
					url: item.getElementsByTagName('link')[0].attributes.href.value,
					date: item.getElementsByTagName('modified')[0].innerHTML,
					author: item.getElementsByTagName('author')[0].children
				}
			}

			console.log('new ' + data.count)
			console.log('old ' + this.count)
			if (data.count > this.count)
				this.requestPermission(this.showNotification.bind(this, data))

			chrome.storage.local.set({
				gmail: data
			}, this.updateUI.bind(this, data))
		}

		/** @see ntp.js */
		showNotification(data) {
			var count = data.count >= this.count ? data.count - this.count : data.count,
				total = data.count

			var body = new Array(5)
			body[0] = '' // tell optimizer we will put in strings
			for (var i = 0; i < 5; ++i) {
				body[i] = data.entries[i].title + ' — ' + (data.entries[i].author && data.entries[i].author.item('name'))
			}
			console.log(body)

			var s = count === 1 ? '' : 's',
				opt = {
					tag: 'gmail-notification' + window.App.now,
					lang: window.App.lang,

					icon: this.gmailURL, // @todo: Switch to local image
					title: 'You have ' + count + ' new mail' + s + ' (' + total + ')',
					body: body.join('\n') // 5 lines total allowed
				}

			var notification = new Notification(opt.title, opt)
			notification.onclick = function() {
				window.open('https://mail.google.com/mail')
				notification.close()
			}
			notification.onshow = function() {
				window.setTimeout(function() {
					notification.close()
				}, 15000)
			}
			notification.onerror = function() {
				this.error()
			}.bind(this)
			//notification.onclose = function () {}

			window.addEventListener('unload', function() {
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
		addHeading(count, title, date) {
			super.addHeading('<a href="http://mail.google.com/mail">' + title + ' (' + count + ')</a>', date)
		}

		/** @see ntp.js */
		buildContent(data) {
			this.addHeading(data.count, data.title, data.date)

			var length = Math.min(this.options.count, data.entries.length)
			for (var i = 0; i < length; i++)
				this._addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].author)

			super.buildContent(data)
		}

		/** @see ntp.js */
		_addHTML(subject, url, date, author) {
			var email = '',
				name = '',
				d = 0
			subject = subject || '<i>' + window.App.getMessage('gmail_noSubject') + '</i>'

			d = new Date(date)
			if (author && author.item) {
				email = author.item('email')
					.textContent
				name = author.item('name')
					.textContent
			}

			this.html += '<div class="box__item row"><div class="box__item--title col-lg-12"><div><a href="' + url + '">' + subject + '</a></div><span class="box__author" title="' + email + '"><time datetime="' + d.toISOString() + '" title="' + window.App.prettyDate(d) + '">' + window.App.prettyTime(d) + '</time> &ndash;  ' + name + '</span></div></div>'
		}
	}

	/** @see ntp.js */
	window.App.register(Module)

}(window))
