/**
 * @constructor
 */
function WeatherFetcher() {
	this.retryDelay_ = 1000;
	this.retryTimeout_ = null;
	this.locationPermission_ = null;
	this.interval_ = null;
	this.latitude_ = null;
	this.longitude_ = null;
	chrome.idle.onStateChanged.addListener(this.init.bind(this));
}
;

WeatherFetcher.DELAY = 3600 * 1000;

WeatherFetcher.prototype.init = function() {
	console.log('init');
	if (this.interval_)
		clearInterval(this.interval_);
	this.interval_ = setInterval(this.startWeatherRetrieval.bind(this),
		WeatherFetcher.DELAY);
	this.startWeatherRetrieval();
};

WeatherFetcher.ICON_MAPPER_ = {
	chance_of_rain: 'light_rain',
	chance_of_snow: 'snow',
	chance_of_storm: 'tstorms',
	cloudy: 'cloudy',
	flurries: 'light_snow',
	fog: 'fog',
	haze: 'fog',
	hazy: 'fog',
	icy: 'sleet',
	mist: 'cloudy',
	mostly_cloudy: 'partly_cloudy',
	mostly_sunny: 'partly_cloudy',
	partly_cloudy: 'partly_cloudy',
	partlysunny: 'partly_cloudy',
	rain: 'rain',
	smoke: 'fog',
	snow: 'snow',
	storm: 'partly_cloudy',
	thunderstorm: 'tstorms',
	sunny: 'sunny'
};

WeatherFetcher.API_KEY = 'AIzaSyAC8pwotGqB0k21uB5NbKqT7QK0rSHDBc4';

WeatherFetcher.prototype.startWeatherRetrieval = function() {
	console.log('startWeatherRetrieval');
	if (this.retryTimeout_)
		clearTimeout(this.retryTimeout_);
	this.retryTimeout_ = null;

	chrome.storage.local.get(
		{'location-permission': false, weather: null},
	function(val) {
		if (val['location-permission'] === this.locationPermission_ &&
			val.weather &&
			Date.now() - val.weather.date < WeatherFetcher.DELAY)
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
			chrome.storage.local.set({'location-name': 'Los Angeles'});
			this.requestWeather_();
		}
	}.bind(this));
};

WeatherFetcher.prototype.requestLocation_ = function() {
	console.log('requestLocation_');
	navigator.geolocation.getCurrentPosition(
		this.handleGeolocationResponse_.bind(this),
		function() {
			console.error('Geolocation failed.');
			this.retry_();
		}.bind(this));
};

WeatherFetcher.prototype.handleGeolocationResponse_ = function(position) {
	if (this.latitude_ === position.coords.latitude &&
		this.longitude_ === position.coords.longitude) {
		// Location not changed. In this case we do not request weather since it
		// was already requested in startWeatherRetrieval().
		return;
	}

	console.log('Geolocation:', position);
	this.latitude_ = position.coords.latitude;
	this.longitude_ = position.coords.longitude;
	this.country_ = null;
	this.requestLocationName_();
};

WeatherFetcher.prototype.retry_ = function(jqxhr) {
	console.error('Retrying weather request. Delay:',
		this.retryDelay_ / 1000, 's.');
	this.retryTimeout_ = setTimeout(
		function() {
			this.retryTimeout_ = null;
			this.startWeatherRetrieval();
		}.bind(this),
		this.retryDelay_);
	this.retryDelay_ = util.updateRetryDelay(this.retryDelay_);
};

WeatherFetcher.prototype.requestLocationName_ = function() {
	var params = {
		language: chrome.i18n.getMessage('@@ui_locale'),
		latlng: '' + this.latitude_ + ',' + this.longitude_,
		sensor: 'false'
	};

	console.log('Request location name for:', this.latitude_, this.longitude_);

	var request = $.getJSON(
		util.makeURL('https://maps.googleapis.com/maps/api/geocode/json', params),
		this.handleLocationResponse_.bind(this));
	request.error(function() {
		console.error('Reverse geocoding request failed.');
		this.retry_();
	}.bind(this));
};

