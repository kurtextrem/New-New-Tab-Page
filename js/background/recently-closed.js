'use strict';
// https://developer.chrome.com/extensions/sessions
function RecentlyClosed() {
	if (sessionStorage['map'] === undefined)
		sessionStorage['map'] = '{}'
}

RecentlyClosed.ITEMS = 4

RecentlyClosed.prototype.init = function() {
	sessionStorage['RecentlyClosed'] = true
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
		if (changeInfo.status == 'complete') {
			var parse = JSON.parse(sessionStorage['map'])
			parse[tab.id] = tab
			sessionStorage['map'] = JSON.stringify(parse)
		}
	}.bind(this))
	chrome.tabs.onRemoved.addListener(function(id){
		this.retrieveInfo(id)
	}.bind(this))
}

RecentlyClosed.prototype.retrieveInfo = function(id) {
	var tab = JSON.parse(sessionStorage['map'])[id]
	if (tab !== undefined)
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
