+function (window, $) {
	'use strict';

	var App = function () {
		this.addMissingDOM()
		this.loadBoxes()
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

	window.App =  new App()
} (window, $)
