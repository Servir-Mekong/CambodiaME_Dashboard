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


		service.checkAvailableData= function (options) {
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id:options.polygon_id,
					startYear: options.startYear,
					endYear:options.endYear,
					area_type: options.area_type,
					area_id: options.area_id,
				},
				params: {
					action: 'check-date'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.getPieEvi= function (options) {
			var area_type = options.area_type;
			var area_id = options.area_id;
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id:options.polygon_id,
					refLow:options.refLow,
					refHigh: options.refHigh,
					studyLow: options.studyLow,
					studyHigh:options.studyHigh,
					area_type: options.area_type,
					area_id: options.area_id,
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
					studyHigh:options.studyHigh,
					area_type: options.area_type,
					area_id: options.area_id,
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
					studyHigh:options.studyHigh,
					area_type: options.area_type,
					area_id: options.area_id,
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

		service.download_evi_map= function (options) {
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id:options.polygon_id,
					refLow:options.refLow,
					refHigh: options.refHigh,
					studyLow: options.studyLow,
					studyHigh:options.studyHigh,
					area_type: options.area_type,
					area_id: options.area_id,
				},
				params: {
					action: 'download-evi-map'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.getForestMapID = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var treeCanopyDefinition = options.treeCanopyDefinition;
			var treeHeightDefinition = options.treeHeightDefinition;
			var type = options.type; // can be treeCanopy, forestGain, forestLoss or forestExtend\
			var download = options.download;
			var year = options.year;
			var action = ''
			if(download === false){
				action = 'get-forest-extent-map';
			}else{
				action = 'download-forest-extent-map';
			}

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					type: type,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition,
					area_type: options.area_type,
					area_id: options.area_id,
					year: year
				},
				params: {
					action: action,
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
			var download = options.download;
			var action = 'get-forest-gain-map'
			

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition,
					area_type: options.area_type,
					area_id: options.area_id,
					download: download
				},
				params: {
					action: action
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
			var download = options.download;
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition,
					area_type: options.area_type,
					area_id: options.area_id,
					download: download
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
					treeHeightDefinition: treeHeightDefinition,
					area_type: options.area_type,
					area_id: options.area_id,
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

		service.getChangeForestGainLoss = function (options) {
			var year = options.year;
			var studyLow = options.studyLow;
			var studyHigh = options.studyHigh;
			var refLow =  options.refLow;
			var refHigh =  options.refHigh;
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
					studyLow: studyLow,
					studyHigh: studyHigh,
					refLow: refLow,
					refHigh: refHigh,
					treeCanopyDefinition: treeCanopyDefinition,
					treeHeightDefinition: treeHeightDefinition,
					area_type: options.area_type,
					area_id: options.area_id,
				},
				params: {
					action: 'get-changeforestgainloss',
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
			var area_type = options.area_type;
			var area_id = options.area_id;
			var download = options.download;
			var year = options.year;
			var action = ''
			if(download === false){
				action = 'get-forest-alert'
			}else{
				action = 'download-forest-alert'
			}
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					get_image: get_image,
					startYear: startYear,
					endYear: endYear,
					year: year,
					area_type: area_type,
					area_id: area_id
				},
				params: {
					action: action
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

		service.getSarAlert = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var get_image = options.get_image;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var download = options.download;
			var year = options.year;
			var action = ''
			if(download === false){
				action = 'get-sar-alert'
			}else{
				action = 'download-sar-alert'
			}
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					get_image: get_image,
					startYear: startYear,
					endYear: endYear,
					year: year,
					area_type: area_type,
					area_id: area_id
				},
				params: {
					action: action
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
			var area_type = options.area_type;
			var area_id = options.area_id;
			var download = options.download;
			var action = ''
			if(download === false){
				action = 'get-burned-area'
			}else{
				action = 'download-burned-area'
			}

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					area_type: area_type,
					area_id: area_id
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

		service.downloadBurnedArea = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var download = options.download;
			var year = options.year;
			var action = ''
			if(download === false){
				action = 'get-burned-area'
			}else{
				action = 'download-burned-area'
			}

			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					year: year,
					area_type: area_type,
					area_id: area_id
				},
				params: {
					action: action
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


		service.getLandcover= function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var year = options.year;
			var download = options.download;
			var action = ''
			if(download === true){
				action= 'download-landcover'
			}else{
				action= 'get-landcover' 
			}
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					area_type: area_type,
					area_id: area_id,
					year: year,
					download: download
				},
				params: {
					action: action	
				}
			};

			var promise = $http(req)
			.then(function (response) {
				// console.log(response)
				return response.data;
			})
			.catch(function (e) {
				console.log('Error: ', e);
				throw e.data;
			});
			return promise;
		};

		service.getLandcoverRice = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var year = options.year;
			var download = options.download;
			var action = ''
			if(download === true){
				action= 'download-landcover-rice'
			}else{
				action= 'get-landcover-rice' 
			}
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					area_type: area_type,
					area_id: area_id,
					year: year,
					download: download
				},
				params: {
					action: action	
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

		service.getLineLCRice = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					area_type: area_type,
					area_id: area_id
				},
				params: {
					action: 'get-line-lc-rice'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.getLandcoverRubber = function (options) {
			var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var year = options.year;
			var download = options.download;
			var action = ''
			if(download === true){
				action= 'download-landcover-rubber'
			}else{
				action= 'get-landcover-rubber' 
			}
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					area_type: area_type,
					area_id: area_id,
					year: year,
					download: download
				},
				params: {
					action: action	
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

		service.getLineLCRubber = function (options) {var startYear = options.startYear;
			var endYear = options.endYear;
			var polygon_id = options.polygon_id;
			var area_type = options.area_type;
			var area_id = options.area_id;
			var req = {
				method: 'POST',
				url: '/api/mapclient/',
				data: {
					polygon_id: polygon_id,
					startYear: startYear,
					endYear: endYear,
					area_type: area_type,
					area_id: area_id
				},
				params: {
					action: 'get-line-lc-rubber'
				}
			};

			var promise = $http(req)
			.then(function (response) {
				return response.data;
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
