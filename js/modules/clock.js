+function (window, $, $ajax) {
	'use strict';

	var Module = function () {

	}

	Module.prototype.name = 'clock'

	Module.prototype.storageKeys = []

	Module.prototype.init = function (obj) {

	}

	window.App.register(new Module())
}(window, $, qwest)
