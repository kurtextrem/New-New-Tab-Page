!function (window) {
	'use strict'

	/** @see ntp.js */
	var Module = {}

	/** @see ntp.js */
	Module.name = 'dayBackground'

	/** @see ntp.js */
	Module.storageKeys = []

	/** @see ntp.js */
	Module.init = function (obj) {
		this.ui = new ModuleUI('#lga', obj.clockOptions.dayBackground)

		this.update()
	}

	/** @see ntp.js */
	Module.update = function () {
		this.updateUI(window.App.date.getHours())
	}

	/** @see ntp.js */
	Module.updateUI = function (data) {
		this.ui.addHTML(data)
		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = {}

	/** @see ntp.js */
	ModuleUI.init = function (name, options) {
		this._super(name, options, true)
	}

	/** @see ntp.js */
	ModuleUI.addHTML = function (timestamp) {
		this.html = this.options + '_' + this.determine(timestamp)
	}

	/**
	 * Determines which background image to use.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-09-06
	 * @param  	{Int}	    	timestamp
	 * @return 	{String}
	 */
	ModuleUI.determine = function (timestamp) {
		switch (true) {
			case timestamp > 10 && timestamp < 19: // 11h - 18h (7h)
				return 'Day'
			case timestamp > 4 && timestamp < 11: // 5h - 10h (5h)
				return 'Dawn'
			case timestamp > 22 && timestamp < 5: // 23h - 4h (5h)
				return 'Night'
			case timestamp > 18 && timestamp < 23: // 19h - 22h (3h)
				return 'Dusk'

			default:
				return 'Day'
		}
	}

	/** @see ntp.js */
	ModuleUI.addToDOM = function (html) {
		html = html || this.html
		$(this.content).addClass(html)
	}

	/** @see ntp.js */
	ModuleUI = window.App.ModuleUI.extend(ModuleUI)

	/** @see ntp.js */
	window.App.register(Module)
}(window)
