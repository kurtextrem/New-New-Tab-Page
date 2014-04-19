$.fn.ready(function() {
	if (!sessionStorage['RecentlyClosed'])
		recentlyClosed.init()
	if (!sessionStorage['Thumbnails'])
		thumbnails.init()
	chrome.alarms.getAll(function(alarms) {
		var alarms = alarms.map(function(e) { return e.name })
		if (alarms.indexOf('newsFetcher') === -1)
			newsFetcher.init()
		if (alarms.indexOf('weatherFetcher') === -1)
			weatherFetcher.init()
	})
})
