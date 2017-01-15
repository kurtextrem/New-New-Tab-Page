(function (window) {
	'use strict'

	var $ajax = window.qwest,
		$ = window.$, // Sprint
		chrome = window.chrome

	function checkForDate (date) {
		if (date instanceof Date) return date

		var d = new Date(date)
		if (!window.isNaN(d))
			return d

		console.error('date must be an instance of Date', date)
		return new Date(0)
	}

	/**
	 * Main constructor for the App.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	class App {
		constructor () {
			/** @type	{int}		Stores how large the module register is. */
			this.modulesLength = 0

			/** @type	{object}		Reference to the module's storage keys. */
			this.storageKeys = {}

			/** @type	{object}		Reference to loaded storage data, which is given to every module's constructor. */
			this.loadedObj = null

			/** @type 	{map} 		Translations dictionary (Chrome API). */
			this.dictionary = new Map()

			/** @type 	{object} 	Holds the current date object. */
			this.date = null
			/** @type 	{int} 		The current timestamp */
			this.now = null

			this.lang = chrome.i18n.getMessage('@@ui_locale').replace('_', '-')
			this.format = window.Intl.DateTimeFormat(this.lang, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				weekday: 'long',
				hour: '2-digit',
				minute: '2-digit'
			})

			this.updateTimestamp()

			this.loadBoxes()
			this.checkResolution()
		}

		/**
		 * Registers a module.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 * @param  	{Object}   		obj 	The module's prototype.
		 */
		register (obj) {
			console.log('Adding ' + obj.name)

			var index = this.modulesLength
			this.modulesLength++
			this[index] = obj

			var length = obj.storageKeys.length
			while (length--) {
				this.storageKeys[obj.storageKeys[length].name] = obj.storageKeys[length].type
			}
		}

		/**
		 * Initiates the modules.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 */
		bootModules () {
			var length = this.modulesLength
			while (length--) {
				try {
					new this[length](this.loadedObj)
				} catch (e) {
					console.error('Error while booting.', e, length, this.loadedObj, this[length])
				}
			}
			console.log('Started modules')
		}

		/**
		 * Ends the registration process and loads the data for them.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 */
		close () {
			chrome.storage.local.get(this.storageKeys, function (obj) {
				this.loadedObj = obj
				console.log('Loaded keys')
				this.bootModules()
			}.bind(this))
		}

		/**
		 * Loads the boxes.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 */
		loadBoxes () {
			$ajax.get(chrome.extension.getURL('boxes.html'), {}, { cache: true })
			.then(function (xhr, data) {
				function append() {
					$(document.body).append(data)
					window.i18n.process(document.body, window.App)
				}
				if (document.readyState !== 'loading')
					return append()
				document.addEventListener('readystatechange', function () { // will fire on interactive
					append()
				}, { once: true })
			}.bind(this))
			.catch(function (err) {
				console.error(err)
				$(document.body).append('<p class="center">Error while loading. Please try reloading.</p>')
			})
		}

		/**
		 * Adds classes for responsiveness, if needed.
		 *
		 * @author 	Jacob Groß
		 */
		checkResolution () {
			if (screen.availWidth < 1380) {
				console.log('Adjusting for resolution')
				$('#main-cards > .row > .col-lg-3').removeClass('col-lg-offset-1').addClass('col-lg-4')
				$('.mv-row').addClass('col-lg-12')
			}
		}

		/**
		 * Updates the timestamp vars.
		 *
		 * @author 	Jacob Groß
		 */
		updateTimestamp () {
			this.date = new Date()
			this.now = Date.now()
		}

		/**
		 * Returns a prettified time string.
		 *
		 * @param      	{Date}  	date    	The date object to prettify
		 * @return     	{String}           	Prettified time
		 */
		prettyTime (date) {
			date = checkForDate(date)

			var diff = (this.date - date + (this.date.getTimezoneOffset() - (date.getTimezoneOffset()))) / 1000,
				token = this.getMessage('clock_ago'),
				out = '',
				pre = Boolean(this.getMessage('clock_pre'))

			if (diff < 0) {
				diff = Math.abs(diff)
				pre = true
				token = this.getMessage('clock_in')
			}

			switch (true) {
				case diff < 60:
					return this.getMessage('clock_now')
				case diff < 120:
					out = '1 ' + this.getMessage('clock_minute')
					break
				case diff < 3600:
					out = Math.floor(diff / 60) + ' ' + this.getMessage('clock_minutes')
					break
				case diff < 7200:
					out = '1 ' + this.getMessage('clock_hour')
					break
				case diff < 86400:
					out = Math.floor(diff / 3600) + ' ' + this.getMessage('clock_hours')
					break;
				case Math.floor(diff / 86400) === 1:
					return this.getMessage('clock_yesterday') + ', ' + date.toLocaleTimeString().substr(0, 5)
					break
				default:
					return Intl.DateTimeFormat(this.lang, {
						year: '2-digit',
						month: '2-digit',
						day: '2-digit',
						weekday: 'short',
						hour: '2-digit',
						minute: '2-digit'
					}).format(date.valueOf())
			}

			return pre ? token + ' ' + out : out + ' ' + token
		}

		/**
		 * Returns a human-readable date.
		 *
		 * @param      	{Date}  	date    	The date object to prettify
		 * @return     	{String} 		Prettified Date
		 */
		prettyDate (date) {
			date = checkForDate(date)
			return this.format.format(date)
		}

		/**
		 * Return i18n message from Chrome translations.
		 *
		 * @param      	{string}  string  	The key
		 * @return     	{string}  		The translation.
		 */
		getMessage (string) {
			var s = this.dictionary.get(string)
			if (s) return s

			s = chrome.i18n.getMessage(string) || 'i18n::' + string
			this.dictionary.set(string, s)
			return s
		}
	}

	/**
	 * Initiates the App and makes it public.
	 */
	window.App = new App()

	/************************************************************************************\
	|  Represents the Module namespace and the core functions for modules to inherit.       |
	\ ************************************************************************************/
	class Module {
		/** @type	{String}		The module's name. */
		static get name () { return '' }

		/** @type	{String}		The module's storage keys. */
		static get storageKeys () { return [] }

		/**
		 * Represents the constructor.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String}   	obj 		The loaded data.
		 * @param  	{String}   	NAME 	The module name.
		 * @param  	{object}   	UI 		The UI of the module.
		 * @param  	{int}   		TIME 	The time between updates.
		 */
		constructor (obj, NAME, ui, TIME) {
			this.name = NAME
			this.html = obj[this.name + 'HTML']
			if (ui && !(ui instanceof ModuleUI)) throw new Error('Parameter 3 must be an instance of ModuleUI')
			this.ui = ui

			if (!TIME) return // we don't want the following things to execute

			this.showCached(this.html || obj[this.name])

			if (window.App.now - obj[this.name].date > TIME * 60000)
				return this.update()
		}

		/**
		 * Outputs the cached HTML.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String|Object}   	data
		 */
		showCached (data) {
			if (!data && !data.date) return
			console.log('Showing cached ' + this.name)
			this.updateUI(data)
		}

		/**
		 * Updates the module's data.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 */
		update (/** @private */ url, /** @private */ param, /** @private */ type) {
			console.log('Requesting ' + this.name)
			//this.ui.addHeading('Loading ' + this.name, App.now)

			$ajax.get(url, param, type)
			.then(this.success.bind(this))
			.catch(this.error.bind(this))
		}

		/**
		 * Function called after a successfull update request.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 */
		success (xhr, response) {}

		/**
		 * Function called after an failed update request.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 */
		error (err, xhr, response) {
			console.error('Failed ' + this.name + ' request. ', err, response)
			if (this.html)
				this.showCached(this.html)
			return xhr
		}

		/**
		 * Tells the UI to update.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-26
		 */
		updateUI (data) {
			if (!data) return this.ui.addToDOM()
			if (typeof data === 'string')
				return this.ui.addToDOM(data)

			return this.ui.update(data)
		}
	}

	window.Module = Module

	/************************************************************************************\
	|   Represents the UI namespace and the core functions for modules to inherit.                 |
	\ ************************************************************************************/
	class ModuleUI {
		/**
		 * Represents the constructor.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String}   	name 		ID to identify the box
		 * @param  	{object}   	options 	Module options
		 */
		constructor (name, options) {
			this.html = ''
			this.options = options
			this.name = name
			this.$content = $(name[0] === '#' ? name : '#box-' + name + ' > .box__content')
		}

		update (data) {
			this.html = ''
			this.buildContent(data)

			this.addToDOM()
		}

		/**
		 * Adds a heading.
		 *
		 * @author 	Jacob Groß
		 * @date   	2016-10-15
		 * @param	{string}		html
		 * @param 	{Date}		date
		 * @param	{object}		data 	Loaded data
		 */
		addHeading (html, date, data) {
			this.html += '<header class="box__item box__caption" title="' + window.App.getMessage('last_refresh') + ': ' + window.App.prettyDate(date) + '"><h2>' + html + '</h2></header>'
		}

		/**
		 * Builds the UI content.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 */
		buildContent (data) {}

		/**
		 * Adds HTML.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 */
		_addHTML (/** params */) {}

		/**
		 * Adds the HTML to the DOM.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String}   	html
		 */
		addToDOM (html) {
			html = html || this.html || ''
			this.$content.html(html)

			var obj = {}
			obj[this.name + 'HTML'] = html
			chrome.storage.local.set(obj)
			console.log('rendered', this.name)
		}
	}

	window.ModuleUI = ModuleUI

	/***********************************************************************************************\
	|   Represents the UI with extended options namespace and core functions for the UI to inherit.     |
	\ **********************************************************************************************/
	class ModuleUIExtended extends ModuleUI {
		/** @see  ModuleUI */
		constructor (name, options) {
			super(name, options) // always call super first, if we don't `this` === undefined

			this.$info = $('#box-' + name + ' > .box-info__content')
			/** @type {bool} Is the next call a redraw? */
			this._redraw = false
		}

		buildContent (data) {
			if (data.entries && this.options.count < data.entries.length)
				this.addMoreLink()

			super.buildContent(data)
		}

		/**
		 * Adds a "more" button.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String}   	url
		 */
		addMoreLink (url) {
			this.html += '<footer><button class="jfk-button js-more">' + window.App.getMessage('more') + '</button></footer>'
		}

		addToDOM (html) {
			super.addToDOM(html)
			this.addListener()
		}

		/**
		 * Adds specific listener.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-28
		 */
		addListener () {
			// more
			this.$content.find('.js-more').on('click', function () {
				this.html = ''
				this.options.count += this.options.count
				this.update(window.App.loadedObj[this.name])
			}.bind(this))

			if (this._redraw) return false // we don't add the following listeners twice

			// @todo: will-change on mousedown?
			var $infoToggle = this.$info.parent().find('.box-info')

			// "i" click
			$infoToggle.on('click', function () {
				this._toggleInfo($infoToggle)
				if (!$infoToggle.hasClass('box-info__active')) {
					this.update(window.App.loadedObj[this.name])
				}
			}.bind(this)).on('click.once', function () { // load options on startup
				$infoToggle.off('click.once') // sprint doesn't support .one
				this._load(name)
			}.bind(this))

			// options change
			var style = document.createElement('style')  // custom input[type=range] (1)
			document.body.appendChild(style)

			this.$info.find('input, select').on('change', function (e) {
				var val = e.target.value
				if (e.target.type === 'checkbox')
					val = !!e.target.checked
				this._saveOption(e.target.id.split('__')[1], val)
			}.bind(this))
			.find('[type=range]').on('input', function (e) {  // custom input[type=range] (1)
				var min = e.target.min || 0,
				val = (e.target.max ? ~~(100 * (e.target.value - min) / (e.target.max - min)) : e.target.value) + '% 100%'

				style.textContent = 'input[type=range]::-webkit-slider-runnable-track{background-size:' + val + '}'
			})

			return this._redraw = true
		}

		/**
		 * Toggles the UI content.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-28
		 * @param  	$infoToggle
		 * @param  	$infoContent
		 */
		_toggleInfo ($infoToggle) {
			this.$content.toggleClass('hide')
			this.$info.toggleClass('hide')
			window.requestAnimationFrame(function () {
				$infoToggle.toggleClass('box-info__active')
			})
		}

		/**
		 * Saves to the storage.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-28
		 * @param  	{string}   		name 	The module's name
		 * @param  	{string|array}   	key 	The key(s) to save
		 * @param  	{string|array}   	val 		The value(s) to save
		 */
		_saveOption (key, val) {
			var obj = {},
				name = this.name + 'Options'
			obj[name] = {}
			if (typeof key === 'string') {
				obj[name][key] = val
				this.options[key] = val
			} else {
				var i = key.length
				while (i--) {
					obj[name][key[i]] = val[i]
					this.options[key[i]] = val[i]
				}
			}

			this.html = ''
			obj[this.name + 'HTML'] = ''
			chrome.storage.local.set(obj)
		}

		/**
		 * Updates the DOM of the options according to the values.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-28
		 */
		_load () {
			for (var index in this.options) {
				if (this.options.hasOwnProperty(index)) {
					var elem = this.$info.find('[id$="' + index + '"]')
					if (!elem) continue

					if (elem.attr('type') === 'checkbox')
						return elem.get(0).checked = this.options[index]
					elem.val(this.options[index])
				}
			}
		}
	}

	window.ModuleUIExtended = ModuleUIExtended

}(window));
