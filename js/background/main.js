window.addEventListener('load', function() {
	newsFetcher.addListener()
	weatherFetcher.addListener()
	recentlyClosed.init()
	thumbnails.init()
	chrome.alarms.getAll(function(alarms) {
		alarms = alarms.map(function(e) { return e.name })
		if (alarms.indexOf('newsFetcher') === -1)
			newsFetcher.init()
		if (alarms.indexOf('weatherFetcher') === -1)
			weatherFetcher.init()
	})
})
