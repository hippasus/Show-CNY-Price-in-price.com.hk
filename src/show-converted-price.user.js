// ==UserScript==
// @name        Show CNY price for price.com.hk
// @namespace   hippasus
// @description Show CNY price for price.com.hk
// @include     http://www.price.com.hk/*
// @version     0.2
// @grant       none
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require     https://raw.github.com/josscrowcroft/accounting.js/master/accounting.min.js
// ==/UserScript==
$(function() {
	"use strict"

	var __version__ = '0.2',

		currency_base, rates, _delay = 100,
		RATE_PATTERN = /^\d+\.\d+/,

		getRates = function() {

			var rates_json = localStorage["rates"],
				local_timestamp = localStorage["currency_timestamp"],
				timestamp = (new Date()).getTime(),
				// 1 hour cache duration
				cache_duration = 1000 * 60 * 60;

			currency_base = localStorage["currency_base"];

			if(rates_json) {
				rates = JSON.parse(rates_json);
			}

			if(rates && currency_base && local_timestamp && (timestamp - local_timestamp < cache_duration)) {
				var d = $.Deferred(),
					promise = d.promise();

				d.resolve();

				return promise;
			}

			var requestXHR = $.ajax({
				url: "http://rate-exchange.appspot.com/currency?from=HKD&to=CNY&q=1",
				type: 'GET'
			});
			/*
			var requestXHR = (function() {
				var df = $.Deferred(),
					xhr = new XMLHttpRequest();

				xhr.open('GET', 'http://rate-exchange.appspot.com/currency?from=HKD&to=CNY&q=1', true);
				xhr.onreadystatechange = function() {
					if(xhr.readyState === 4) {
						if(xhr.status !== 200 && xhr.status !== 304) {
							df.reject();
						}
						df.resolve(JSON.parse(xhr.responseText));
					}
				};
				xhr.send();

				return df.promise();
			}());*/

			requestXHR.done(function(data) {
				rates = {
					'HKD': 1,
					'CNY': data.rate
				};
				currency_base = 'HKD';

				localStorage["rates"] = JSON.stringify(rates);
				localStorage["currency_base"] = currency_base;
				localStorage["currency_timestamp"] = timestamp;
			});

			return requestXHR;
		},

		eleID = 'cny-' + (new Date()).getTime(),
		initHTML = function() {
			var html = '<div id="' + eleID + '" style="position: absolute; left: -10000px; padding: 5px; font-size: 12px; font-weight: bold; font-family: Tahoma, Verdana; line-height: 18px; border: 2px solid #bdbdbd; border-radius: 3px; box-shadow: #DDD 0px 0px 2px 2px; background-color: #eee; color: #F60; z-index: 100;"></div>';
			$(html).appendTo("body");
		},

		timerID,
		// register events
		registerEventHandler = function() {
			$("body").on('mouseover', 'span.price, span.cheap, a.pgrid_price, a.rank_price, a.idx_rank_price', function() {
				var $this = $(this),
					pos = $this.offset(),
					offset = {
						"top": -36,
						"left": -8
					},
					price = accounting.unformat($this.text()),
					converted_price = price / rates['HKD'] * rates['CNY'],
					cp_html = accounting.formatMoney(converted_price, '￥');

				pos.left += offset.left;
				pos.top += offset.top;

				if(timerID) {
					clearTimeout(timerID);
				}

				timerID = setTimeout(function() {
					$('#' + eleID).html(cp_html).css(pos).show();

					timerID = null;
				}, _delay);
			}).on('mouseout', function() {
				if(timerID) {
					clearTimeout(timerID);
					timerID = null;
				}

				$("#" + eleID).hide();
			});
		},

		init = function() {
			getRates().done(initHTML).done(registerEventHandler);
		};

	init();
});