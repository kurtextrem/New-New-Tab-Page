'use strict';
function RecentlyClosed() {
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
		if (changeInfo.status == 'complete')
			this.map[tab.id] = tab
	}.bind(this))
	chrome.tabs.onRemoved.addListener(function(id){
		this.retrieveInfo(id)
	}.bind(this))
}

RecentlyClosed.ITEMS = 4
RecentlyClosed.prototype.map= {}

RecentlyClosed.prototype.retrieveInfo = function(id) {
	var tab = this.map[id]
	if (typeof tab != 'undefined')
		this.store(tab.url, tab.title)
}
RecentlyClosed.prototype.store = function(url, title) {
	var key = 'recentlyClosed'
	chrome.storage.local.get(key, function(res) {
		//if (!item) {
			//console.error('Can\'t find tab that should be present in storage.');
		//	return
		//}
		if (typeof res.recentlyClosed == 'undefined' || !$.isArray(res.recentlyClosed))
			res.recentlyClosed = []
		res.recentlyClosed = this.moveForward(res.recentlyClosed)
		res.recentlyClosed[0] = {
			url: url,
			title: title
		}
		chrome.storage.local.set(res, util.sendEventToAllWindows.bind(null, 'tab-closed'))
	}.bind(this))
}

RecentlyClosed.prototype.moveForward = function(array) {
	var newArray = []
	array.forEach(function(elem, i){
		if (i > RecentlyClosed.ITEMS-1) return
		newArray[i+1] = elem
	})
	return newArray
}

RecentlyClosed.prototype.get = function(callback) {
	var key = 'recentlyClosed'
	chrome.storage.local.get(key, function(res) {
		if (typeof(res.recentlyClosed) == 'undefined')
			return
		callback(res.recentlyClosed)
	}.bind(this));
}

var recentlyClosed = new RecentlyClosed()