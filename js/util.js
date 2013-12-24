var util = {};

util.getVersion = function() {
	return parseInt(navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
}

util.getOS = function() {
	if (navigator.appVersion.indexOf('Linux') != -1) {
		return 'linux';
	} else if (navigator.appVersion.indexOf('CrOS') != -1) {
		return 'cros';
	} else if (navigator.appVersion.indexOf('Mac OS X') != -1) {
		return 'mac';
	} else {
		return 'other';
	}
}

util.showError = function(e) {
	console.error('Error:', e);
};

util.makeURL = function(base, params) {
	var paramStrings = [];
	for (var key in params) {
		paramStrings.push(key + '=' + encodeURIComponent(params[key]));
	}

	if (paramStrings.length > 0) {
		return base + '?' + paramStrings.join('&');
	} else {
		return base;
	}
};

util.domainFromURL = function(url) {
	var matches = url.match(/^(\w+)\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	if (!matches)
		return null;

	var protocol = matches[1];
	var domain = matches[2];

	if (protocol !== 'http' && protocol !== 'https')
		return null;

	if (domain.indexOf('www.') === 0) {
		return domain.substring(4);
	} else {
		return domain;
	}
};

util.protocolAndDomainFromURL = function(url) {
	var matches = url.match(/^(\w+\:\/\/[^\/?#]+)(?:[\/?#]|$)/i);
	return matches && matches[1];
};

util.updateRetryDelay = function(delay) {
	if (delay < 3600 * 1000) {
		return delay * 1.5;
	} else {
		return 3600 * 1000;
	}
};

/**
 * Resize the image using Lanczos3 algorithm.
 * @param {string} imageUrl Initial image.
 * @param {number} newWidth The new width. The ratio is preserved.
 * @param {Function(string)} callback
 */
util.scaleImage = function(imageUrl, newWidth, callback) {
	var image = new Image();

	image.onload = function() {
		var canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
		var newHeight = Math.round(newWidth * image.height / image.width);

		util.scaleCanvas(canvas, newWidth, newHeight);

		callback(canvas.toDataURL());
	};

	image.src = imageUrl;
};

util.blurCanvas = function(canvas, size) {
	var blurredCanvas = document.createElement('canvas');
	blurredCanvas.width = canvas.width;
	blurredCanvas.height = canvas.height;
	var ctx = blurredCanvas.getContext('2d');
	var size = Math.round(size);
	var sigma = size / 6;

	var c = 1 / (sigma * Math.sqrt(2 * Math.PI));
	var sum = 0;

	ctx.globalCompositeOperation = 'lighter';

	for (var x = -size; x < size + 1; x++) {
		sum += c * Math.exp(-(x * x) / (2 * sigma * sigma));
		ctx.globalAlpha = c * Math.exp(-(x * x) / (2 * sigma * sigma));
		ctx.drawImage(canvas, x, 0);
	}

	canvas = blurredCanvas;

	blurredCanvas = document.createElement('canvas');
	blurredCanvas.width = canvas.width;
	blurredCanvas.height = canvas.height;
	ctx = blurredCanvas.getContext('2d');

	ctx.globalCompositeOperation = 'lighter';

	for (var y = -size; y < size + 1; y++) {
		ctx.globalAlpha = c * Math.exp(-(y * y) / (2 * sigma * sigma));
		ctx.drawImage(canvas, 0, y);
	}

	return blurredCanvas;
};

/**
 * Scale canvas in place.
 */
util.scaleCanvas = function(canvas, newWidth, newHeight) {
	canvas = util.blurCanvas(canvas, 1 * canvas.width / newWidth);
	var ctx = canvas.getContext('2d');
	var src = ctx.getImageData(0, 0, canvas.width, canvas.height);

	// Set alpha to 1.
	for (var i = 3; i < src.data.length; i += 4)
		src.data[i] = 255;

	var dest1 = {height: src.height,
		width: newWidth,
		data: new Array(src.height * newWidth * 4)};
	util.doScaleX_(src, dest1);
	dest1 = util.transpose_(dest1);

	var dest2 = {height: dest1.height,
		width: newHeight,
		data: new Array(dest1.height * newHeight * 4)};
	util.doScaleX_(dest1, dest2);
	dest2 = util.transpose_(dest2);

	canvas.width = newWidth;
	canvas.height = newHeight;
	ctx = canvas.getContext('2d');
	var dest = ctx.getImageData(0, 0, newWidth, newHeight);
	for (var i = 0; i < dest.data.length; i++) {
		var v = dest2.data[i];
		if (v < 0) {
			dest.data[i] = 0;
		} else if (v > 255) {
			dest.data[i] = 255;
		} else {
			dest.data[i] = Math.round(v);
		}
	}
	ctx.putImageData(dest, 0, 0);

	return canvas;
};

util.transpose_ = function(src) {
	var dest = {width: src.height,
		height: src.width,
		data: new Array(src.data.length)};
	for (var x = 0; x < src.width; x++) {
		for (var y = 0; y < src.height; y++) {
			var i = 4 * (y * src.width + x);
			var j = 4 * (x * src.height + y);
			dest.data[j] = src.data[i];
			dest.data[j + 1] = src.data[i + 1];
			dest.data[j + 2] = src.data[i + 2];
			dest.data[j + 3] = src.data[i + 3];
		}
	}

	return dest;
};

util.LANCZOS_SIZE = 3;

util.lanczosKernel_ = function(x) {
	if (x < 0)
		x = -x;
	if (x < 1E-10)
		return 1;
	if (x >= util.LANCZOS_SIZE)
		return 0;
	x *= Math.PI;
	return (util.LANCZOS_SIZE * Math.sin(x) * Math.sin(x / util.LANCZOS_SIZE)) /
		(x * x);
};

util.doScaleX_ = function(src, dest) {
	if (src.height !== dest.height) {
		console.error('The height does not match in one-dimension scale.');
		return;
	}
	var ratio = (dest.width - 1) / (src.width - 1);
	var j = 0;
	for (var y = 0; y < dest.height; y++) {
		for (var xnew = 0; xnew < dest.width; xnew++) {
			var x = xnew / ratio;
			dest.data[j] = 0;
			dest.data[j + 1] = 0;
			dest.data[j + 2] = 0;
			dest.data[j + 3] = 0;
			var sum_weight = 0;
			for (var xi = Math.ceil(x - util.LANCZOS_SIZE);
				xi < x + util.LANCZOS_SIZE;
				xi += 1) {
				if (xi >= 0 && xi < src.width) {
					var i = 4 * (y * src.width + xi);
					var weight = util.lanczosKernel_(xi - x);
					sum_weight += weight;
					dest.data[j] += weight * src.data[i];
					dest.data[j + 1] += weight * src.data[i + 1];
					dest.data[j + 2] += weight * src.data[i + 2];
					dest.data[j + 3] += weight * src.data[i + 3];
				}
			}

			dest.data[j] /= sum_weight;
			dest.data[j + 1] /= sum_weight;
			dest.data[j + 2] /= sum_weight;
			dest.data[j + 3] /= sum_weight;

			j += 4;
		}
	}
};

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 */
util.rgbToHsl = function(rgb) {
	var r = rgb[0], g = rgb[1], b = rgb[2];
	r /= 255;
	g /= 255;
	b /= 255;
	var max = Math.max(r, g, b);
	var min = Math.min(r, g, b);
	var l = (max + min) / 2;
	var h, s;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return [h, s, l];
};

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 */
util.hslToRgb = function(hsl) {
	var h = hsl[0], s = hsl[1], l = hsl[2];
	function hue2rgb(p, q, t) {
		if (t < 0)
			t += 1;
		if (t > 1)
			t -= 1;
		if (t < 1 / 6)
			return p + (q - p) * 6 * t;
		if (t < 1 / 2)
			return q;
		if (t < 2 / 3)
			return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}

	var r, g, b;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [r * 255, g * 255, b * 255];
};

util.rgbToCss = function(rgb) {
	var css = '#';
	for (var i = 0; i < 3; i++) {
		var v = Math.round(rgb[i]).toString(16);
		if (v.length === 1)
			v = '0' + v;
		css += v;
	}

	return css;
};

util.dominantColors.prototype = {
	get: function(a, b, c) {
		var d = new Image;
		d.onload = function() {
			var a = document.createElement("canvas");
			a.width = d.width;
			a.height = d.height;
			var e = a.getContext("2d");
			e.drawImage(d, 0, 0);
			for (var a = e.getImageData(0, 0, a.width, a.height), e = [], g = 0; g < a.data.length; g += 4)
				e.push(dominantColors.alphaCompose([a.data[g], a.data[g + 1], a.data[g + 2], a.data[g + 3]]));
			a = dominantColors.getClusterCenters_(e, b);
			c(a)
		};
		d.src = a
	},
	alphaCompose: function(a) {
		for (var b = [], c = a[3] / 255, d = 0; 3 > d; d++)
			b.push(Math.round(a[d] * c + 255 *
				(1 - c)));
		return b
	},
	NTRIES: 10,
	getClusterCenters_: function(a, b) {
		var c, d;
		a = a.sort();
		var f = [a[0]],
			e = [1];
		for (c = 1; c < a.length; c++)
			a[c - 1] < a[c] ? (f.push(a[c]), e.push(1)) : e[e.length - 1] += 1;
		var g = f.length;
		if (g <= b) {
			d = [];
			for (c = 0; c < g; c++)
				d.push(c);
			d = d.sort(function(a, b) {
				return e[b] - e[a]
			});
			d = [];
			for (c = 0; c < g; c++)
				d.push(f[c]);
			return d
		}
		g = dominantColors.getClusterCentersForCountedPoints_(f, e, b);
		d = [];
		for (c = 0; c < g.length; c++)
			d.push(f[g[c]]);
		return d
	},
	randomSubset: function(a, b) {
		if (b >= a)
			throw "Required random subset of size >= size of the set.";
		for (var c = [], d = 0; d < b; d++) {
			for (; ; ) {
				for (var f = Math.floor(a * Math.random()), e = 0; e < c.length && f !== c[e]; e++)
					;
				if (e === c.length)
					break
			}
			c.push(f)
		}
		return c
	},
	dist_: function(a, b) {
		for (var c = 0, d = 0; d < a.length; d++)
			c += Math.abs(a[d] - b[d]);
		return c
	},
	findClustersByCenters_: function(a, b) {
		for (var c = [], d = 0; d < b.length; d++)
			c.push([]);
		for (d = 0; d < a.length; d++) {
			for (var f = 0, e = dominantColors.dist_(a[d], a[b[0]]), g = 1; g < b.length; g++) {
				var h = dominantColors.dist_(a[d], a[b[g]]);
				h < e && (e = h, f = g)
			}
			c[f].push(d)
		}
		return c
	},
	findClusterCenter_: function(a, b, c) {
		for (var d = null, f = 1E10, e = 0; e < c.length; e++) {
			for (var g = a[c[e]], h = 0, j = 0; j < c.length; j++)
				h += b[c[j]] * dominantColors.dist_(g, a[c[j]]);
			h < f && (f = h, d = c[e])
		}
		return d
	},
	getClusterCentersForCountedPoints_: function(a, b, c) {
		for (var d, f = a.length, e, g, h = 0; h < dominantColors.NTRIES; h++) {
			e = dominantColors.randomSubset(f, c).sort();
			for (var j = 0; 10 > j; j++) {
				g = dominantColors.findClustersByCenters_(a, e);
				e = [];
				for (d = 0; d < c; d++)
					e.push(dominantColors.findClusterCenter_(a, b, g[d]))
			}
		}
		g = dominantColors.findClustersByCenters_(a, e);
		a = [];
		for (d = 0; d < c; d++)
			a.push(d);
		a.sort(function(a, b) {
			return g[b].length - g[a].length
		});
		b = [];
		for (d = 0; d < c; d++)
			b.push(e[a[d]]);
		return b
	}
};

/**
 * @param {string} event
 */
util.sendEventToAllWindows = function(ev) {
	var windows = chrome.extension.getViews()//, doc
	for (var i = 0; i < windows.length; i++) {
		// doc =
		windows[i].jQuery.event.trigger(ev)
	}
};
