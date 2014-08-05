/* global console, qwest, Intl */
+function (window, $ajax) {
	'use strict';

	/**
	 * Constants used in the constructor.
	 */
	var TIME = 60,
		URL = 'https://ntpserv.appspot.com/weather',
		TYPE = {
			type: 'json',
			cache: true
		}

	/** @see ntp.js */
	var Module = {}

	/** @see ntp.js */
	Module.name = 'weather'

	/** @see ntp.js */
	Module.storageKeys = [{
		name: 'weather',
		type: {
			date: 0
		}
	}, {
		name: 'weatherHTML',
		type: ''
	}, {
		name: 'weatherOptions',
		type: {
			amount: 4,
			celsius: chrome.i18n.getMessage('weather_temperatureUnit') === 'C',
			cool: false
		}
	}]

	Module.TEXT = {
		22.5: chrome.i18n.getMessage('N'),
		67.5: chrome.i18n.getMessage('NE'),
		112.5: chrome.i18n.getMessage('E'),
		157.5: chrome.i18n.getMessage('SE'),
		202.5: chrome.i18n.getMessage('S'),
		247.5: chrome.i18n.getMessage('SW'),
		292.5: chrome.i18n.getMessage('W'),
		337.5: chrome.i18n.getMessage('NW'),
		360: chrome.i18n.getMessage('N')
	}
	Module.MAP = { 0: 'unknown',1: 'heavy_snow',2: 'snow',3: 'light_snow',4: 'freezing',5: 'light_rain',6: 'light_rain',7: 'light_snow',8: 'light_snow',9: 'tstorms',10: 'sunny',11: 'cloudy',12: 'light_rain',13: 'cloudy',14: 'cloudy',15: 'light_rain',16: 'light_snow',17: 'tstorms',18: 'light_rain',19: 'cloudy',20: 'light_rain',21: 'light_rain',22: 'light_rain',23: 'light_rain',24: 'light_rain',25: 'light_snow',26: 'light_snow',27: 'light_snow',28: 'light_rain',29: 'cloudy',30: 'cloudy',31: 'light_rain',32: 'light_rain',33: 'light_rain',34: 'light_rain',35: 'light_snow',36: 'light_snow',37: 'light_snow',38: 'light_rain',39: 'light_rain',40: 'light_rain',41:'light_rain',42: 'light_rain',43: 'sunny',44: 'light_snow',45: 'sunny',46: 'light_rain',47: 'cloudy',48: 'light_rain',49: 'light_snow',50: 'cloudy',51: 'light_rain',52: 'light_snow',53: 'cloudy',54: 'light_rain',55: 'cloudy',56: 'light_rain',57: 'light_rain',58: 'light_rain',59: 'light_rain',60: 'cloudy',61: 'light_snow',62: 'light_snow',63: 'light_rain',64: 'light_rain',65: 'light_rain',66: 'light_snow',67: 'light_snow', 68:'light_snow',69: 'light_rain',70: 'cloudy',71: 'light_rain',72: 'light_rain',73: 'light_rain',74: 'light_rain',75: 'light_snow',76: 'light_snow',77: 'light_snow',78: 'light_snow',79: 'light_rain',80: 'light_rain',81: 'light_rain',82: 'light_snow',83: 'light_snow',84: 'light_snow',85: 'fog',86: 'fog',87: 'heavy_rain',88: 'heavy_snow',89: 'heavy_snow',90: 'freezing',91: 'cloudy',92: 'partly_cloudy',93: 'cloudy',94: 'rain',95: 'light_rain',96: 'light_rain',97: 'rain',98: 'light_rain',99: 'rain',100: 'rain',101: 'light_rain',102: 'light_rain',103: 'light_rain',104: 'rain',105: 'light_rain',106: 'light_rain',107: 'rain',108: 'rain',109: 'rain',110: 'rain',111: 'rain',112: 'rain',113: 'light_rain',114: 'rain',115: 'rain',116: 'light_rain',117: 'snow',118: 'light_snow',119: 'light_snow',120: 'snow',121: 'snow',122: 'snow',123: 'light_snow', 124:'light_snow',125: 'light_snow',126: 'snow',127: 'light_snow',128: 'snow',129: 'snow',130: 'light_snow',131: 'snow',132: 'snow',133: 'snow',134: 'snow',135: 'snow',136: 'snow',137: 'heavy_rain',138: 'sunny',139: 'tstorms',140: 'freezing',141: 'hot',142: 'light_rain',143: 'cloudy',144: 'heavy_rain',145: 'light_snow',146: 'rain',147: 'tstorms',148: 'light_snow',149: 'snow',150: 'heavy_snow',151: 'rain',152: 'fog', 153:'light_rain',154: 'rain',155: 'heavy_rain',156: 'light_snow',157: 'snow',158: 'heavy_snow',159: 'fog',160: 'fog',161: 'fog',162: 'light_rain',163: 'tstorms',165: 'fog',173: 'fog',174: 'cloudy',176: 'rain',177: 'fog',178: 'light_rain',179: 'light_snow',180: 'freezing',181: 'light_snow',182: 'tstorms',183: 'heavy_rain',184: 'light_snow',185: 'fog',186: 'snow',187: 'fog',188: 'light_rain',189: 'fog',190: 'fog',191: 'light_rain',192: 'fog',193: 'rain',194: 'heavy_rain',195: 'fog',196: 'light_snow',197: 'light_snow',198: 'fog',199: 'snow',200: 'rain',201: 'fog',202: 'fog',203: 'fog',204: 'rain',205: 'heavy_rain',206: 'snow',207: 'heavy_rain',208: 'fog',209: 'light_snow',210: 'light_rain',211: 'tstorms',212: 'tstorms',213: 'light_snow',214: 'tstorms',215: 'tstorms',216: 'heavy_snow',217: 'fog',218: 'fog',219: 'light_snow', 220:'light_snow',221: 'fog',222: 'light_snow',223: 'fog',224: 'light_rain',225: 'fog',226: 'fog',227: 'heavy_rain',228: 'fog',229: 'light_snow',230: 'light_snow',231: 'fog',232: 'snow',233: 'fog',234: 'light_rain',236: 'fog',237: 'fog',238: 'light_rain',239: 'light_snow',240: 'light_rain',241: 'light_rain',242: 'light_snow',243: 'fog',245: 'light_snow',246: 'light_rain',247: 'tstorms',248: 'tstorms',249: 'heavy_rain', 250:'tstorms',251: 'tstorms',252: 'tstorms',253: 'fog',254: 'fog',255: 'fog',256: 'snow',257: 'fog',258: 'light_rain',259: 'fog',260: 'freezing',261: 'fog',262: 'partly_cloudy',263: 'fog',264: 'freezing',265: 'freezing',267: 'cloudy',268: 'fog',269: 'light_rain',270: 'light_snow',271: 'heavy_rain',272: 'light_rain',273: 'snow',274: 'heavy_rain',275: 'fog',277: 'snow',278: 'light_rain',279: 'heavy_rain',281: 'tstorms',282: 'heavy_rain',283: 'tstorms',284: 'tstorms',285: 'tstorms',286: 'fog',287: 'fog',288: 'rain',289: 'light_snow',290: 'light_snow',291: 'windy',292: 'tstorms',293: 'light_rain',294: 'light_snow',295: 'tstorms' }

	Module.DAYS = [chrome.i18n.getMessage('sun'), chrome.i18n.getMessage('mon'), chrome.i18n.getMessage('tue'), chrome.i18n.getMessage('wed'), chrome.i18n.getMessage('thu'), chrome.i18n.getMessage('fri'), chrome.i18n.getMessage('sat')]

	/** @see ntp.js */
	Module.init = function (obj) {
		this.location = localStorage['devloc::swml.location'] || 'Los Angeles'

		this.ui_ = new ModuleUI('#box-' + this.name, obj[this.name + 'Options'])
		this._super(obj, TIME)
	}

	/** SSL connection currently not working */
	Module.getLocationName = function (cb) {
		console.log('Requesting location')

		$ajax.get('https://freegeoip.net/json/', {}, { type: 'jsonp', cache: true })
		.success(function (data) {
			console.log('Location: ' + data)

			this.location = data.city
			this.country = data.country_name
			cb({ lat: data.latitude, 'long': data.longitude }, TYPE)
		}.bind(this))
		.error(function (message) {
			console.error('Reverse geocoding request failed: ' + message)
			this.country = 'United States'
			this.location = 'Los Angeles'
			cb({ lat: 34.1, 'long': -118.2 }, TYPE)
		}.bind(this))
	}

	/** @see ntp.js */
	Module.update = function () {
		this._super(URL, {
			lat: localStorage['devloc::web.gws.devloc.lat'] || 34.1,
			'long': localStorage['devloc::web.gws.devloc.lon'] || -118.2
		}, TYPE)
	}

	/** @see ntp.js */
	Module.success = function (json) {
		var items = json.forecast,
			data = {
				entries: []
			}
		console.log('Got ' + items.length + ' ' + this.name)

		data.location = this.location
		data.temperature = json.current.temp_f
		data.humidity = json.current.humidity
		data.icon = this.MAP[json.current.condition] || 'unkown'
		data.date = Date.parse(json.update_time)
		data.condition = chrome.i18n.getMessage(data.icon.replace('_', ''))

		data.wind_speed = json.current.wind_speed_mph
		var wind_direction = json.current.wind_direction
		if (wind_direction < 0 || wind_direction > 360)
			wind_direction = chrome.i18n.getMessage('mixed')
		else {
			wind_direction = this.TEXT[wind_direction] || 'unkown'
		}
		data.wind_direction = wind_direction

		var today = window.App.date.getDate()
		for (var i = 0; i < items.length; i++) {
			var item = items[i],
			date = new Date(item.date)
			if (date.getUTCDate() !== today) {
				data.entries[i - 1] = {
					day: this.DAYS[date.getDay()],
					low: item.low_temp_f,
					high: item.high_temp_f,
					icon: this.MAP[item.condition],
					condition: item.condition
				}
			}
		}

		chrome.storage.local.set({
			weather: data
		}, this.updateUI.bind(this, data))
	}

	/** @see ntp.js */
	Module.updateUI = function (data) {
		if (typeof data === 'string')
			return this.ui_.addToDOM(data)

		this.ui_.addHeading(data.location, data.date)
		this.ui_.updateCurrent(data.icon, data.temperature, data.condition, data.wind_speed, data.wind_direction, data.humidity)

		this.ui_.beginRow()
		var length = Math.min(4, data.entries.length) // @todo: respect option || Math.max(data.entries.length, option.amount)
		for (var i = 0; i < length; i++)
			this.ui_.addHTML(data.entries[i].low, data.entries[i].high, data.entries[i].day, data.entries[i].icon, data.entries[i].condition)
		this.ui_.endRow()

		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = {}

	/** @see ntp.js */
	ModuleUI.init = function (name, options) {
		this.formatter = Intl.DateTimeFormat(window.App.lang, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long',
			hour: '2-digit',
			minute: '2-digit'
		})
		this._super(name, options)
	}

	/** @see ntp.js */
	ModuleUI.addHeading = function (title, date) {
		title = window.unescape(title.replace(/"/g, '').replace(/\\u/g, '%u'))
		this._super('<a href="' + window.location.href.split('/_/')[0] + '/search?q=' + window.encodeURIComponent(chrome.i18n.getMessage('weather') + ' ' + title) + '">' + title + '</a>', this.formatter.format(date))
	}

	/** @see ntp.js */
	ModuleUI.addHTML = function (low, high, day, icon, condition) {
		this.html += '<ul class="weather__data col-lg-2"><li class="weather__data--day">' + day + '</li><li class="weather__data--img"><img src="' + this.getIconURL(icon) + '" title="' + condition + '"></li><li class="weather__data--temperature weather__data--high">' + this.convert(high) + '</li><li class="weather__data--temperature weather__data--low">' + this.convert(low) + '</li></ul>'
	}

	ModuleUI.beginRow = function () {
		this.html += '<div class="weather__data--forecast">'
	}

	ModuleUI.endRow = function () {
		this.html += '</div><!-- /forecast -->'
	}

	ModuleUI.updateCurrent = function (icon, temperature, condition, wind_speed, wind_direction, humidity) {
		this.html += '<div class="weather__data--current box__item row">'
		this.html += '<div class="weather__data--img box__img col-lg-5 "><img src="' + this.getIconURL(icon) + '"></div>'
		this.html += '<div class="weather__data--temperature box__item--title col-lg-4">' + this.convert(temperature) + '</div>'

		var unit = ''
		if (wind_speed === 0) {
			wind_speed = chrome.i18n.getMessage('windless')
			unit = ''
			wind_direction = ''
		} else {
			if (this.options.celsius) {
				wind_speed = (Math.round(wind_speed * 1.609)).toLocaleString()
				unit = chrome.i18n.getMessage('kmh')
			} else
				unit = chrome.i18n.getMessage('mph')
		}

		this.html += '<div class="weather__data--box col-lg-3 col-lg-pull-1"><ul class="weather__data"><li class="weather__data--condition">' + condition + '</li><li class="weather__data--wind" title="' + chrome.i18n.getMessage('wind') + ': ' + wind_direction + ', ' + wind_speed + unit + '">' + wind_speed + '<sup>' + unit + '</sup></li><li class="weather__data--humidity" title="' + chrome.i18n.getMessage('humidity') + ': ' + humidity +  '%">' + humidity + '%</li></ul></div>'
		this.html += '</div>'
	}

	ModuleUI.getIconURL = function (which) {
		var hours = window.App.date.getHours(),
		addition = ''

		if (hours > 19 || hours < 6)
			addition = 'night/'
		else if (this.options.cool)
			addition = 'cool/'

		return chrome.extension.getURL('img/weather/' + addition + which + '.webp')
	}

	ModuleUI.convert = function (fahrenheit) {
		return this.options.celsius ? Math.round(5 * (fahrenheit - 32) / 9) : fahrenheit
	}

	/** @see ntp.js */
	ModuleUI.addToDOM = function (html) {
		chrome.storage.local.set({
			weatherHTML: this._super(html)
		})
	}

	/** @see ntp.js */
	ModuleUI = window.App.ModuleUIExtended.extend(ModuleUI)

	window.App.register(Module)
}(window, qwest);
