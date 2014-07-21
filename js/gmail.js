+function (window, $, $ajax) {
	'use strict';

	var Module = function () {
		this.instanceID = null
	}

	Module.prototype.name = 'gmail'

	Module.prototype.storageKeys = [{
		name: 'gmailID',
		type: null
	}, {
		name: 'gmailLastUpdate',
		type: null
	}, {
		name: 'gmailCount',
		type: 0
	}]

	Module.prototype.init = function (obj) {
		if (!obj.gmailID) {
			this.instanceID = 'gmc' + parseInt(Date.now() * Math.random(), 10)
			chrome.storage.local.set({
				gmailID: obj.gmailID
			})
		}
		this.gmailCount = obj.gmailCount
		this.gmailLastUpdate = obj.gmailLastUpdate
		if (window.App.now - this.gmailLastUpdatec > 5 * 60000)
			this.update()
		return window.setInterval(function () {
			this.startRetrieval()
		}.bind(this), 5 * 60000)
	}

	Module.prototype.update = function () {
		$ajax.get('https://mail.google.com/mail/feed/atom', {
			zx: this.instanceID
		}, {
			type: 'xml'
		}).success(function (res) {
			chrome.storage.local.set({
				gmailLastUpdate: App.now,
				gmailCount: this.parseData(res)
			})
		}.bind(this)).error(this.error_.bind(this))
		// xhr.open("GET", url, true,"u","1");
	}


	Module.prototype.parseData = function (xmlDoc) {
		var items = xmlDoc.querySelectorAll('item'),
			count = items.querySelectorAll('entry > summary').length

			/*var GmailData = {
			'summary': $xml.find('entry').find('summary'),
			'title': $xml.find('entry').find('title'),
			'count': $xml.find('fullcount'),
			'sub_title': $xml.find('title'),
			'name': $xml.find('entry').find('author').find('name'),
			'email': $xml.find('entry').find('author').find('email'),
			'url': $xml.find('entry').find('link')
		}*/

		if (count) {
			var opt = {
				type: 'basic',
				title: 'You have new unread emails',
				message: count + ' new email.',
				iconUrl: chrome.extension.getURL('img/icon-48.png')
			}
			chrome.notifications.create('gmail-notification', opt, function (ID) {
				chrome.notifications.onClicked.addListener(function (a) {
					chrome.tabs.create({
						//url: 'http://gmail.com'
					})

					chrome.notifications.clear(a, function () {})
				})
			})
		}
		return count
	}

	window.App.register(new Module())
}(window, $, qwest)
