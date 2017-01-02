(function (window) {
	'use strict'

	if (document.getElementById('main-cards') !== null)
		window.App.close()
	else {
		var observer = new MutationObserver(function (mutations) {
			if (document.getElementById('main-cards') !== null) {
				window.App.close()
				observer.disconnect()
			}
		})

		document.addEventListener('readystatechange', function ready() {
			if (document.readyState === 'interactive') {
				observer.observe(document.body, { childList: true })
				document.removeEventListener('readystatechange', ready)
			}
		})
	}
} (window));
