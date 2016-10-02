(function (window) {
	'use strict'

	class Module extends window.Module {
		/** @see ntp.js */
		static get name () { return 'dayBackground' }

		/** @see ntp.js */
		static get storageKeys() {
			return []
		}

		/** @see ntp.js */
		constructor (obj) {
			super(obj, Module.name)

			this.ui = new ModuleUI('#lga', obj.clockOptions.dayBackground)

			this.update()
		}

		/** @see ntp.js */
		update () {
			this.updateUI(window.App.date.getHours())
		}

		/** @see ntp.js */
		updateUI (data) {
			this.ui.addHTML(data)
			super.updateUI()
		}
	}

	/************\
	|  UI Section   |
	\************/

	class ModuleUI extends window.ModuleUI {
		/** @see ntp.js */
		constructor (name, options) {
			super(name, options, true)
		}

		/** @see ntp.js */
		addHTML (timestamp) {
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
		determine (timestamp) {
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
		addToDOM (html) {
			html = html || this.html
			$(this.content).addClass(html)
		}
	}

	/** @see ntp.js */
	window.App.register(Module)

}(window));
