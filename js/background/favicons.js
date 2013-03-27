function Favicons() {
	this.cache_ = {}
}

Favicons.prototype.get = function(url, callback) {
	var domain = util.protocolAndDomainFromURL(url);
	if (this.cache_[domain]) {
		setTimeout(callback.bind(null, this.cache_[domain].original), 0);
		return;
	}

	var image = new Image();

	image.onload = function() {
		var canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
		var dataURL = canvas.toDataURL();
		this.cache_[domain] = {'original': dataURL};
		setTimeout(callback.bind(null, dataURL), 0);
	}.bind(this);

	image.onerror = function() {
		callback('images/empty.png');
	}.bind(this);

	image.src = domain + '/favicon.ico';
};

Favicons.prototype.getScaled = function(url, width, callback) {
	var domain = util.protocolAndDomainFromURL(url);
	if (this.cache_[domain] && this.cache_[domain][width]) {
		setTimeout(callback.bind(null, this.cache_[domain][width]), 0);
		return;
	}

	this.get(url, this.scale_.bind(this, domain, width, callback));
};

Favicons.prototype.scale_ = function(domain, width, callback, imageUrl) {
	util.scaleImage(imageUrl, width, function(scaledUrl) {
		this.cache_[domain][width] = scaled;
		callback(scaledUrl);
	}.bind(this));
};

var favicons = new Favicons();