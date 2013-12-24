/**
 * @constructor
 */
function WeatherFetcher() {
	this.retryDelay_ = 1000;
	this.retryTimeout_ = null;
	this.locationPermission_ = true; // null
	this.interval_ = null;
	this.latitude_ = null;
	this.longitude_ = null;
	this.unit = chrome.i18n.getMessage('temperatureUnit')
	chrome.idle.onStateChanged.addListener(this.init.bind(this));
}

WeatherFetcher.DELAY = 3600 * 1000;
WeatherFetcher.TEXT = [{a: 22.5,text: chrome.i18n.getMessage('N')}, {a: 67.5,text: chrome.i18n.getMessage('NE')}, {a: 112.5,text: chrome.i18n.getMessage('E')}, {a: 157.5,text: chrome.i18n.getMessage('SE')}, {a: 202.5,text: chrome.i18n.getMessage('S')}, {a: 247.5,text: chrome.i18n.getMessage('SW')}, {a: 292.5,text: chrome.i18n.getMessage('W')}, {a: 337.5,text: chrome.i18n.getMessage('NW')}, {a: 360,text: chrome.i18n.getMessage('N')}]
WeatherFetcher.MAP = {0: "unknown.png",1: "heavy_snow.png",2: "snow.png",3: "light_snow.png",4: "freezing.png",5: "light_rain.png",6: "light_rain.png",7: "light_snow.png",8: "light_snow.png",9: "tstorms.png",10: "sunny.png",11: "cloudy.png",12: "light_rain.png",13: "cloudy.png",14: "cloudy.png",
        15: "light_rain.png",16: "light_snow.png",17: "tstorms.png",18: "light_rain.png",19: "cloudy.png",20: "light_rain.png",21: "light_rain.png",22: "light_rain.png",23: "light_rain.png",24: "light_rain.png",25: "light_snow.png",26: "light_snow.png",27: "light_snow.png",28: "light_rain.png",29: "cloudy.png",30: "cloudy.png",31: "light_rain.png",32: "light_rain.png",33: "light_rain.png",34: "light_rain.png",35: "light_snow.png",36: "light_snow.png",37: "light_snow.png",38: "light_rain.png",39: "light_rain.png",40: "light_rain.png",
        41: "light_rain.png",42: "light_rain.png",43: "sunny.png",44: "light_snow.png",45: "sunny.png",46: "light_rain.png",47: "cloudy.png",48: "light_rain.png",49: "light_snow.png",50: "cloudy.png",51: "light_rain.png",52: "light_snow.png",53: "cloudy.png",54: "light_rain.png",55: "cloudy.png",56: "light_rain.png",57: "light_rain.png",58: "light_rain.png",59: "light_rain.png",60: "cloudy.png",61: "light_snow.png",62: "light_snow.png",63: "light_rain.png",64: "light_rain.png",65: "light_rain.png",66: "light_snow.png",67: "light_snow.png",
        68: "light_snow.png",69: "light_rain.png",70: "cloudy.png",71: "light_rain.png",72: "light_rain.png",73: "light_rain.png",74: "light_rain.png",75: "light_snow.png",76: "light_snow.png",77: "light_snow.png",78: "light_snow.png",79: "light_rain.png",80: "light_rain.png",81: "light_rain.png",82: "light_snow.png",83: "light_snow.png",84: "light_snow.png",85: "fog.png",86: "fog.png",87: "heavy_rain.png",88: "heavy_snow.png",89: "heavy_snow.png",90: "freezing.png",91: "cloudy.png",92: "partly_cloudy.png",93: "cloudy.png",94: "rain.png",
        95: "light_rain.png",96: "light_rain.png",97: "rain.png",98: "light_rain.png",99: "rain.png",100: "rain.png",101: "light_rain.png",102: "light_rain.png",103: "light_rain.png",104: "rain.png",105: "light_rain.png",106: "light_rain.png",107: "rain.png",108: "rain.png",109: "rain.png",110: "rain.png",111: "rain.png",112: "rain.png",113: "light_rain.png",114: "rain.png",115: "rain.png",116: "light_rain.png",117: "snow.png",118: "light_snow.png",119: "light_snow.png",120: "snow.png",121: "snow.png",122: "snow.png",123: "light_snow.png",
        124: "light_snow.png",125: "light_snow.png",126: "snow.png",127: "light_snow.png",128: "snow.png",129: "snow.png",130: "light_snow.png",131: "snow.png",132: "snow.png",133: "snow.png",134: "snow.png",135: "snow.png",136: "snow.png",137: "heavy_rain.png",138: "sunny.png",139: "tstorms.png",140: "freezing.png",141: "hot.png",142: "light_rain.png",143: "cloudy.png",144: "heavy_rain.png",145: "light_snow.png",146: "rain.png",147: "tstorms.png",148: "light_snow.png",149: "snow.png",150: "heavy_snow.png",151: "rain.png",152: "fog.png",
        153: "light_rain.png",154: "rain.png",155: "heavy_rain.png",156: "light_snow.png",157: "snow.png",158: "heavy_snow.png",159: "fog.png",160: "fog.png",161: "fog.png",162: "light_rain.png",163: "tstorms.png",165: "fog.png",173: "fog.png",174: "cloudy.png",176: "rain.png",177: "fog.png",178: "light_rain.png",179: "light_snow.png",180: "freezing.png",181: "light_snow.png",182: "tstorms.png",183: "heavy_rain.png",184: "light_snow.png",185: "fog.png",186: "snow.png",187: "fog.png",188: "light_rain.png",189: "fog.png",190: "fog.png",
        191: "light_rain.png",192: "fog.png",193: "rain.png",194: "heavy_rain.png",195: "fog.png",196: "light_snow.png",197: "light_snow.png",198: "fog.png",199: "snow.png",200: "rain.png",201: "fog.png",202: "fog.png",203: "fog.png",204: "rain.png",205: "heavy_rain.png",206: "snow.png",207: "heavy_rain.png",208: "fog.png",209: "light_snow.png",210: "light_rain.png",211: "tstorms.png",212: "tstorms.png",213: "light_snow.png",214: "tstorms.png",215: "tstorms.png",216: "heavy_snow.png",217: "fog.png",218: "fog.png",219: "light_snow.png",
        220: "light_snow.png",221: "fog.png",222: "light_snow.png",223: "fog.png",224: "light_rain.png",225: "fog.png",226: "fog.png",227: "heavy_rain.png",228: "fog.png",229: "light_snow.png",230: "light_snow.png",231: "fog.png",232: "snow.png",233: "fog.png",234: "light_rain.png",236: "fog.png",237: "fog.png",238: "light_rain.png",239: "light_snow.png",240: "light_rain.png",241: "light_rain.png",242: "light_snow.png",243: "fog.png",245: "light_snow.png",246: "light_rain.png",247: "tstorms.png",248: "tstorms.png",249: "heavy_rain.png",
        250: "tstorms.png",251: "tstorms.png",252: "tstorms.png",253: "fog.png",254: "fog.png",255: "fog.png",256: "snow.png",257: "fog.png",258: "light_rain.png",259: "fog.png",260: "freezing.png",261: "fog.png",262: "partly_cloudy.png",263: "fog.png",264: "freezing.png",265: "freezing.png",267: "cloudy.png",268: "fog.png",269: "light_rain.png",270: "light_snow.png",271: "heavy_rain.png",272: "light_rain.png",273: "snow.png",274: "heavy_rain.png",275: "fog.png",277: "snow.png",278: "light_rain.png",279: "heavy_rain.png",281: "tstorms.png",
        282: "heavy_rain.png",283: "tstorms.png",284: "tstorms.png",285: "tstorms.png",286: "fog.png",287: "fog.png",288: "rain.png",289: "light_snow.png",290: "light_snow.png",291: "windy.png",292: "tstorms.png",293: "light_rain.png",294: "light_snow.png",295: "tstorms.png"}

 WeatherFetcher.DAYS = [chrome.i18n.getMessage('sun'), chrome.i18n.getMessage('mon'), chrome.i18n.getMessage('tue'), chrome.i18n.getMessage('wed'), chrome.i18n.getMessage('thu'), chrome.i18n.getMessage('fri'), chrome.i18n.getMessage('sat')]

