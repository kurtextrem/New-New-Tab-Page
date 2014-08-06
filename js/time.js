/* global Intl */
/*!
 * http://ejohn.org/blog/javascript-pretty-date
 * Licensed under the MIT license.
 */

+function (window) {
	'use strict';

	var strings = {
		ago: 'ago',
		yesterday: 'Yesterday',
		pre: false,
		from: 'In',
		now: 'Just Now',
		minute: 'minute',
		minutes: 'minutes',
		hour: 'hour',
		hours: 'hours'
	}

	function formatTime (seconds, lang) {
		return Intl.DateTimeFormat(lang, {
			year: '2-digit',
			month: '2-digit',
			day: '2-digit',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit'
		}).format(seconds)
	}

	function prettyDate (date, compareTo, lang) {
		var diff = (compareTo - date + (compareTo.getTimezoneOffset() - (date.getTimezoneOffset()))) / 1000,
			token = '',
			out = ''

		token = strings.ago
		if (diff < 0) {
			diff = Math.abs(diff)
			strings.pre = true
			token = strings.from
		}

		switch (true) {
			case diff < 60:
				return strings.now
			case diff < 120:
				out = '1 ' + strings.minute
				break
			case diff < 3600:
				out = Math.floor(diff / 60) + ' ' + strings.minutes
				break
			case diff < 7200:
				out = '1 ' + strings.hour
				break
			case diff < 86400:
				out = Math.floor(diff / 3600) + ' ' + strings.hours
				break;
			case Math.floor(diff / 86400) === 1:
				return strings.yesterday + ', ' + date.toLocaleTimeString().substr(0, 5)
				break

			default:
				return formatTime(date.valueOf(), lang)
		}

		return strings.pre ? token + ' ' + out : out + ' ' + token

	}

	var RelativeTimePrototype = Object.create(window.HTMLElement.prototype) // HTMLTimeElement
	RelativeTimePrototype.createdCallback = function () {
		var time = new Date(this.textContent),
			now = new Date(this.dataset.now),
			lang = this.dataset.lang

		this.title = formatTime(time.valueOf(), lang)
		//this.datetime = time.toISOString()
		this.textContent = prettyDate(time, now, lang)
	}

	window.RelativeTimeElement = document.registerElement('relative-time', {
		prototype: RelativeTimePrototype,
		'extends': 'time'
	});
}(window);
