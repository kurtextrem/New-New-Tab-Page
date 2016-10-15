(function (window) {
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
			hl: App.getMessage('@@ui_locale'),
			num: 30
		},
		TYPE = {
			responseType: 'xml'
		},
		SHUFFLE = 2

	class Module extends window.Module {
		/** @type	{String}		The module's name. */
		static get name() { return 'news' }

		/** @type	{String}		The module's storage keys. */
		static get storageKeys() {
			return [{
				name: 'news',
				type: {
					date: 0,
					title: App.getMessage('news'),
					url: 'https://news.google.com',
					entries: []
				}
			}, {
				name: 'newsHTML',
				type: ''
			}, {
				name: 'newsOptions',
				type: {
					count: 6,
					shuffle: true,
					shuffleDate: 0
				}
			}]
		}

		/** @see ntp.js */
		constructor(obj) {
			super(obj, Module.name)

			this.ui = new ModuleUI(this.name, obj[this.name + 'Options'])
			this.html = obj[this.name + 'HTML']

			this.showCached(this.html || obj[this.name])

			if (App.now - obj[this.name].date > TIME * 60000) // true update
				return this.update()

			if (!this.ui.options.shuffle || App.now - this.ui.options.shuffleDate < SHUFFLE * 60000) return

			console.log('Shuffling news')

			this.updateUI(obj[this.name])
			this.ui.options.shuffleDate = App.now
			chrome.storage.local.set({
				newsOptions: this.ui.options
			})
		}

		/** @see ntp.js */
		update() {
			super.update(URL, PARAMS, TYPE)
		}

		/** @see ntp.js */
		success(xhr, xmlDoc) {
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
		addHeading(url, title, date) {
			super.addHeading('<a href="' + url + '">' + title + '</a>', date)
		}

		/** @see ntp.js */
		buildContent(data) {
			this.addHeading(data.url, data.title, data.date)

			var options = Math.min(this.options.count, data.entries.length),
				length = Math.floor(Math.random() * (data.entries.length - options + 1))
			options += length
			for (var i = length; i < options; i++)
				this._addHTML(data.entries[i].title, data.entries[i].url, data.entries[i].date, data.entries[i].img)

			super.buildContent(data)
		}

		/** @see ntp.js */
		_addHTML(title, url, date, img) {
			title = title.split(' - ')
			var source = title.pop()
			title = title.join(' - ').replace(' - FAZ', '')
			date = new Date(date)
			this.html += '<div class="box__item row"><div class="box__img col-lg-3 img-responsive"><img src="' + img + '" onerror="this.remove()"></div><div class="box__item--title col-lg-9"><div><a href="' + url + '">' + title + '</a></div><span class="box__author"><time datetime="' + date.toISOString() + '" title="' + App.prettyDate(date) + '">' + App.prettyTime(date) + '</time> &ndash;  ' + source + '</span></div></div>'
		}
	}

	/** @see ntp.js */
	App.register(Module)

}(window));