WeatherFetcher.prototype.init = function() {
	//console.log('init');
	if (this.interval_)
		clearInterval(this.interval_);
	this.interval_ = setInterval(this.startWeatherRetrieval.bind(this), WeatherFetcher.DELAY);
	this.startWeatherRetrieval();
}

WeatherFetcher.prototype.startWeatherRetrieval = function(force) {
	//console.log('startWeatherRetrieval');
	if (this.retryTimeout_)
		clearTimeout(this.retryTimeout_);
	this.retryTimeout_ = null;

	chrome.storage.local.get({
		'location-permission': true, // false
		weather: null,
		'weather-unit': chrome.i18n.getMessage('temperatureUnit')
	}, function(val) {
		this.unit = val['weather-unit']
		if (val['location-permission'] === this.locationPermission_ && val.weather && Date.now() - val.weather.date < WeatherFetcher.DELAY && !force)
			return;
		this.locationPermission_ = val['location-permission'];

		if (this.locationPermission_) {
			this.requestLocation_();
			if (this.latitude_ && this.longitude_)
				this.requestWeather_();
		} else {
			this.latitude_ = 34.1;
			this.longitude_ = -118.2;
			this.country_ = 'United States';
			chrome.storage.local.set({
				'location-name': 'Los Angeles'
			});
			this.requestWeather_();
		}
	}.bind(this));
};

