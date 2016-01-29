/* global console */
!function (window) {
	'use strict'

	var App = window.App,
		$ajax = window.qwest

	/**
	 * http://codepen.io/fleeting/pen/Idsaj
	 * https://github.com/CyanogenMod/android_packages_apps_LockClock/blob/cm-12.0/res/values-de/strings.xml
	 */
	/**
	 * Constants used in the constructor.
	 */
	var TIME = 60, // Yahoo TTL
		URL = 'https://query.yahooapis.com/v1/public/yql',
		TYPE = {
			responseType: 'json',
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

	Module.TEXT = [
		chrome.i18n.getMessage('N'), // 0
		chrome.i18n.getMessage('NE'), // 45
		chrome.i18n.getMessage('E'), // 90
		chrome.i18n.getMessage('SE'), // 135
		chrome.i18n.getMessage('S'), // 180
		chrome.i18n.getMessage('SW'), // 225
		chrome.i18n.getMessage('W'), // 270
		chrome.i18n.getMessage('NW'), // 315
		chrome.i18n.getMessage('N') // 360
	]

	Module.MAP = { 0: 'thunderstorms', 1: 'thunderstorms',2: 'thunderstorms',3: 'thunderstorms',4: 'thunderstorms',5: 'freezing',6: 'freezing',7: 'freezing',8: 'rain_light',9: 'rain_light',10: 'freezing',11: 'rain_heavy',12: 'rain_heavy', 13: 'snow_heavy',14: 'snow_light',15: 'snow_heavy',16: 'snow',17: 'snow_heavy',18: 'freezing',19: 'fog',20: 'fog',21: 'fog',22: 'fog',23: 'windy',24: 'windy',25: 'cloudy',26: 'cloudy',27: 'cloudy',28: 'cloudy',29: 'partly_cloudy',30: 'partly_cloudy',31: 'sunny',32: 'sunny',33: 'sunny',34: 'sunny',35: 'freezing',36: 'hot',37: 'thunderstorms',38: 'thunderstorms',39: 'thunderstorms',40: 'rain_light',41:'snow_heavy',42: 'snow',43: 'snow',44: 'partly_cloudy',45: 'thunderstorms',46: 'snow_heavy',47: 'thunderstorms', 3200: 'unknown' }

	Module.DAYS = { Sun: chrome.i18n.getMessage('sun'), Mon: chrome.i18n.getMessage('mon'), Tue: chrome.i18n.getMessage('tue'), Wed: chrome.i18n.getMessage('wed'), Thu: chrome.i18n.getMessage('thu'), Fri: chrome.i18n.getMessage('fri'), Sat: chrome.i18n.getMessage('sat') }

	/** @see ntp.js */
	Module.init = function (obj) {
		this.location = ''
		this.country = ''
		this.lat = 0
		this.long = 0

		this.ui_ = new ModuleUI('#box-' + this.name, obj[this.name + 'Options'])
		this._super(obj, TIME)
	}

	Module.getLocationName = function () {
		console.log('Requesting location')

		return $ajax.get('https://freegeoip.net/json/', {}, { type: 'json' })
		.then(function (xhr, data) {
			console.log('Location:', data)

			this.location = data.city || localStorage['devloc::swml.location'].slice(1, -1)
			this.country = data.country_code
			this.lat = data.latitude
			this.long = data.longitude
			return data
		}.bind(this))
		.catch(function (err, xhr, response) {
			console.error('Reverse geocoding request failed:', err)

			this.location = localStorage['devloc::swml.location']
			this.location = this.location ? this.location.slice(1, -1) : 'Los Angeles'
			this.country = 'US'
			this.lat = 34.1
			this.long = -118.2
			return xhr
		}.bind(this))
	}

	/** @see ntp.js */
	Module.update = function () {
		console.log('Requesting ' + this.name)

		this.getLocationName()
		.then(this.getWeatherData.bind(this))
	}

	/**
	 * Requests the weather data from Yahoo.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-21
	 */
	Module.getWeatherData = function () {
		$ajax.get(URL, {
			format: 'json',
			rnd: App.date.getFullYear() + App.date.getMonth() + App.date.getDay() + App.date.getHours(),
			diagnostics: true,
			q: 'select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="(' + this.lat + ',' + this.long + ')" limit 1) and u="f"'
		}, TYPE)
		.then(this.success.bind(this)).catch(this.error.bind(this))
	}

	/** @see ntp.js */
	Module.success = function (xhr, json) {
		var items =  json.query.results.channel,
			data = {
				entries: []
			}
		console.log('Got ' + this.name, items)

		data.date = Date.parse(items.item.pubDate.slice(0, -4)) + 60000 * TIME + 60000 // refresh 1min after TTL

		data.location = decodeURIComponent(this.location) || items.location.city
		data.temperature = items.item.condition.temp
		data.icon = this.MAP[+items.item.condition.code] || ('unknown' && console.warn('Unknown condition -- icon', items.item.condition))
		data.condition = chrome.i18n.getMessage(data.icon) || items.item.condition.text
		if (!data.condition)
			console.warn('Unknown condition -- translation', items.item.condition)

		// wind
		data.wind_chill = items.wind.chill
		data.wind_direction = this.TEXT[Math.round(items.wind.direction / 45)]
		data.wind_speed = items.wind.speed

		// atmosphere
		data.humidity = items.atmosphere.humidity
		data.pressure = items.atmosphere.pressure
		data.rising = items.atmosphere.rising
		data.visibility = items.atmosphere.visibility

		// astronomy
		data.sunrise = items.astronomy.sunrise
		data.sunset = items.astronomy.sunset

		if (data.temperature < 80 && data.temperature < 40) {
			data.heatindex = -42.379 + 2.04901523 * data.temperature + 10.14333127 * data.humidity - 0.22475541 * data.temperature * data.humidity - 6.83783 * (Math.pow(10, -3)) * (Math.pow(data.temperature, 2)) - 5.481717 * (Math.pow(10, -2)) * (Math.pow(data.humidity, 2)) + 1.22874 * (Math.pow(10, -3)) * (Math.pow(data.temperature, 2)) * data.humidity + 8.5282 * (Math.pow(10, -4)) * data.temperature * (Math.pow(data.humidity, 2)) - 1.99 * (Math.pow(10, -6)) * (Math.pow(data.temperature, 2)) * (Math.pow(data.humidity, 2))
		} else {
			data.heatindex = items.item.condition.temp
		}

		for (var i = 0; i < items.item.forecast.length; i++) {
			var item = items.item.forecast[i],
			cond = chrome.i18n.getMessage(this.MAP[item.code]) || item.text

			if (!cond) console.warn('Unknown condition -- translation', item.condition)
			data.entries[i] = {
				day: this.DAYS[item.day],
				date: item.date, // @todo: translate
				low: item.low,
				high: item.high,
				icon: this.MAP[item.code]  || ('unknown' && console.warn('Unknown condition -- icon', item.condition)),
				condition: cond
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
		this.ui_.buildContent(data.entries)

		this._super()
	}

	/************\
	|  UI Section   |
	\************/

	/** @see ntp.js */
	var ModuleUI = {}

	/** @see ntp.js */
	ModuleUI.init = function (name, options) {
		this._super(name, options)
	}

	/** @see ntp.js */
	ModuleUI.addHeading = function (title, date) {
		title = window.unescape(title.replace(/"/g, '').replace(/\\u/g, '%u'))
		this._super('<a href="' + location.href.split('/_/')[0] + '/search?q=' + encodeURIComponent(chrome.i18n.getMessage('weather') + ' ' + title) + '">' + title + '</a>', date)
	}

	/** @see ntp.js */
	ModuleUI.buildContent = function (data) {
		this._beginRow()
		var length = Math.min(this.options.amount, data.length)
		for (var i = 0; i < length; i++) {
			this._addHTML(data[i].low, data[i].high, data[i].day, data[i].icon, data[i].condition, data[i].date)
		}
		this._endRow()
	}

	/** @see ntp.js */
	ModuleUI._addHTML = function (low, high, day, icon, condition, date) {
		this.html += '<ul class="weather__data col-lg-2"><li class="weather__data--day" title="' + date + '">' + day + '</li><li class="weather__data--img"><img src="' + this.getIconURL(icon) + '" title="' + condition + '"></li><li class="weather__data--temperature weather__data--high">' + this.convert(high) + '</li><li class="weather__data--temperature weather__data--low">' + this.convert(low) + '</li></ul>'
	}

	/**
	 * Starts a new row.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-09-06
	 */
	ModuleUI._beginRow = function () {
		this.html += '<div class="weather__data--forecast">'
	}

	/**
	 * Ends the row.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-09-06
	 */
	ModuleUI._endRow = function () {
		this.html += '</div>'
	}

	/**
	 * Updates the current weather row.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-09-06
	 * @param  	{[type]}    	icon           	[description]
	 * @param  	{[type]}    	temperature    	[description]
	 * @param  	{[type]}    	condition      	[description]
	 * @param  	{[type]}    	wind_speed     	[description]
	 * @param  	{[type]}    	wind_direction 	[description]
	 * @param  	{[type]}    	humidity       	[description]
	 */
	ModuleUI.updateCurrent = function (icon, temperature, condition, wind_speed, wind_direction, humidity) {
		this.html += '<div class="weather__data--current box__item row">'
		this.html += '<div class="weather__data--img box__img col-lg-5"><img src="' + this.getIconURL(icon) + '"></div>'
		this.html += '<div class="weather__data--temperature box__item--title col-lg-4">' + this.convert(temperature) + '</div>'

		var unit = ''
		if (wind_speed === 0) {
			wind_speed = chrome.i18n.getMessage('windless')
			unit = ''
			wind_direction = ''
		} else {
			wind_speed = ~~wind_speed
			if (this.options.celsius) {
				//wind_speed = (Math.round(wind_speed * 1.609)).toLocaleString()
				unit = chrome.i18n.getMessage('kmh')
			} else
				unit = chrome.i18n.getMessage('mph')
		}

		this.html += '<div class="weather__data--box col-lg-3 col-lg-pull-1"><ul class="weather__data"><li class="weather__data--condition">' + condition + '</li><li class="weather__data--wind" title="' + chrome.i18n.getMessage('wind') + ': ' + wind_direction + ', ' + wind_speed + unit + '">' + wind_speed + '<sup>' + unit + '</sup></li><li class="weather__data--humidity" title="' + chrome.i18n.getMessage('humidity') + ': ' + humidity +  '%">' + humidity + '%</li></ul></div>'
		this.html += '</div>'
	}

	/**
	 * Returns the specific icon url.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-09-06
	 * @param  	{String}    	which 	The icon needed.
	 * @return 	{String}       	icon url
	 */
	ModuleUI.getIconURL = function (which) {
		var hours = App.date.getHours(),
		addition = ''

		if (hours > 19 || hours < 6)
			addition = 'night/'
		else if (this.options.cool)
			addition = 'cool/'

		return chrome.extension.getURL('img/weather/' + addition + which + '.webp')
	}

	/**
	 * Converts Fahrenheit to Celsius if needed.
	 *
	 * @author 	Jacob Groß
	 * @date   	2014-09-06
	 * @param 	{Int}    		fahrenheit
	 * @return 	{Int}
	 */
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
	ModuleUI = App.ModuleUIExtended.extend(ModuleUI)

	App.register(Module)
}(window);
