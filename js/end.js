(function (window) {
	'use strict'

	if (document.getElementById('main-cards') !== null)
		window.App.close()
	else {
		var observer = new MutationObserver(function (mutations) {
			if (mutations && mutations[0] && mutations[0].addedNodes && mutations[0].addedNodes[0].id === 'main-cards') {
				window.App.close()
				observer.disconnect()
			}
		})

		document.addEventListener('readystatechange', function () {  // document_start guarantees this is injected before the DOM is available, so this will fire on interactive
			observer.observe(document.body, { childList: true })
		}, { once: true })
	}
} (window));
