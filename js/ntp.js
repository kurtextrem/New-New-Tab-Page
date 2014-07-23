/* global console,qwest,Class */
+function (window, $, $ajax, Class) {
	'use strict';

	function App() {
		this.now = Date.now()
		this.lang = chrome.i18n.getMessage('@@ui_locale').replace('_', '-')

		this.loadBoxes()
		this.checkResolution()
		this.addMissingDOM()
	}

	App.prototype.modules = []

	App.prototype.storageKeys = {}

	App.prototype.loadedObj = {}

	App.prototype.register = function (obj) {
		this.modules.push(this.Module.extend(obj))
		var length = obj.storageKeys.length
		while (length--) {
			this.storageKeys[obj.storageKeys[length].name] = obj.storageKeys[length].type
		}
	}

	App.prototype.close = function () {
		chrome.storage.local.get(this.storageKeys, function (obj) {
			this.loadedObj = obj
			console.log('Loaded keys')
			this.bootModules()
		}.bind(this))
	}

	App.prototype.addMissingDOM = function () {
		//$('#mngb').append('<div><div style="float:left;padding-left:10px;height:60px;min-width:0;padding-left:10px" class="gb_Z gb_Ac gb_e gb_Dc"><img alt="Chrome" src="chrome-search://theme/IDR_PRODUCT_LOGO"></div></div>')
	}

	App.prototype.loadBoxes = function () {
		$ajax.get(chrome.extension.getURL('boxes.html'), {}, {
			type: 'html',
			cache: 'true'
		}).success(function (body) {
			$('body').append(body)
		}.bind(this))
	}

	App.prototype.bootModules = function () {
		var length = this.modules.length
		while (length--) {
			new this.modules[length](this.loadedObj)
		}
		console.log('Started modules')
	}

	App.prototype.checkResolution = function () {
		if (screen.availWidth < 1380) {
			console.log('Adjust for resolution')
			$('#main-cards > .row > .col-lg-3').removeClass('col-lg-offset-1').addClass('col-lg-4')
			$('.mv-row').addClass('col-lg-12')
		}
	}

	/** @deprecated  Added the classes using CSS */
	App.prototype.addClasses = function () {
		$('#most-visited').addClass('container-fluid')
			.find('#mv-tiles').addClass('row').css('width', 'auto')
			.find('.mv-row').addClass('col-lg-6')
	}

	/************************************************************************************\
	|  Represents the Module namespace and the core functions for modules to inherit.       |
	\ ************************************************************************************/
	var Module = {}

	Module.name = ''

	Module.storageKeys = []

	Module.init = function (obj, /** @private */ TIME) {
		this.html = obj[this.name + 'HTML']

		this.showCached(this.html || obj[this.name])
		if (window.App.now - obj[this.name].date > TIME * 60000)
			this.update()
	}

	Module.showCached = function (data) {
		console.log('Showing cached ' + this.name)
		this.updateUI(data)
	}

	Module.update = function (/** @private */ url, /** @private */ param, /** @private */ type) {
		console.log('Requesting ' + this.name)
		$ajax.get(url, param, type).success(this.success.bind(this)).error(this.error.bind(this))
	}

	Module.success = function (/** xmlDoc */) {}

	Module.error = function (message) {
		console.error('Failed ' + this.name + ' request. ' + message)
		if (this.html)
			this.showCached(this.html)
	}

	Module.updateUI = function (/** data */) {
		//this.ui_.addMoreLink(news.url)
		this.ui_.addToDOM()
	}

	App.prototype.Module = Class.extend(Module)


	/************************************************************************************\
	|   Represents the UI namespace and the core functions for modules to inherit.                 |
	\ ************************************************************************************/
	var ModuleUI = {}

	/**
	 * Constructor.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 * @param  	{String}   	name 	ID to identify the box
	 */
	ModuleUI.init = function (name) {
		this.html = ''
		this.content = name + ' > .box__content'
	}

	/**
	 * Adds a heading.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-07-23
	 * @param  	{String}   	url
	 * @param  	{String}   	title
	 */
	ModuleUI.addHeading = function (/** url, title */) {}

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


	/**
	 * Initiates the App and makes it public.
	 */
	window.App = new App()
}(window, $, qwest, Class)