WeatherFetcher.prototype.handleLocationResponse_ = function(data) {
	console.log('Location:', data);
	this.locationRetryDelay_ = 1000;

	var byType = {}
	for (var i = 0; i < data.results.length; i++) {
		var result = data.results[i];
		byType[data.results[i].types[0]] =
			data.results[i].address_components[0];
	}
	;

	var location = (byType['locality'] && byType['locality'].short_name) ||
		(byType['administrative_area_level_2'] &&
			byType['administrative_area_level_2'].short_name);

	if (byType['country']) {
		this.country_ = byType['country'].long_name;
	} else {
		this.country_ = null;
	}

	chrome.storage.local.set({'location-name': location});
	this.requestWeather_();
};

WeatherFetcher.prototype.requestWeather_ = function() {
	var latitude = Math.round(this.latitude_ * 1E6);
	var longitude = Math.round(this.longitude_ * 1E6);
	params = {
		hl: chrome.i18n.getMessage('@@ui_locale'),
		weather: ',,' + this.country_ + ',' + latitude + ',' + longitude,
		expflags: 'Dispatchers__force_signed_weather_api:false',
		oauth_signature: chrome.i18n.getMessage('@@ui_locale'),
		referrer: 'igoogle'
	};
	console.log('Request weather for:', this.country_, latitude, longitude);
	var request = $.get(
		util.makeURL('https://www.google.com/ig/api', params),
		this.handleWeatherResponse_.bind(this),
		'xml');
	request.error(function() {
		console.error('Weather request failed.');
		this.retry_();
	}.bind(this));
};

WeatherFetcher.prototype.iGoogleIconToOnebox_ = function(url, size) {
	url = url.replace('/ig/images/weather/', '').replace('.gif', '');
	if (!WeatherFetcher.ICON_MAPPER_[url])
		console.log('Unkown weather condition:', url);
	url = 'images/weather/' + (WeatherFetcher.ICON_MAPPER_[url] || url) + '.png';
	return url;
};

WeatherFetcher.prototype.handleWeatherResponse_ = function(xmlDoc, status,
	jqxhr) {
	console.log('Weather response:', xmlDoc)
	var doc = $(xmlDoc);
	var currentNode = doc.find('current_conditions');
	if (currentNode.length < 1) {
		console.error('Wrong weather response.');
		console.error('Status:', status);
		console.error('Full response:', jqxhr.responseText);
		this.retry_();
		return;
	}

	this.weatherRetryDelay_ = 1000;
	weather = {forecast: [], date: Date.now()};

	weather.icon = this.iGoogleIconToOnebox_(
		currentNode.find('icon').attr('data'), 60);
	var unit = chrome.i18n.getMessage('temperatureUnit')
	weather.temperature = currentNode.find('temp_' + unit.toLowerCase()).attr('data') + '°' + unit;
	weather.condition = currentNode.find('condition').attr('data');
	weather.wind = currentNode.find('wind_condition').attr('data');
	weather.humidity = currentNode.find('humidity').attr('data');

	var forecasts = doc.find('forecast_conditions')
	for (var i = 0; i < forecasts.length; i++) {
		var forecast = {};
		var forecastNode = $(forecasts[i]);
		forecast.day = forecastNode.find('day_of_week').attr('data');
		forecast.low = forecastNode.find('low').attr('data') + '°';
		forecast.high = forecastNode.find('high').attr('data') + '°';
		forecast.icon = this.iGoogleIconToOnebox_(
			forecastNode.find('icon').attr('data'), 35);
		forecast.condition = forecastNode.find('condition').attr('data');
		weather.forecast.push(forecast);
	}

	chrome.storage.local.set(
		{weather: weather},
	util.sendEventToAllWindows.bind(null, 'weather-loaded'));
};

var weatherFetcher = new WeatherFetcher();
window.addEventListener('load', weatherFetcher.init.bind(weatherFetcher));
