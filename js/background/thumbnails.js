'use strict';
function Thumbnails() {
}

Thumbnails.WIDTH = 214; // 120
Thumbnails.HEIGHT = 134; // 80

Thumbnails.prototype.init = function() {
	chrome.tabs.onUpdated.addListener(this.delayedCheckVisibleTab_.bind(this))
	chrome.tabs.onActivated.addListener(this.delayedCheckVisibleTab_.bind(this))
}

Thumbnails.CHROME_SCALING = false;

/**
 * We wait for 500 ms before checking the tab and making the snapshot to
 * give time to the renderer to show the page.
 */
Thumbnails.prototype.delayedCheckVisibleTab_ = function() {
	setTimeout(this.checkVisibleTab_.bind(this), 500);
};

Thumbnails.prototype.checkVisibleTab_ = function() {
	chrome.tabs.query(
		{active: true, lastFocusedWindow: true},
	function(tabs) {
		if (tabs.length !== 1)
			return;
		this.checkTab_(tabs[0]);
	}.bind(this));
};

Thumbnails.prototype.stripUrl_ = function(url) {
	return url.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/$/, '')
};

Thumbnails.prototype.checkTab_ = function(tab) {
	if (!tab.active || !tab.url || tab.status !== 'complete' ||
		tab.url.indexOf('http') !== 0)
		return;

	var url = this.stripUrl_(tab.url);
	var request = {};
	var key = 'thumbnail-' + url;
	request[key] = null;
	chrome.storage.local.get(request, function(res) {
		var thumbnail = res[key];
		if (!thumbnail ||
			Date.now() - thumbnail.lastDownloaded < 1000 * 60 * 60 * 24 ||
			!tab.active ||
			this.stripUrl_(tab.url) !== url)
			return;

		chrome.tabs.captureVisibleTab(
			tab.windowId, {format: 'png'}, this.onTabCapture_.bind(this, tab.url));
	}.bind(this));
};

Thumbnails.prototype.onTabCapture_ = function(url, dataurl) {
	//console.log('Thumbnails.onTabCapture_', url);
	this.cropAndResize_(dataurl, Thumbnails.WIDTH, Thumbnails.HEIGHT,
		this.set.bind(this, url))
};

Thumbnails.prototype.cropAndResize_ = function(imageUrl, width, height, callback) {
	var image = new Image()
	image.onload = function() {
		var w, h;
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		if (Thumbnails.CHROME_SCALING) {
			if (image.width * Thumbnails.HEIGHT > image.height * Thumbnails.WIDTH) {
				h = Thumbnails.HEIGHT;
				w = Math.round(h * image.width / image.height);
			} else {
				w = Thumbnails.WIDTH;
				h = Math.round(w * image.height / image.width);
			}

			image.width = w;
			image.height = h;

			canvas.width = Thumbnails.WIDTH;
			canvas.height = Thumbnails.HEIGHT;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(image, 0, 0, Thumbnails.WIDTH, Thumbnails.HEIGHT);
		} else {
			if (image.width * Thumbnails.HEIGHT > image.height * Thumbnails.WIDTH) {
				h = image.height;
				w = Math.round(h * Thumbnails.WIDTH / Thumbnails.HEIGHT);
			} else {
				w = image.width;
				h = Math.round(w * Thumbnails.HEIGHT / Thumbnails.WIDTH);
			}

			canvas.width = w;
			canvas.height = h;
			ctx.drawImage(image, 0, 0, w, h);
			canvas = util.scaleCanvas(canvas, Thumbnails.WIDTH, Thumbnails.HEIGHT);
		}

		callback(canvas.toDataURL());
	}.bind(this);
	image.src = imageUrl
};

Thumbnails.prototype.set = function(url, image) {
	var key = 'thumbnail-' + url;
	var request = {};
	request[key] = null;
	chrome.storage.local.get(request, function(res) {
		var thumbnail = res[key];
		if (!thumbnail) {
			//console.error('Can\'t find thumbnail that should be present in storage.');
			return;
		}
		thumbnail.lastDownloaded = Date.now();
		thumbnail.image = image;
		chrome.storage.local.set(res);
	}.bind(this));
};

var thumbnails = new Thumbnails()
