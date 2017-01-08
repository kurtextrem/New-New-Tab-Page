/* global Intl */
(function (window) {
	'use strict'

	class Module extends window.Module {
		/** @see ntp.js */
		static get name () { return 'clock' }

		/** @see ntp.js */
		static get storageKeys() {
			return [{
				name: 'clockOptions',
				type: {
					twelveHours: false,
					dayBackground: 'Beach'
				}
			}]
		}

		/** @see ntp.js */
		constructor (obj) {
			super(obj, Module.name) // always call super first, if we don't `this` === undefined

			this.ui = new ModuleUI(this.name, obj[this.name + 'Options'])

			this.update()
			window.setInterval(function () {
				window.App.updateTimestamp()
				this.update(obj)
			}.bind(this), 25000)
		}

		/** @see ntp.js */
		update () {
			this.updateUI(window.App.date)
		}
	}


	/************\
	|  UI Section   |
	\************/

	class ModuleUI extends window.ModuleUIExtended {
		/** @see ntp.js */
		constructor (name, options) {
			super(name, options) // always call super first, if we don't `this` === undefined

			this.formatter = Intl.DateTimeFormat(window.App.lang, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				weekday: 'long'
			})
		}

		/** @see ntp.js */
		buildContent (timestamp) {
			if (!(timestamp instanceof Date)) timeestamp = window.App.date

			var hours = timestamp.getHours(), postfix = this.options.twelveHours ? 'am' : ''
			if (this.options.twelveHours && hours > 12) {
				hours = hours - 12
				postfix = 'pm'
			}
			this.html += '<span class="clock__hours">' + ('0' + hours).slice(-2) + '</span><span class="clock__minutes">' + ('0' + timestamp.getMinutes()).slice(-2) + '</span><span class="clock__postfix">' + postfix + '</span><div class="clock__date">' + this.formatter.format(timestamp) + '</div>'
		}
	}

	/** @see ntp.js */
	window.App.register(Module)

}(window));
