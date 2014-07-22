/* global Notification */
+function (window, $, $ajax) {
	'use strict';

	function Module() {
		this.instanceID = null
		this.permission = 0
	}

	Module.prototype.name = 'gmail'

	Module.prototype.storageKeys = [{
		name: 'gmailID',
		type: 0
	}, {
		name: 'gmailLastUpdate',
		type: 0
	}, {
		name: 'gmailCount',
		type: 0
	}]

	Module.prototype.init = function (obj) {
		this.requestPermission(function () {})
		if (!obj.gmailID) {
			this.instanceID = 'gmc' + parseInt(Date.now() * Math.random(), 10)
			chrome.storage.local.set({
				gmailID: obj.gmailID
			})
		}
		this.gmailCount = obj.gmailCount
		this.gmailLastUpdate = obj.gmailLastUpdate
	}

	Module.prototype.requestPermission = function (cb) {
		if (this.permission)
			return cb()
		Notification.requestPermission(function (status) {
			this.permission = status === 'granted'
			cb()
		}.bind(this))
	}

	Module.prototype.update = function () {
		$ajax.get('https://mail.google.com/mail/feed/atom', {
			zx: this.instanceID
		}, {
			type: 'xml'
		}).success(function (res) {
			chrome.storage.local.set({
				gmailLastUpdate: window.App.now,
				gmailCount: this.parseData(res)
			})
		}.bind(this)).error(this.error_.bind(this))
		// xhr.open("GET", url, true,"u","1");
	}


	Module.prototype.parseData = function (xmlDoc) {
		var items = xmlDoc.getElementsByTagName('item'),
		entries = xmlDoc.getElementsByTagName('entry'),
		data = {
			count: entries.length,
			title: entries.getElementsByTagName('title'),
			fullcount: items.getElementsByTagName('fullcount'),
			sub_title: items.getElementsByTagName('title'),
			author: entries.getElementsByTagName('author'),
			url: entries.getElementsByTagName('link')
		}

		if (data.count) {
			this.requestPermission(this.showNotification.bind(this, data.count))
		}
		return data.count
	}

	Module.prototype.showNotification = function (count) {
		var opt = {
			tag: 'gmail-notification' + window.App.now,
			lang: window.App.lang,
			title: 'You have new unread emails',
			body: count + ' new email.',
			iconUrl: chrome.extension.getURL('img/icon-48.png')
		},
		notification = new Notification(opt.title, opt)
		.onclick(function () {
			chrome.tabs.create({ url: 'http://mail.google.com/' })
			notification.close()
		})
	}

	window.App.register(new Module())
}(window, $, qwest)
