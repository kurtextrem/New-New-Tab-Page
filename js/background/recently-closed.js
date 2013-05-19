function RecentlyClosed() {
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
		if (changeInfo.status == "complete")
			this.map[tab.id] = tab
	}.bind(this))
	chrome.tabs.onRemoved.addListener(function(id){
		this.retrieveInfo(id)
	}.bind(this))
}

RecentlyClosed.ITEMS = 4
RecentlyClosed.prototype.last = RecentlyClosed.ITEMS + 1
RecentlyClosed.prototype.map= {}

RecentlyClosed.prototype.retrieveInfo = function(id) {
	var tab = this.map[id]
	if (typeof (tab) != "undefined")
		this.store(tab.url, tab.title, tab.favIconUrl)
}
RecentlyClosed.prototype.store = function(url, title, faviconUrl) {
	var key = 'recentlyClosed'
	chrome.storage.local.get(key, function(res) {
		this.last--
		if (this.last < 0)
			this.last = RecentlyClosed.ITEMS
		//if (!item) {
			//console.error('Can\'t find tab that should be present in storage.');
		//	return
		//}
		if (typeof(res['recentlyClosed']) == "undefined")
			res['recentlyClosed'] = {}
		res['recentlyClosed'][this.last] = {
			url: url,
			title: title,
			faviconUrl: faviconUrl
		}
		chrome.storage.local.set(res)
	}.bind(this))
}

RecentlyClosed.prototype.get = function(callback) {
	var key = 'recentlyClosed'
	chrome.storage.local.get(key, function(res) {
		if (typeof(res['recentlyClosed']) == 'undefined')
			return
		callback(res['recentlyClosed'])
	}.bind(this));
}

var recentlyClosed = new RecentlyClosed()