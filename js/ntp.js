/* global console, i18n, Intl */
(function (window) {
	'use strict'

	var $ajax = window.qwest,
		$ = window.$, // Sprint
		chrome = window.chrome

	/**
	 * Main constructor for the App.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	class App {
		constructor () {
			/** @type	{Integer}	Stores how large the module register is. */
			this.modulesLength = 0

			/** @type	{Object}	Reference to the module's storage keys. */
			this.storageKeys = {}

			/** @type	{Array}		Reference to loaded storage data, which is given to every module's constructor. */
			this.loadedObj = {}

			this.updateTimestamp()
			this.lang = chrome.i18n.getMessage('@@ui_locale').replace('_', '-')
			this.format = window.Intl.DateTimeFormat(this.lang, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				weekday: 'long',
				hour: '2-digit',
				minute: '2-digit'
			})

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
				try { // @todo: Remove for more speed
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
				$('body').append(data)
				i18n.process(document, chrome.i18n)
			}.bind(this))
			.catch(function (err) {
				console.error(err)
				$('body').append('<p class="center">Error while loading.</p>')
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
			this.now = this.date.valueOf()
		}

		prettyTime (date) {
			var diff = (this.date - date + (this.date.getTimezoneOffset() - (date.getTimezoneOffset()))) / 1000,
				token = chrome.i18n.getMessage('clock_ago'),
				out = '',
				pre = Boolean(chrome.i18n.getMessage('clock_pre'))

			if (diff < 0) {
				diff = Math.abs(diff)
				pre = true
				token = chrome.i18n.getMessage('clock_in')
			}

			switch (true) {
				case diff < 60:
					return chrome.i18n.getMessage('clock_now')
				case diff < 120:
					out = '1 ' + chrome.i18n.getMessage('clock_minute')
					break
				case diff < 3600:
					out = Math.floor(diff / 60) + ' ' + chrome.i18n.getMessage('clock_minutes')
					break
				case diff < 7200:
					out = '1 ' + chrome.i18n.getMessage('clock_hour')
					break
				case diff < 86400:
					out = Math.floor(diff / 3600) + ' ' + chrome.i18n.getMessage('clock_hours')
					break;
				case Math.floor(diff / 86400) === 1:
					return chrome.i18n.getMessage('clock_yesterday') + ', ' + date.toLocaleTimeString().substr(0, 5)
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

		prettyDate (date) {
			return this.format.format(date)
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
		 * @param  	{String}   	obj 	The loaded data.
		 */
		constructor (obj, NAME, /** @private */ TIME) {
			this.name = NAME
			this.html = obj[this.name + 'HTML']
			// this.ui = this.ui || {}

			if (!TIME) return // we don't want the following things to execute

			if (window.App.now - obj[this.name].date > TIME * 60000)
				return this.update()
			this.showCached(this.html || obj[this.name])
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
		success (/** The XHR object */ xhr, /** Response */response) {}

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
		updateUI ( /** data */ ) {
			//this.ui.addMoreLink(news.url)
			this.ui.addToDOM()
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
		constructor (name, options, /** @private */ notBox) {
			this.html = ''
			this.options = options
			this.content = notBox ? name : name + ' > .box__content'

			// this._cacheObjects()
		}

		/**
		 * Adds a heading.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 */
		addHeading ( /** @private */ html, /** @private */ date) {
			this.html += '<header class="box__item box__caption" title="' + chrome.i18n.getMessage('last_refresh') + ': ' + window.App.prettyDate(date) + '"><h2>' + html + '</h2></header>'
		}

		/**
		 * Builds the UI content.
		 * Called from Module.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 */
		buildContent ( /** data */ ) {}

		/**
		 * Adds HTML.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 */
		_addHTML ( /** params */ ) {}

		/**
		 * Adds a "more" link.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String}   	url
		 */
		_addMoreLink (url) {
			this.html += '<div class="box__item box__caption"><a href="' + url + '">' + chrome.i18n.getMessage('more') + '</a></div>'
		}

		/**
		 * Adds the HTML to the DOM.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-23
		 * @param  	{String}   	html
		 * @return 	{String} 	The HTML to use
		 */
		addToDOM (html) {
			html = html || this.html || 1
			$(this.content).html(html)

			return html
		}

		/**
		 * Caches the variables.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-09-06
		 */
		_cacheObjects () {
			this.content = $(this.content)
		}
	}

	window.ModuleUI = ModuleUI

	/***********************************************************************************************\
	|   Represents the UI with extended options namespace and core functions for the UI to inherit.     |
	\ **********************************************************************************************/
	class ModuleUIExtended extends ModuleUI {
		/** @see  ModuleUI */
		constructor (name, options, /** @private */ notBox) {
			super(name, options, notBox) // always call super first, if we don't `this` === undefined

			this.info = name + ' > .box-info__content'
			this._cacheObjectsExtended()
		}

		/** @see ModuleUI */
		_cacheObjectsExtended () {
			this.info = $(this.info)
			this._addListener()
		}

		/**
		 * Adds specific listener.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-28
		 */
		_addListener () {
			// @todo: will-change on mousedown?
			var $infoToggle = this.info.parent(),
			name = $infoToggle.attr('id').split('-')[1]
			$infoToggle = $infoToggle.find('.box-info')

			// "i" click
			$infoToggle.on('click', function () {
				this._toggleInfo($infoToggle)
			}.bind(this)).on('click.once', function () { // load options on startup
				$infoToggle.off('click.once') // sprint doesn't support .once
				this._load(name)
			}.bind(this))

			// options change
			var style = document.createElement('style')  // custom input[type=range] (1)
			document.body.appendChild(style)

			this.info.find('input, select').on('change', function (e) {
				var val = e.target.value
				if (e.target.type === 'checkbox')
					val = !!e.target.checked
				this._save(name, e.target.id.split('__')[1], val)
			}.bind(this))
			.find('[type=range]').on('input', function (e) {  // custom input[type=range] (1)
				var min = e.target.min || 0,
				val = (e.target.max ? ~~(100 * (e.target.value - min) / (e.target.max - min)) : e.target.value) + '% 100%'

				style.textContent = 'input[type=range]::-webkit-slider-runnable-track{background-size:' + val + '}'
			})
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
			$infoToggle.toggleClass('box-info__active')
			this.content.toggleClass('hide')
			this.info.toggleClass('hide')
			window.setTimeout(function () {
				this.info.toggleClass('fade')
			}.bind(this), 100)
		}

		/**
		 * Saves to the storage.
		 *
		 * @author 	Jacob Groß
		 * @date   	2014-07-28
		 * @param  	{string}   	name 	The module's name
		 * @param  	{string|array}   	key 	The key(s) to safe
		 * @param  	{string|array}   	val 	The value(s) to safe
		 */
		 _save (name, key, val) {
		 	var obj = {}
		 	name = name + 'Options'
		 	obj[name] = {}
		 	if (typeof key === 'string')
		 		obj[name][key] = val
		 	else {
		 		var i = key.length
		 		while (i--) {
		 			obj[name][key] = val[i]
		 		}
		 	}
			obj[name + 'Cache'] = '' // clear cache
			chrome.storage.local.set(obj, function () {
				this.info.find('.box-info__text--saved').removeClass('hide')
			}.bind(this))
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
		 			var elem = this.info.find('[id$="' + index + '"]'),
		 			checkbox = elem.filter('[type=checkbox]').get(0)
		 			if (checkbox !== undefined)
		 				return checkbox.checked = this.options[index]
		 			elem.val(this.options[index])
		 		}
		 	}
		}
	}

	window.ModuleUIExtended = ModuleUIExtended

}(window));
