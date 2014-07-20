+function (window, $) {
	'use strict';

	var App = function () {
		this.checkResolution()
		this.addMissingDOM()
		this.loadBoxes()
		$.fn.ready(function () {
			window.setTimeout(this.addClasses.bind(this), 400)
		}.bind(this))
	}

	App.prototype.addMissingDOM = function () {
		$('#mngb').append('<div><div style="float:left;padding-left:10px;height:60px;min-width:0;padding-left:10px;" class="gb_Z gb_Ac gb_e gb_Dc"><img alt="Chrome" src="chrome-search://theme/IDR_PRODUCT_LOGO"></div></div>')
	}

	App.prototype.loadBoxes = function () {
		var xhr = new XMLHttpRequest()
		xhr.open('GET', chrome.extension.getURL('boxes.html'), false)
		xhr.send()

		if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
			$('body').append(xhr.responseText)
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

	window.App =  new App()
} (window, $)
