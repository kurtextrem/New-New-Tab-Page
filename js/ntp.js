/* global console,qwest,Class */
+function (window, $, $ajax, Class) {
	'use strict';

	/**
	 * Main constructor for the App.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	function App() {
		this.updateTimestamp()
		this.lang = chrome.i18n.getMessage('@@ui_locale').replace('_', '-')

		this.loadBoxes()
		this.checkResolution()
	}

	/** @type	{Array}		Reference to the registered modules. */
	App.prototype.modules = []

	/** @type	{Object}	Reference to the module's storage keys. */
	App.prototype.storageKeys = {}

	/** @type	{Array}		Reference to loaded storage data, which is given to every module's constructor. */
	App.prototype.loadedObj = {}

	/**
	 * Registers a module.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 * @param  	{Object}   		obj 	The module's prototype.
	 */
	App.prototype.register = function (obj) {
		this.modules.push(this.Module.extend(obj))
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
	App.prototype.bootModules = function () {
		var length = this.modules.length
		while (length--) {
			new this.modules[length](this.loadedObj)
		}
		console.log('Started modules')
	}

	/**
	 * Ends the registration process and loads the data for them.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	App.prototype.close = function () {
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
	App.prototype.loadBoxes = function () {
		$ajax.get(chrome.extension.getURL('boxes.html'), {}, {
			type: 'html',
			cache: 'true'
		}).success(function (body) {
			$('body').append(body)
		}.bind(this))
	}

	/**
	 * Adds classes for responsiveness, if needed.
	 *
	 * @author 	Jacob Groß
	 */
	App.prototype.checkResolution = function () {
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
	App.prototype.updateTimestamp = function () {
		this.date = new Date()
		this.now = this.date.valueOf()
	}

	/** @deprecated  Added the classes using CSS; Used for reference */
	App.prototype.addClasses = function () {
		$('#most-visited').addClass('container-fluid')
			.find('#mv-tiles').addClass('row').css('width', 'auto')
			.find('.mv-row').addClass('col-lg-6')
	}

	/************************************************************************************\
	|  Represents the Module namespace and the core functions for modules to inherit.       |
	\ ************************************************************************************/
	var Module = {}

	/** @type	{String}		The module's name. */
	Module.name = ''

	/** @type	{String}		The module's storage keys. */
	Module.storageKeys = []

	/**
	 * Represents the constructor.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 * @param  	{String}   	obj 	The loaded data.
	 */
	Module.init = function (obj, /** @private */ TIME) {
		this.html = obj[this.name + 'HTML']

		if (window.App.now - obj[this.name].date > TIME * 60000)
			this.update()
		this.showCached(this.html || obj[this.name])
	}

	/**
	 * Outputs the cached HTML.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 * @param  	{String|Object}   	data
	 */
	Module.showCached = function (data) {
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
	Module.update = function (/** @private */ url, /** @private */ param, /** @private */ type) {
		console.log('Requesting ' + this.name)
		$ajax.get(url, param, type).success(this.success.bind(this)).error(this.error.bind(this))
	}

	/**
	 * Function called after a successfull update request.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	Module.success = function (/** xmlDoc */) {}

	/**
	 * Function called after an failed update request.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	Module.error = function (message) {
		console.error('Failed ' + this.name + ' request. ' + message)
		if (this.html)
			this.showCached(this.html)
	}

	/**
	 * Tells the UI to update.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-26
	 */
	Module.updateUI = function (/** data */) {
		//this.ui_.addMoreLink(news.url)
		this.ui_.addToDOM()
	}

	/**
	 * Makes the Module inheritable.
	 */
	App.prototype.Module = Class.extend(Module)


	/************************************************************************************\
	|   Represents the UI namespace and the core functions for modules to inherit.                 |
	\ ************************************************************************************/
	var ModuleUI = {}

	/**
	 * Represents the constructor.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 * @param  	{String}   	name 	ID to identify the box
	 */
	ModuleUI.init = function (name, options, /** @private */ notBox) {
		this.html = ''
		this.options = options
		this.content = notBox ? name : name + ' > .box__content'
	}

	/**
	 * Adds a heading.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 */
	ModuleUI.addHeading = function (/** @private */ html, /** @private */ date) {
		this.html += '<header class="box__item box__caption" title="Last refresh: ' + date + '"><h2>' + html + '</h2></header>'
	}

	/**
	 * Adds HTML.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 */
	ModuleUI.addHTML = function (/** params */) {}

	/**
	 * Adds a "more" link.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 * @param  	{String}   	url
	 */
	ModuleUI.addMoreLink = function (url) {
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
	ModuleUI.addToDOM = function (html) {
		html = html || this.html || 1
		$(this.content).html(html)

		return html
	}

	/**
	 * Makes the UI inheritable.
	 */
	App.prototype.ModuleUI = Class.extend(ModuleUI)


	/************************************************************************************\
	|   Represents the info namespace and core functions for the UI to inherit.                           |
	\ ************************************************************************************/
	var ModuleUIExtended = {}

	/** @see  ModuleUI */
	ModuleUIExtended.init = function (name, options, /** @private */ notBox) {
		this._super(name, options, notBox)
		this.info = name + ' > .box-info__content'
		this.addListener(name)
	}

	/**
	 * Adds specific listener.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-28
	 * @param  	{string}   	name 	The module's box id
	 */
	ModuleUIExtended.addListener = function (name) {
		// @todo: will-change on mousedown?
		var $infoToggle = $(name + ' > .box-info'),
		$infoContent = $(this.info)

		// "i" click
		$infoToggle.on('click', function () {
			this.toggleInfo($infoToggle, $infoContent)
		}.bind(this)).on('click.once', function () { // load options on startup
			$infoToggle.off('click.once')
			this.load(name)
		}.bind(this))

		// options change
		$infoContent.find('input, select').on('change', function (e) {
			var val = e.target.value
			if (e.target.type === 'checkbox')
				val = !!e.target.checked
			this.save(name.replace(/#box-(.*)/, '$1'), e.target.id.split('__')[1], val)
		}.bind(this))
	}

	/**
	 * Toggles the UI content.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-28
	 * @param  	$infoToggle
	 * @param  	$infoContent
	 */
	ModuleUIExtended.toggleInfo = function ($infoToggle, $infoContent) {
		$infoToggle.toggleClass('box-info__active')
		$(this.content).toggleClass('hide')
		$infoContent.toggleClass('hide')
		window.setTimeout(function () {
			$infoContent.toggleClass('fade')
		}, 100)
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
	ModuleUIExtended.save = function (name, key, val) {
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
		chrome.storage.local.set(obj)
	}

	/**
	 * Loads the current options.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-28
	 * @param  	{string}   	name 	The module's box id
	 */
	ModuleUIExtended.load = function (name) {
		for (var index in this.options) {
			if (this.options.hasOwnProperty(index)) {
				var elem = $('[id$="' + index + '"]', name)
				if (elem.filter('[type=checkbox]')[0] !== undefined)
					return elem.filter('[type=checkbox]')[0].checked = this.options[index]
				elem.val(this.options[index])
			}
		}
	}

	/**
	 * Makes the UI inheritable.
	 */
	App.prototype.ModuleUIExtended = App.prototype.ModuleUI.extend(ModuleUIExtended)


	/**
	 * Initiates the App and makes it public.
	 */
	window.App = new App()
}(window, $, qwest, Class)
