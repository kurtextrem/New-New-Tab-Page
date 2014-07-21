+ function (window, $, $ajax) {
	'use strict';

	var App = function () {
		this.now = Date.now()

		this.checkResolution()
		this.addMissingDOM()
		this.loadBoxes()
		$.fn.ready(function () {
			window.setTimeout(this.addClasses.bind(this), 400)
		}.bind(this))
	}

	App.prototype.modules = []

	App.prototype.storageKeys = {}

	App.prototype.loadedObj = {}

	App.prototype.register = function (obj) {
		this.modules.push({
			name: obj.name,
			obj: obj
		})
		var length = obj.storageKeys.length || 1
		while (--length) {
			this.storageKeys[obj.storageKeys[length].name] = obj.storageKeys[length].type
		}
	}

	App.prototype.close = function () {
		chrome.storage.local.get(this.storageKeys, function (obj) {
			this.loadedObj = obj
		}.bind(this))
		console.log('All modules loaded')
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
			this.bootModules()
		}.bind(this))
	}

	App.prototype.bootModules = function () {
		var length = this.modules.length
		while (--length) {
			this.modules[length].obj.init(this.loadedObj)
		}
	}

	App.prototype.checkResolution = function () {
		if (screen.availWidth < 1380) {
			$('#main-cards > .row > .col-lg-3').removeClass('col-lg-offset-1').addClass('col-lg-4')
			$('.mv-row').addClass('col-lg-12')
		}
	}

	App.prototype.addClasses = function () {
		$('#most-visited').addClass('container-fluid')
			.find('#mv-tiles').addClass('row').css('width', 'auto')
			.find('.mv-row').addClass('col-lg-6')
	}

	window.App = new App()
}(window, $, qwest)
