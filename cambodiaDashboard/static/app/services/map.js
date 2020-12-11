(function () {

	'use strict';

	angular.module('baseApp')
	.service('MapService', function ($http, $q) {
		var service = this;

		service.getMapType = function (mapId, mapToken, type) {
			var eeMapOptions = {
				getTileUrl: function (tile, zoom) {
					var url = 'https://earthengine.googleapis.com/map/';
					url += [mapId, zoom, tile.x, tile.y].join('/');
					url += '?token=' + mapToken;
					return url;
				},
				tileSize: new google.maps.Size(256, 256),
				opacity: 1.0,
				name: type
			};
			return new google.maps.ImageMapType(eeMapOptions);
		};

		service.getPieEvi= function (options) {

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id:options.polygon_id,
					refLow:options.refLow,
					refHigh: options.refHigh,
					studyLow: options.studyLow,
					studyHigh:options.studyHigh
				},
				params: {
					action: 'get-pie-evi'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.getLineEvi= function (options) {
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id:options.polygon_id,
					refLow:options.refLow,
					refHigh: options.refHigh,
					studyLow: options.studyLow,
					studyHigh:options.studyHigh
				},
				params: {
					action: 'get-line-evi'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.get_evi_map= function (options) {
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id:options.polygon_id,
					refLow:options.refLow,
					refHigh: options.refHigh,
					studyLow: options.studyLow,
					studyHigh:options.studyHigh
				},
				params: {
					action: 'get-evi-map'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};


		service.getStats = function (options) {
			var year = options.year;
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var treeCanopyDefinition = options.treeCanopyDefinition;
			var treeHeightDefinition = options.treeHeightDefinition;
			var type = options.type; // can be treeCanopy, forestGain, forestLoss or forestExtend

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					year: year,
					type: type,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition
				},
				params: {
					action: 'get-stats',
					type: type
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getForestMapID = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var treeCanopyDefinition = options.treeCanopyDefinition;
			var treeHeightDefinition = options.treeHeightDefinition;
			var type = options.type; // can be treeCanopy, forestGain, forestLoss or forestExtend

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					type: type,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition
				},
				params: {
					action: 'get-forest-extent-map',
					type: type
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getForestGainMapid = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var treeCanopyDefinition = options.treeCanopyDefinition;
			var treeHeightDefinition = options.treeHeightDefinition;

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition
				},
				params: {
					action: 'get-forest-gain-map'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getForestLossMapid = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var treeCanopyDefinition = options.treeCanopyDefinition;
			var treeHeightDefinition = options.treeHeightDefinition;

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition
				},
				params: {
					action: 'get-forest-loss-map'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getForestGainLoss = function (options) {
			var year = options.year;
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var treeCanopyDefinition = options.treeCanopyDefinition;
			var treeHeightDefinition = options.treeHeightDefinition;
			var type = options.type; // can be treeCanopy, forestGain, forestLoss or forestExtend

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					year: year,
					type: type,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition
				},
				params: {
					action: 'get-forestgainloss',
					type: type
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getForestAlert = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var get_image = options.get_image;

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					get_image: get_image,
					startYear: startYear,
					endYear: endYear
				},
				params: {
					action: 'get-forest-alert'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getBurnedArea = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear
				},
				params: {
					action: 'get-burned-area'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.removeGeoJson = function (map) {
			map.data.forEach(function (feature) {
				map.data.remove(feature);
			});
		};

		service.clearLayer = function (map, name) {
			map.overlayMapTypes.forEach(function (layer, index) {
				if (layer && layer.name === name) {
					map.overlayMapTypes.removeAt(index);
				}
			});
		};

		// Remove the Drawing Manager Polygon
		service.clearDrawing = function (overlay) {
			if (overlay) {
				overlay.setMap(null);
			}
		};

		service.getPolygonBoundArray = function (array) {
			var geom = [];
			for (var i = 0; i < array.length; i++) {
				var coordinatePair = [array[i].lng().toFixed(2), array[i].lat().toFixed(2)];
				geom.push(coordinatePair);
			}
			return geom;
		};

		service.getDrawingManagerOptions = function(type) {
			if (!type) {
				return {};
			}
			var typeOptions;
			if (type === 'polyline') {
				typeOptions = 'polylineOptions';
			}
			var drawingManagerOptions = {
				'drawingControl': false
			};
			drawingManagerOptions.drawingMode = type;
			drawingManagerOptions[typeOptions] = {
				'strokeColor': '#ffff00',
				'strokeWeight': 4,
				'fillColor': 'yellow',
				'fillOpacity': 0,
				'editable': true
			};

			return drawingManagerOptions;
		};

	});

})();
