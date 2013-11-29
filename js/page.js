"use strict"
// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This is a simple template engine inspired by JsTemplates
 * optimized for i18n.
 *
 * It currently supports three handlers:
 *
 *   * i18n-content which sets the textContent of the element.
 *
 *     <span i18n-content="myContent"></span>
 *
 *   * i18n-options which generates <option> elements for a <select>.
 *
 *     <select i18n-options="myOptionList"></select>
 *
 *   * i18n-values is a list of attribute-value or property-value pairs.
 *     Properties are prefixed with a '.' and can contain nested properties.
 *
 *     <span i18n-values="title:myTitle;.style.fontSize:fontSize"></span>
 *
 * This file is a copy of i18n_template.js, with minor tweaks to support using
 * load_time_data.js. It should replace i18n_template.js eventually.
 */

var i18nTemplate = (function() {
	/**
	 * This provides the handlers for the templating engine. The key is used as
	 * the attribute name and the value is the function that gets called for every
	 * single node that has this attribute.
	 * @type {Object}
	 */
	var handlers = {
		/**
		 * This handler sets the textContent of the element.
		 * @param {HTMLElement} element The node to modify.
		 * @param {string} key The name of the value in the dictionary.
		 * @param {LoadTimeData} dictionary The dictionary of strings to draw from.
		 */
		'i18n-content': function(element, key, dictionary) {
			var split = key.split(/\(/),
				key = split[0],
				propArg = split[1]
			if (typeof propArg !== 'undefined') {
				propArg = propArg.replace(')', '')
				var translation = dictionary.getMessage(propArg)
				propArg = translation == '' ? propArg.split(',') : translation
				if (typeof propArg === 'object') {
					propArg.some(function(elm, i) {
						var transl = dictionary.getMessage(elm)
						this[i] = transl == '' ? elm.replace(/'/g, '') : transl
					}, propArg)
				}
			}
			var content = dictionary.getMessage(key, propArg) || key
			element.textContent =content;
		},
		/**
		 * This handler adds options to a <select> element.
		 * @param {HTMLElement} select The node to modify.
		 * @param {string} key The name of the value in the dictionary. It should
		 *     identify an array of values to initialize an <option>. Each value,
		 *     if a pair, represents [content, value]. Otherwise, it should be a
		 *     content string with no value.
		 * @param {LoadTimeData} dictionary The dictionary of strings to draw from.
		 */
		'i18n-options': function(select, key, dictionary) {
			var options = dictionary.getMessage(key);
			options.forEach(function(optionData) {
				var option = typeof optionData == 'string' ?
					new Option(optionData) :
					new Option(optionData[1], optionData[0]);
				select.appendChild(option);
			});
		},
		/**
		 * This is used to set HTML attributes and DOM properties. The syntax is:
		 *   attributename:key;
		 *   .domProperty:key;
		 *   .nested.dom.property:key
		 * @param {HTMLElement} element The node to modify.
		 * @param {string} attributeAndKeys The path of the attribute to modify
		 *     followed by a colon, and the name of the value in the dictionary.
		 *     Multiple attribute/key pairs may be separated by semicolons.
		 * @param {LoadTimeData} dictionary The dictionary of strings to draw from.
		 */
		'i18n-values': function(element, attributeAndKeys, dictionary) {
			var parts = attributeAndKeys.replace(/\s/g, '').split(/;/);
			parts.forEach(function(part) {
				if (!part)
					return;

				var attributeAndKeyPair = part.match(/^([^:]+):(.+)$/);
				if (!attributeAndKeyPair)
					throw new Error('malformed i18n-values: ' + attributeAndKeys);

				var propName = attributeAndKeyPair[1];
				var split = attributeAndKeyPair[2].split(/\(/);
				var propExpr = split[0]
				var propArg = split[1]
				if (typeof(propArg) != "undefined") {
					propArg = propArg.replace(')', '')
					var translation = dictionary.getMessage(propArg)
					propArg = translation == '' ? propArg = propArg.split(',') : propArg = translation
					if (typeof(propArg) == 'object') {
						propArg.some(function(elm, i) {
							var transl = dictionary.getMessage(elm)
							this[i] = transl == '' ? elm.replace(/'/g, '') : transl
						}, propArg)
					}
				}

				var value = dictionary.getMessage(propExpr, propArg);

				// Allow a property of the form '.foo.bar' to assign a value into
				// element.foo.bar.
				if (propName[0] == '.') {
					var path = propName.slice(1).split('.');
					var targetObject = element;
					while (targetObject && path.length > 1) {
						targetObject = targetObject[path.shift()];
					}
					if (targetObject) {
						targetObject[path] = value;
						// In case we set innerHTML (ignoring others) we need to
						// recursively check the content.
						if (path == 'innerHTML')
							process(element, dictionary);
					}
				} else {
					element.setAttribute(propName, value);
				}
			});
		}
	};

	var attributeNames = Object.keys(handlers);
	var selector = '[' + attributeNames.join('],[') + ']';

	/**
	 * Processes a DOM tree with the {@code dictionary} map.
	 * @param {HTMLElement} node The root of the DOM tree to process.
	 * @param {LoadTimeData} dictionary The dictionary to draw from.
	 */
	function process(node, dictionary) {
		var elements = node.querySelectorAll(selector);
		for (var element, i = 0; element = elements[i]; i++) {
			for (var j = 0; j < attributeNames.length; j++) {
				var name = attributeNames[j];
				var attribute = element.getAttribute(name);
				if (attribute != null)
					handlers[name](element, attribute, dictionary);
			}
		}
	}

	return {
		process: process
	};
}());


i18nTemplate.process(document, chrome.i18n);

/*! jQuery Statusbar  v0.3 */
!function(a){a.fn.statusbar=function(b,c,d,e){if(a.isFunction(d)){if(e)return;e=d,d=c,c=void 0}if("object"==typeof b){if(e||d)return;e=url,d=b,b=void 0,c=void 0}if(d)d.text=b,d.urls=c,d.callback=e;else var d={text:b,urls:c,callback:e};var f={text:"",normalText:"",urls:{},delay:1e4,position:"top",center:!0,html:!1,timerIn:"fast",timerOut:"fast",closeButton:!0,callback:function(){}};a.extend(f,d);var g=a('<div class="msg__container">'),h=a('<div class="msg__inner">'),i=a('<div class="msg__text">');switch(f.html?i.html(f.text):i.text(f.text),"object"==typeof f.urls&&a.each(f.urls,function(b,c){var d=a("<a>");f.html?d.html(b):d.text(b);var e=c;a.isArray(c)&&(e=c[0]),d.attr("href",e),c[1]&&d.attr("target","_blank"),i.append(d),d.click(function(a){f.callback("link",d,a)})}),f.center&&g.addClass("msg__center"),f.position){case"top":f.position="msg__top";break;case"bottom":f.position="msg__bottom";break;case"left":f.position="msg__left";break;case"right":f.position="msg__right";break;default:f.position="msg__top"}if(g.addClass(f.position),i.append("<span>"+f.normalText+"</span>"),h.append(i),g.append(h),g.hide(),f.closeButton){g.addClass("msg__closeable");var j=a('<span class="close-button">');h.append(j),j.click(function(a){g.fadeOut(f.timerOut),f.callback("closed",g,a)})}return this.prepend(g),g.fadeIn(f.timerIn),f.delay&&window.setTimeout(function(){g.fadeOut(f.timerOut),f.callback("closed",g)},f.delay),f.callback("added",g)}}(jQuery)