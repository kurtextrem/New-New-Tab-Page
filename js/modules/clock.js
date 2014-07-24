/* global Intl */
+function (window) {
	'use strict';

	/** @see ntp.js */
	var Module = {}

	/** @see ntp.js */
	Module.name = 'clock'

	/** @see ntp.js */
	Module.storageKeys = [{
		name: 'clock',
		type: {
			twelveHours: false
		}
	}]

	/** @see ntp.js */
	Module.init = function (obj) {
		this.ui_ = new ModuleUI('#box-' + this.name, obj[this.name])

		this.update()
		window.setInterval(function () {
			window.App.now = Date.now()
			this.update(obj)
		}.bind(this), 25000)
	}

	/** @see ntp.js */
	Module.update = function () {
		this.updateUI(window.App.now)
	}

	/** @see ntp.js */
	Module.updateUI = function (data) {
		this.ui_.addHTML(data)
		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = {}

	/** @see ntp.js */
	ModuleUI.init = function (name, options) {
		this.options = options
		this.formatter = Intl.DateTimeFormat(window.App.lang, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long'
		})
		this._super(name)
	}

	/** @see ntp.js */
	ModuleUI.addHTML = function (timestamp) {
		this.html = ''
		timestamp = new Date(timestamp)

		var hours = timestamp.getHours(), postfix = this.options.twelveHours ? 'am' : ''
		if (this.options.twelveHours && hours > 12) {
			hours = hours - 12
			postfix = 'pm'
		}
		this.html += '<span class="clock__hours">' + ('0' + hours).slice(-2) + '</span><span class="clock__minutes">' + ('0' + timestamp.getMinutes()).slice(-2) + '</span><span class="clock__postfix">' + postfix + '</span><div class="clock__date">' + this.formatter.format(timestamp) + '</div>'
	}

	ModuleUI = window.App.ModuleUI.extend(ModuleUI)

	window.App.register(Module)
}(window)
