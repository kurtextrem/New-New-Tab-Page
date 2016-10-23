(function (window) {
	'use strict'

	class Module extends window.Module {
		/** @see ntp.js */
		static get name () { return 'notes' }

		/** @see ntp.js */
		static get storageKeys() {
			return [{
				name: 'notesHTML',
				type: ''
			}]
		}

		/** @see ntp.js */
		constructor (obj) {
			super(obj, Module.name, new ModuleUI(Module.name))

			this.updateUI(this.html)
		}
	}

	/************\
	|  UI Section   |
	\************/

	function debounce(callback, timeout, t) {
		timeout = timeout || 2000;
		return function debounce() {
			window.clearTimeout(t);
			t = window.setTimeout(callback, timeout);
		}
	}

	class ModuleUI extends window.ModuleUIExtended {
		/** @see ntp.js */
		constructor (name, options) {
			super(name, options)
		}

		addToDOM (html) {
			html = html || this.html || ''
			this.$content.html(html)

			this.addListener()
		}

		addListener() {
			if (super.addListener()) {
				this.$content.on('input', debounce(function() {
					chrome.storage.local.set({ notesHTML: this.$content.html() })
				}.bind(this)))
			}
		}
	}

	/** @see ntp.js */
	window.App.register(Module)

}(window));