WeatherFetcher.prototype.requestLocation_ = function() {
	//console.log('requestLocation_');
	navigator.geolocation.getCurrentPosition(
		this.handleGeolocationResponse_.bind(this), function() {
		console.error('Geolocation failed.');
		this.retry_();
	}.bind(this));
};

WeatherFetcher.prototype.handleGeolocationResponse_ = function(position) {
	if (this.latitude_ === position.coords.latitude && this.longitude_ === position.coords.longitude) {
		// Location not changed. In this case we do not request weather since it
		// was already requested in startWeatherRetrieval().
		return;
	}

	//console.log('Geolocation:', position);
	this.latitude_ = position.coords.latitude;
	this.longitude_ = position.coords.longitude;
	this.country_ = null;
	this.requestLocationName_();
};

WeatherFetcher.prototype.retry_ = function(jqxhr) {
	console.error('Retrying weather request. Delay:', this.retryDelay_ / 1000, 's.');
	this.retryTimeout_ = setTimeout(
		function() {
			this.retryTimeout_ = null;
			this.startWeatherRetrieval();
		}.bind(this), this.retryDelay_);
	this.retryDelay_ = util.updateRetryDelay(this.retryDelay_);
};

WeatherFetcher.prototype.requestLocationName_ = function() {
	var params = {
		language: chrome.i18n.getMessage('@@ui_locale'),
		latlng: '' + this.latitude_ + ',' + this.longitude_,
		sensor: 'false'
	};

	//console.log('Request location name for:', this.latitude_, this.longitude_);

	var request = $.getJSON(
		util.makeURL('https://maps.googleapis.com/maps/api/geocode/json', params), this.handleLocationResponse_.bind(this));
	request.error(function() {
	//	console.error('Reverse geocoding request failed.');
		this.retry_();
	}.bind(this));
};

WeatherFetcher.prototype.handleLocationResponse_ = function(data) {
	//console.log('Location:', data);
	this.locationRetryDelay_ = 1000;

	var byType = {}
	for (var i = 0; i < data.results.length; i++) {
		var result = data.results[i];
		byType[data.results[i].types[0]] = data.results[i].address_components[0];
	}
	;

	var location = (byType['locality'] && byType['locality'].long_name) || (byType['administrative_area_level_2'] && byType['administrative_area_level_2'].short_name);

	if (byType['country']) {
		this.country_ = byType['country'].long_name;
	} else {
		this.country_ = null;
	}

	chrome.storage.local.set({
		'location-name': location
	});
	this.requestWeather_();
};

