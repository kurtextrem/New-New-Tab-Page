+function (window, $, $ajax) {
	'use strict';

	var Module = function () {

	}

	Module.prototype.name = 'weather'

	Module.prototype.storageKeys = []

	Module.prototype.init = function (obj) {

	}

	window.App.register(new Module())
}(window, $, qwest)
