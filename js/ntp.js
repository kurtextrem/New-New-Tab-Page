/* global console,qwest */
+function (window, $, $ajax) {
	'use strict';

	var App = function () {
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
		this.modules.push({
			name: obj.name,
			obj: obj
		})
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
			this.modules[length].obj.init(this.loadedObj)
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

	window.App = new App()
}(window, $, qwest)