WeatherFetcher.prototype.requestWeather_ = function() {
	var params = {
		lat: this.latitude_,
		long: this.longitude_
	}
	//console.log('Request weather for:', this.country_, latitude, longitude);
	var request = $.get(
		util.makeURL('http://ntpserv.appspot.com/weather', params), this.handleWeatherResponse_.bind(this), 'json');
	request.error(function() {
		console.error('Weather request failed.');
		this.retry_();
	}.bind(this));
};

WeatherFetcher.prototype.iGoogleIconToOnebox_ = function(url, size, nightOverride) {
	var hours = (new Date).getHours(),
		night = hours > 19 || hours < 6 ? 'night/' : ''
	url = 'images/weather/' + (nightOverride ? '' : night) + (WeatherFetcher.MAP[url])
	return url
};

WeatherFetcher.prototype.convert_ = function(f) {
	if (this.unit.toLowerCase() === 'c')
		return Math.round(5 * (f - 32) / 9)
	return f
}

WeatherFetcher.prototype.handleWeatherResponse_ = function(json, status, jqxhr) {
	//console.log('Weather response:', json)
	var currentNode = json.current
	if (currentNode.length < 1) {
	//	console.error('Wrong weather response.');
	//	console.error('Status:', status);
	//	console.error('Full response:', jqxhr.responseText);
		this.retry_()
		return
	}

	this.weatherRetryDelay_ = 1000
	var weather = {
		forecast: [],
		date: Date.parse(json.update_time)
	}

	weather.icon = this.iGoogleIconToOnebox_(currentNode.condition, 60)
	weather.temperature = this.convert_(currentNode.temp_f)
	//weather.condition = currentNode.condition_text
	weather.condition = chrome.i18n.getMessage(WeatherFetcher.MAP[currentNode.condition].replace('_', '').replace('.png', ''))
	var wind_d,
	wind_speed = currentNode.wind_speed_mph
	if (this.unit.toLowerCase() === 'c')
		wind_speed = Math.round(0.44704 * wind_speed)
	wind_d = currentNode.wind_direction
	if (wind_speed === 0)
		wind_d = chrome.i18n.getMessage('windless')
	else if (0 > wind_d || 360 < wind_d)
	                	wind_d = chrome.i18n.getMessage('mixed')
	else {
		for (var f, l = 0; l < WeatherFetcher.TEXT.length; l++)
			if (wind_d <= WeatherFetcher.TEXT[l].a) {
				f = WeatherFetcher.TEXT[l].text
	                                               		break
	                                       	}
	                              	wind_d = f + ', ' + (wind_speed * 3.6).toLocaleString() + ' '
	                              if (this.unit.toLowerCase() === 'c')
	                              		wind_d += chrome.i18n.getMessage('speedUnit')
	                              	else
	                              		wind_d += chrome.i18n.getMessage('speedUnit2')
	}
	weather.wind = wind_d
	weather.humidity = currentNode.humidity

	currentNode = new Date
	for (var i = 0; i < json.forecast.length; i++) {
		var forecast = {},
		forecastNode = json.forecast[i],
		l = new Date(forecastNode.date)
		if (l.getUTCDate() !== currentNode.getDate()) {
			forecast.day = WeatherFetcher.DAYS[l.getDay()]
			forecast.low = this.convert_(forecastNode.low_temp_f)
			forecast.high = this.convert_(forecastNode.high_temp_f)
			forecast.icon = this.iGoogleIconToOnebox_(forecastNode.condition, 35, true)
			//forecast.condition = forecastNode.condition_text
			forecast.condition = chrome.i18n.getMessage(WeatherFetcher.MAP[forecastNode.condition].replace('_', '').replace('.png', ''))
			weather.forecast.push(forecast)
		}
	}

	chrome.storage.local.set({
		weather: weather
	}, util.sendEventToAllWindows.bind(null, 'weather-loaded'))
}

var weatherFetcher = new WeatherFetcher()
window.addEventListener('load', weatherFetcher.init.bind(weatherFetcher))