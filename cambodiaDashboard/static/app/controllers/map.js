(function () {
	'use strict';
	angular.module('baseApp')
	.controller('mapcontroller' ,function ($scope, $timeout, MapService, appSettings) {

		/* global variables to be tossed around like hot potatoes */
		$scope.showAlert = false;
		$scope.showLoader = false;
		$scope.REFHIGH = '';
		$scope.REFLOW = '';
		$scope.STUDYHIGH = '';
		$scope.STUDYLOW = '';

		var MAPBOXAPI = appSettings.mapboxapi;

		var map, basemap_layer , drawing_polygon;

		var refHigh, refLow, studyHigh, studyLow;
		var EVILayer, Forest2000, Forest2001, Forest2002, Forest2003,Forest2004, Forest2005, Forest2006, Forest2007, Forest2008, Forest2009, Forest2010, Forest2011, Forest2012, Forest2013, Forest2014;
		var Forest2015, Forest2016, Forest2017, Forest2018, Forest2019,Forest2020, Forest2021;
		var ForestAlert2000, ForestAlert2001, ForestAlert2002, ForestAlert2003,ForestAlert2004, ForestAlert2005, ForestAlert2006, ForestAlert2007, ForestAlert2008, ForestAlert2009, ForestAlert2010, ForestAlert2011, ForestAlert2012, ForestAlert2013, ForestAlert2014,
		ForestAlert2015, ForestAlert2016, ForestAlert2017, ForestAlert2018, ForestAlert2019,ForestAlert2020, ForestAlert2021;
		var BurnedArea2000, BurnedArea2001, BurnedArea2002, BurnedArea2003,BurnedArea2004, BurnedArea2005, BurnedArea2006, BurnedArea2007, BurnedArea2008, BurnedArea2009, BurnedArea2010, BurnedArea2011, BurnedArea2012, BurnedArea2013, BurnedArea2014,
		BurnedArea2015, BurnedArea2016, BurnedArea2017, BurnedArea2018, BurnedArea2019,BurnedArea2020, BurnedArea2021;
		var ForestGainLayer, ForestLossLayer, ForestAlertLayer;
		var overlayLayers = [EVILayer, Forest2000, Forest2001, Forest2002, Forest2003,Forest2004, Forest2005, Forest2006, Forest2007, Forest2008, Forest2009, Forest2010, Forest2011, Forest2012, Forest2013, Forest2014,
			Forest2015, Forest2016, Forest2017, Forest2018, Forest2019,Forest2020, Forest2021, ForestAlert2000, ForestAlert2001, ForestAlert2002, ForestAlert2003,ForestAlert2004, ForestAlert2005, ForestAlert2006, ForestAlert2007, ForestAlert2008, ForestAlert2009, ForestAlert2010, ForestAlert2011, ForestAlert2012, ForestAlert2013, ForestAlert2014,
			ForestAlert2015, ForestAlert2016, ForestAlert2017, ForestAlert2018, ForestAlert2019,ForestAlert2020, ForestAlert2021, BurnedArea2000, BurnedArea2001, BurnedArea2002, BurnedArea2003,BurnedArea2004, BurnedArea2005, BurnedArea2006, BurnedArea2007, BurnedArea2008, BurnedArea2009, BurnedArea2010, BurnedArea2011, BurnedArea2012, BurnedArea2013, BurnedArea2014,
			BurnedArea2015, BurnedArea2016, BurnedArea2017, BurnedArea2018, BurnedArea2019,BurnedArea2020, BurnedArea2021, ForestGainLayer, ForestLossLayer, ForestAlertLayer]

			var MapLayerArr = {
				'2000': {
					'forest': Forest2000,
					'forestAlert': ForestAlert2000,
					'burnedArea': BurnedArea2000
				},
				'2001': {
					'forest': Forest2001,
					'forestAlert': ForestAlert2001,
					'burnedArea': BurnedArea2001
				},
				'2002': {
					'forest': Forest2002,
					'forestAlert': ForestAlert2002,
					'burnedArea': BurnedArea2002
				},
				'2003': {
					'forest': Forest2003,
					'forestAlert': ForestAlert2003,
					'burnedArea': BurnedArea2003
				},
				'2004': {
					'forest': Forest2004,
					'forestAlert': ForestAlert2004,
					'burnedArea': BurnedArea2004
				},
				'2005': {
					'forest': Forest2005,
					'forestAlert': ForestAlert2005,
					'burnedArea': BurnedArea2005
				},
				'2006': {
					'forest': Forest2006,
					'forestAlert': ForestAlert2006,
					'burnedArea': BurnedArea2006
				},
				'2007': {
					'forest': Forest2007,
					'forestAlert': ForestAlert2007,
					'burnedArea': BurnedArea2007
				},
				'2008': {
					'forest': Forest2008,
					'forestAlert': ForestAlert2008,
					'burnedArea': BurnedArea2008
				},
				'2009': {
					'forest': Forest2009,
					'forestAlert': ForestAlert2009,
					'burnedArea': BurnedArea2009
				},
				'2010': {
					'forest': Forest2010,
					'forestAlert': ForestAlert2010,
					'burnedArea': BurnedArea2010
				},
				'2011': {
					'forest': Forest2011,
					'forestAlert': ForestAlert2011,
					'burnedArea': BurnedArea2011
				},
				'2012': {
					'forest': Forest2012,
					'forestAlert': ForestAlert2012,
					'burnedArea': BurnedArea2012
				},
				'2013': {
					'forest': Forest2013,
					'forestAlert': ForestAlert2013,
					'burnedArea': BurnedArea2013
				},
				'2014': {
					'forest': Forest2014,
					'forestAlert': ForestAlert2014,
					'burnedArea': BurnedArea2014
				},
				'2015': {
					'forest': Forest2015,
					'forestAlert': ForestAlert2015,
					'burnedArea': BurnedArea2015
				},
				'2016': {
					'forest': Forest2016,
					'forestAlert': ForestAlert2016,
					'burnedArea': BurnedArea2016
				},
				'2017': {
					'forest': Forest2017,
					'forestAlert': ForestAlert2017,
					'burnedArea': BurnedArea2017
				},
				'2018': {
					'forest': Forest2018,
					'forestAlert': ForestAlert2018,
					'burnedArea': BurnedArea2018
				},
				'2019': {
					'forest': Forest2019,
					'forestAlert': ForestAlert2019,
					'burnedArea': BurnedArea2019
				},
				'2020': {
					'forest': Forest2020,
					'forestAlert': ForestAlert2020,
					'burnedArea': BurnedArea2020
				},
				'2021': {
					'forest': Forest2021,
					'forestAlert': ForestAlert2021,
					'burnedArea': BurnedArea2021
				},
			};

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			// Extract an array of coordinates for the given polygon.
			var getCoordinates = function (coords) {
				var polygon_coords = "";
				for(var i=0; i<coords.length; i++){
					if(i!==coords.length-1){
						polygon_coords += "("+coords[i][1]+","+coords[i][0]+"),"
					}else{
						polygon_coords += "("+coords[i][1]+","+coords[i][0]+")"
					}
				}
				return polygon_coords;
			};

			var polygon_id = "";
			//var coords = cambodia_polygon.features[0].geometry.coordinates[0][0];


			//Geojson feature style
			var polygonstyle = {
				color: "#FF412C",
				fill: false,
				opacity: 1,
				clickable: true,
				weight: 0.8,
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			function yearInt (year) {
				return parseInt(year);
			}
			function yearToInt (year) {
				return parseInt(year);
			}

			// init the measure period range slider
			$('#measure_period').ionRangeSlider({
				skin: "round",
				type: "double",
				grid: false,
				min: yearInt(2002),
				max: yearInt(2019),
				from: yearInt(2009),
				to: yearInt(2019),
				prettify: yearToInt,
				onChange: function (data) {
					studyHigh = data['to']
					studyLow = data['from']
					$scope.STUDYHIGH = studyHigh;
					$scope.STUDYLOW = studyLow;
					$scope.$apply();
				},
			});

			studyHigh = $("#measure_period").data("ionRangeSlider").result.to;
			studyLow = $("#measure_period").data("ionRangeSlider").result.from;
			$scope.STUDYHIGH = studyHigh;
			$scope.STUDYLOW = studyLow;

			//init the reference period range slider
			$('#baseline_period').ionRangeSlider({
				skin: "round",
				type: "double",
				grid: false,
				min: yearInt(2002),
				max: yearInt(2019),
				from: yearInt(2002),
				to: yearInt(2008),
				prettify: yearToInt,
				onChange: function (data) {
					refHigh = data['to']
					refLow = data['from']
					$scope.REFHIGH = refHigh;
					$scope.REFLOW = refLow;
				},
			});

			refHigh = $("#baseline_period").data("ionRangeSlider").result.to;
			refLow = $("#baseline_period").data("ionRangeSlider").result.from;
			$scope.REFHIGH = refHigh;
			$scope.REFLOW = refLow;
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			//init leaflet map
			var mapCenter_lat = 12.75118782414063;
			var mapCenter_long = 103.22877523601562;
			// init map
			map = L.map('map',{
				center: [mapCenter_lat,mapCenter_long],
				zoom: 7,
				minZoom:2,
				maxZoom: 16,
				maxBounds: [
					[-120, -220],
					[120, 220]
				]
			});

			basemap_layer = L.tileLayer('https://api.mapbox.com/styles/v1/servirmekong/ckduef35613el19qlsoug6u2h/tiles/256/{z}/{x}/{y}@2x?access_token='+MAPBOXAPI, {
				attribution: ''
			}).addTo(map);


			// Initialise the FeatureGroup to store editable layers
			var editableLayers = new L.FeatureGroup();
			map.addLayer(editableLayers);

			var drawPluginOptions = {
				draw: {
					polygon: {
						allowIntersection: false, // Restricts shapes to simple polygons
						drawError: {
							color: '#e1e100', // Color the shape will turn when intersects
							message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
						},
						shapeOptions: {
							color: '#000',
							strokeWeight: 2,
							fillOpacity: 0
						}
					},

					// disable toolbar item by setting it to false
					polyline: false,
					circle: false, // Turns off this drawing tool
					circlemarker: false,
					rectangle: {
						shapeOptions: {
							color: '#fd5a24',
							strokeWeight: 2,
							fillOpacity: 0
						}
					},
					marker: false,
				},
				edit: {
					featureGroup: editableLayers, //REQUIRED!!
					edit: true
				}
			};

			var polygonVertex = 0;

			// Initialise the draw control and pass it the FeatureGroup of editable layers
			var drawControl = new L.Control.Draw(drawPluginOptions);
			map.addControl(drawControl);

			map.on('draw:created', function(e) {
				editableLayers.clearLayers();
				var type = e.layerType,
				layer = e.layer;

				map.fitBounds(layer.getBounds());
				editableLayers.addLayer(layer);

				var userPolygon = layer.toGeoJSON();
				var coords = userPolygon.geometry.coordinates;
				polygon_id = getCoordinates(coords[0]);
				polygonVertex = coords.length;
				cal();
			});
			map.on('draw:edited', function(e) {
				var editedlayers = e.layers;
				editedlayers.eachLayer(function(layer) {
					var userPolygon = layer.toGeoJSON();
				});
			});
			map.on('draw:deleted', function(e) {
				var userPolygon = '';
				drawing_polygon = '';

			});

			/**
			* Add file upload button on map
			*/
			var customControl = L.Control.extend({
				options: {
					position: 'topleft'
				},
				onAdd: function (map) {
					var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
					container.innerHTML = "<label for='input-file2' style='margin-left:7px;margin-top:5px;font-size:15px;cursor: pointer;' title='Load local file (Geojson, KML)'><span class='glyphicon glyphicon-folder-open' aria-hidden='true'></span><input type='file' class='hide' id='input-file2' accept='.kml,.kmz,.json,.geojson,application/json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz'></label>";
					container.style.backgroundColor = '#f4f4f4';
					container.style.width = '35px';
					container.style.height = '35px';
					container.style.backgroundSize = "30px 30px";
					return container;
				}
			});
			map.addControl(new customControl());

			//init polygon first load
			var coords = [[105.21353627825181,12.449495126305504],[106.76810170793931,12.449495126305504],[106.76810170793931,13.776244901333273],[105.21353627825181,13.776244901333273],[105.21353627825181,12.449495126305504]];
			polygon_id = getCoordinates(coords);
			//var a = JSON.parse(coords);
			var coordLatlng = [[12.449495126305504, 105.21353627825181],[12.449495126305504, 106.76810170793931],[13.776244901333273,106.76810170793931],[13.776244901333273, 105.21353627825181],[12.449495126305504, 105.21353627825181]];
			var initpolygon = L.polygon(coordLatlng, {color: '#FF412C', strokeWeight: 1, fillOpacity: 0});
			initpolygon.addTo(map);
			editableLayers.addLayer(initpolygon);
			map.fitBounds(initpolygon.getBounds());


			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			//create the index of map overlay layers

			map.createPane('EVILayer');
			map.getPane('EVILayer').style.zIndex = 300;

			map.createPane('ForestLossLayer');
			map.getPane('ForestLossLayer').style.zIndex = 401;

			map.createPane('ForestGainLayer');
			map.getPane('ForestGainLayer').style.zIndex = 402;

			map.createPane('ForestAlertLayer');
			map.getPane('ForestAlertLayer').style.zIndex = 403;

			map.createPane('admin');
			map.getPane('admin').style.zIndex = 500;

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			var mapLayer_protected_area =L.geoJson(protected_area, {
				style: function (feature) {
					return {
						color: "#222831",
						fill: false,
						opacity: 1,
						clickable: true,
						weight: 0.5,
					};
				},
				pane:'admin'
			});

			var mapLayer_cam_adm2 =L.geoJson(cam_adm2, {
				style: function (feature) {
					return {
						color: "#222831",
						fill: false,
						opacity: 1,
						clickable: true,
						weight: 0.5,
					};
				},
				pane:'admin'
			});


			var mapLayer_cambodia =L.geoJson(cambodia_polygon, {
				style: function (feature) {
					return {
						color: "#222831",
						fill: false,
						opacity: 1,
						clickable: true,
						weight: 2,
					};
				},
				pane:'admin'
			});

			var protected_area_layer =L.geoJson(protected_area, {
				style: function (feature) {
					return {
						color: "#FF412C",
						fill: false,
						opacity: 1,
						clickable: true,
						weight: 0.8,
					};
				},
				onEachFeature: onEachPolygon,
				pane:'admin'
			});

			var cam_adm2_layer =L.geoJson(cam_adm2, {
				style: function (feature) {
					return {
						color: "#FF412C",
						fill: false,
						opacity: 1,
						clickable: true,
						weight: 0.8,
					};
				},
				onEachFeature: onEachPolygon,
				pane:'admin'
			});

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			// function to add and update tile layer to map
			function addMapLayer(layer,url, pane){
				layer = L.tileLayer(url,{
					attribution: '<a href="https://earthengine.google.com" target="_">' +
					'Google Earth Engine</a>;',
					pane: pane});
					return layer;
				}

			function cal(){
					//clear all map layers
					overlayLayers.forEach(function (item) {
						if(map.hasLayer(item)){
							map.removeLayer(item);
						}
					});
					// clear all toggle layer list
					$("#toggle-list-forest").html('');
					$("#toggle-list-evi").html('');
					$("#toggle-list-forest-alert").html('');
					$("#toggle-list-burned-area").html('');

					//show spiner
					$scope.showLoader = true;

					getPieEvi();
					getLineEvi();
					getEviMap();
					getForestMapID();
					getForestGainMapID();
					getForestLossMapID();
					getForestGainLossStats();
					getForestCoverStats();
					getForestAlert();
					getBurnedArea();

				};



				function whenClicked(e) {
					var layer = e.target;
					map.fitBounds(layer.getBounds());
					var coords = e.sourceTarget.feature.geometry.coordinates;
					polygon_id = getCoordinates(coords[0][0]);
					polygonVertex = coords.length;
					cal();

				}

				function onEachPolygon(feature, layer) {
					layer.on({
						click: whenClicked
					});
					layer.on('mouseover', function () {
						this.setStyle({
							'fillColor': '#FF412C',
							'opacity': 0.5,
							'fill': true,
						});
					});
					layer.on('mouseout', function () {
						this.setStyle({
							'color': "#FF412C",
							'fill': false,
							'opacity': 1,
							'clickable': true,
							'weight': 0.8,
						});
					});
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function showHightChart(chartContainer, chartType, categories, chartSeries, labelArea){

					Highcharts.chart(chartContainer, {
						chart: {
							type: chartType,
							style: {
								fontFamily: 'Poppins'
							},
							width: 300,
							height: 200,
						},
						title: false,
						subtitle: false,
						xAxis: {
							categories: categories,
							crosshair: true
						},
						yAxis: {
							title: {
								text: null
							},
							labels: {
								formatter: function () {
									if(labelArea){
										return (this.value / 1000000) + 'Mha';
									}else{
										return (this.value);
									}
								}
							}
						},
						exporting: {
							enabled: false
						},
						credits: {
							enabled: false
						},
						tooltip: {
							headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
							pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
							'<td style="padding:0"><b>{point.y:.1f} hectare</b></td></tr>',
							footerFormat: '</table>',
							shared: true,
							useHTML: true
						},
						plotOptions: {
							column: {
								pointPadding: 0.2,
								pointWidth: 10,
								borderWidth: 0
							},
							series: {
								stacking: 'normal',
							},
							bar: {
								pointWidth: 10,
							}
						},
						series: chartSeries,
						legend: false,
					});

				};
				////////////////////////////////////////////////////////////////////////////////////////////////////////////
				function createToggleList(parentUL, inputID, label, yid, checked) {
					$("#"+parentUL).append(
						'<li class="toggle">'
						+'<label class="switch_layer">'
						+'<input name="'+inputID+'" id="'+inputID+'" data-yid="'+yid+'" type="checkbox" '+checked+'>'
						+'<span class="slider_toggle round"></span>'
						+'</label><label>'+label+'</label>'
						+'</li>'
					);
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function getPieEvi(){
					//set ajax parameters
					var params= {
						polygon_id: polygon_id,
						refLow: refLow,
						refHigh: refHigh,
						studyLow: studyLow,
						studyHigh: studyHigh
					};
					var graphData2 = [];
					MapService.getPieEvi(params)
					.then(function (data) {

						var className = ['Large improvement', 'improvement', 'No Change', 'Under Stress', 'Severe stress'];
						var classColor = ['#264653','#2A9D8F','#E9C46A','#F4A261','#E76F51'];

						for (var i=0; i< className.length; i++) {
							graphData2.push({ name: className[i], y: data[i], color: classColor[i]});
						}

						//Showing the pie chart
						Highcharts.chart('chart', {
							chart: {
								type: 'pie',
								// Explicitly tell the width and height of a chart
								width: 300,
								height: 300,
								style: {
									fontFamily: "sans-serif"
								}
							},
							tooltip: {
								formatter: function () {
									return this.point.name + " (" + (this.point.y).toFixed(2) + ")";
								}
							},

							credits: {
								enabled: false
							},
							title: false,
							subtitle: false,
							plotOptions: {
								pie: {
									allowPointSelect: false,
									cursor: 'pointer',
									dataLabels: {
										enabled: false,
										format: '',
										style: { fontFamily: 'sans-serif'}
									},
									showInLegend: true,
								}

							},
							legend: {
								layout: 'horizontal',
								align: 'left',
								verticalAlign: 'bottom',
								itemMarginTop: 3,
								itemMarginBottom: 3,
								itemStyle: {
									color: '#666666',
									fontWeight: 'normal',
									fontSize: '9px'
								},
								labelFormatter: function() {
									return this.name + " (" + (this.y).toFixed(2) + ")";
								}
							},

							exporting: {
								enabled: false
							},
							series: [{
								name: 'Percent',
								data: graphData2,
								showInLegend: true,

							}]
						});

					}, function (error) {
						$scope.showLoader = false;
						console.log(error);
					});
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function getEviMap(){

					if(map.hasLayer(EVILayer)){
						map.removeLayer(EVILayer);
					}
					//set ajax parameters
					var parameters= {
						polygon_id: polygon_id,
						refLow: refLow,
						refHigh: refHigh,
						studyLow: studyLow,
						studyHigh: studyHigh
					};

					MapService.get_evi_map(parameters)
					.then(function (result){

						EVILayer = addMapLayer(EVILayer, result.eeMapURL, 'EVILayer');

						createToggleList('toggle-list-evi', 'EVILayer', 'Enhanced vegetation index', '', '')

						$("#EVILayer").click(function() {
							if(this.checked) {
								EVILayer.addTo(map);
							} else {
								if(map.hasLayer(EVILayer)){
									map.removeLayer(EVILayer);
								}
							}
						});

					}), function (error){
						console.log(error);
					};

				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function getLineEvi(){
					//set ajax parameters
					var params= {
						polygon_id: polygon_id,
						refLow: refLow,
						refHigh: refHigh,
						studyLow: studyLow,
						studyHigh: studyHigh
					};

					MapService.getLineEvi(params)
					.then(function (data) {
						var serieses = [{
							data: data['timeSeries'],
							name: 'Biophysical Health',
							color: "#2b5154",
							marker: {
								enabled: false,
								radius: 3
							}
						}];

						$('#chart_div').highcharts({
							chart: {
								style: {
									fontFamily: 'Poppins'
								},
								type: 'spline',
								width: 280,
								height: 300,

							},
							title: false,
							tooltip: {},
							yAxis: {
								title: false
							},
							xAxis: {
								type: 'datetime',
								labels: {
									format: '{value: %Y-%m-%d}'
								},
								title: {
									text: 'Date'
								}
							},
							legend: {
								align: 'center',
								verticalAlign: 'bottom',
								y: -25
							},

							plotOptions: {
								series: {
									color: "#2b5154"
								}
							},
							exporting: {
								enabled: false
							},
							series: serieses

						});

					}, function (error) {
						$scope.showLoader = false;
						console.log(error);
					});
				}

				var getForestGainLossStats = function(){
					var params = {
						year: 2018,
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
						type: 'forestGainLoss'
					};

					MapService.getForestGainLoss(params)
					.then(function (data) {

						Highcharts.chart('forest_gainloss_chart', {
							chart: {
								type: 'bar',
								style: {
									fontFamily: 'Poppins'
								},
								width: 300,
								height: 200,
							},
							title: false,
							subtitle: false,
							xAxis :{
								visible : false
							},
							yAxis: {
								title: {
									text: null
								},
								labels: {
									formatter: function () {
										return (this.value / 1000000) + 'Mha';
									}
								}
							},

							plotOptions: {
								series: {
									stacking: 'normal'
								}
							},

							tooltip: {
								formatter: function () {
									return '<b>' + this.series.name + '</b><br/>' +
									'Area in hectare: ' +  Math.abs(this.point.y) ;
								}
							},

							series: [
								{
									name: 'Forest Loss',
									data: [data["forestloss"] * -1],
									color: '#73C6B6'
								},
								{
									name: 'Forest Gain',
									data: [data["forestgain"]],
									color: '#0B5345'
								}],
								exporting: {
									enabled: false
								},
								credits: {
									enabled: false
								},

							});
						});
					}



					var getForestCoverStats = function(){
						var parameters = {
							year: 2018,
							polygon_id: polygon_id,
							treeCanopyDefinition: 10,
							treeHeightDefinition: 5,
							startYear: studyLow,
							endYear: studyHigh,
							type: 'forestExtend'
						};

						MapService.getStats(parameters)
						.then(function (data) {
							var series = [{
								name: 'Area in Hectare',
								data: data['forest'],
								color: '#BED65C'
							}];
							showHightChart('forest_cover_chart', 'column', data['year'], series, true);


							var seriesNoneForest = [{
								name: 'Forest',
								data: data['forest'],
								color: '#138D75'
							},
							{
								name: 'None Forest',
								data: data['noneForest'],
								color: '#CCCCCC'
							}];
							showHightChart('forest_noneforest_chart', 'bar', data['year'], seriesNoneForest, true)


						$scope.showLoader = false;
						$("#biophysical-tab").click()

					}, function (error) {
						console.log(error);
					});
				}

				var getForestMapID = function(){
					var parameters = {
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
						type: 'forestExtend'
					};

					MapService.getForestMapID(parameters)
					.then(function (data) {
						var data = data["data"]
						for(var i=0; i<data.length; i++){
							//create map layer index
							var paneIndex = 'forest_'+data[i][0];
							map.createPane(paneIndex);
							map.getPane(paneIndex).style.zIndex = 300+i;

							//add map layer
							MapLayerArr[data[i][0]].forest = addMapLayer(MapLayerArr[data[i][0]].forest, data[i][1], paneIndex);
							//set map style with opacity = 0.5
							MapLayerArr[data[i][0]].forest.setOpacity(1);

							createToggleList('toggle-list-forest', 'forest_'+data[i][0], data[i][0], data[i][0], '');

							//toggle each of forest map layer
							$("#forest_"+data[i][0]).click(function() {
								var layerID= $(this).attr('data-yid')
								if(this.checked) {
									MapLayerArr[layerID].forest.addTo(map);
								} else {
									if(map.hasLayer(MapLayerArr[layerID].forest)){
										map.removeLayer(MapLayerArr[layerID].forest);
									}
								}
							});

						}
					}, function (error) {
						console.log(error);
					});
				}

				var getForestGainMapID = function(){
					var parameters = {
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
					};

					MapService.getForestGainMapid(parameters)
					.then(function (data) {

						if(map.hasLayer(ForestGainLayer)){
							map.removeLayer(ForestGainLayer);
						}
						ForestGainLayer = addMapLayer(ForestGainLayer, data.eeMapURL, 'ForestGainLayer');
						ForestGainLayer.addTo(map);

						createToggleList('toggle-list-forest', 'ForestGainLayer', 'Forest Gain', '', 'checked');

						$("#ForestGainLayer").click(function() {
							if(this.checked) {
								ForestGainLayer.addTo(map);
							} else {
								if(map.hasLayer(ForestGainLayer)){
									map.removeLayer(ForestGainLayer);
								}
							}
						});

					}, function (error) {
						console.log(error);
					});
				}

				var getForestLossMapID = function(){
					var parameters = {
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
					};

					MapService.getForestLossMapid(parameters)
					.then(function (data) {
						if(map.hasLayer(ForestLossLayer)){
							map.removeLayer(ForestLossLayer);
						}
						ForestLossLayer = addMapLayer(ForestLossLayer, data.eeMapURL, 'ForestLossLayer');
						ForestLossLayer.addTo(map);
						//Forest Loss Layer.setStyle({opacity: 1});

						createToggleList('toggle-list-forest', 'ForestLossLayer', 'Forest Loss', '', 'checked');

						$("#ForestLossLayer").click(function() {
							if(this.checked) {
								ForestLossLayer.addTo(map);
							} else {
								if(map.hasLayer(ForestLossLayer)){
									map.removeLayer(ForestLossLayer);
								}
							}
						});

					}, function (error) {
						console.log(error);
					});
				}

				var getForestAlert = function(){
					var parameters = {
						polygon_id: polygon_id,
						get_image: false,
						startYear: studyLow,
						endYear: studyHigh,
					};

					MapService.getForestAlert(parameters)
					.then(function (data) {
						var area_data = [];
						var number_data = [];
						var total_number = 0;
						var _yearArr = []

						for(var i=2019; i<=2020; i++){

							var _yearData = data[i.toString()];
							var _year = i.toString()

							area_data.push([i, _yearData.total_area]);
							number_data.push([i, _yearData.total_number]);
							_yearArr.push(i);

							total_number += _yearData.total_number;

							//create map layer index
							var paneIndex = 'forestAlert_'+_year;
							map.createPane(paneIndex);
							map.getPane(paneIndex).style.zIndex = 350+i;

							//add map layer
							MapLayerArr[_year].forestAlert = addMapLayer(MapLayerArr[_year].forestAlert, _yearData.eeMapURL, paneIndex);
							//set map style with opacity = 0.5
							MapLayerArr[_year].forestAlert.setOpacity(1);

							createToggleList('toggle-list-forest-alert', 'forestAlert_'+_year, _year, _year, '');

							//toggle each of forest map layer
							$("#forestAlert_"+_year).click(function() {
								var layerID= $(this).attr('data-yid')
								if(this.checked) {
									MapLayerArr[layerID].forestAlert.addTo(map);
								} else {
									if(map.hasLayer(MapLayerArr[layerID].forestAlert)){
										map.removeLayer(MapLayerArr[layerID].forestAlert);
									}
								}
							});

						}
						$("#total_number_forest_alert").text(total_number);

						var series = [{
							name: 'Total Number',
							data: number_data,
							color: '#F5B7B1'
						}];
						showHightChart('forest_alert_number', 'column', _yearArr, series, false);

						var series = [{
							name: 'Area in Hectare',
							data: area_data,
							color: '#d95252'
						}];
						showHightChart('forest_alert_area', 'column', _yearArr, series, true);


					}, function (error) {
						console.log(error);
					});
				}


				var getBurnedArea = function(){
					var parameters = {
						polygon_id: polygon_id,
						startYear: studyLow,
						endYear: studyHigh,
					};

					MapService.getBurnedArea(parameters)
					.then(function (data) {
						var area_data = [];
						var _yearArr = [];

						for(var i=studyLow; i<=studyHigh; i++){

							var _yearData = data[i.toString()];
							var _year = i.toString()

							area_data.push([i, _yearData.total_area]);
							_yearArr.push(i);

							var paneIndex = 'burnedArea_'+_year;
							map.createPane(paneIndex);
							map.getPane(paneIndex).style.zIndex = 380+i;
							//add map layer
							MapLayerArr[_year].burnedArea = addMapLayer(MapLayerArr[_year].burnedArea, _yearData.eeMapURL, paneIndex);
							//set map style with opacity = 0.5
							MapLayerArr[_year].burnedArea.setOpacity(1);

							createToggleList('toggle-list-burned-area', 'burnedArea_'+_year, _year, _year, '');

							//toggle each of forest map layer
							$("#burnedArea_"+_year).click(function() {
								var layerID= $(this).attr('data-yid')
								if(this.checked) {
									MapLayerArr[layerID].burnedArea.addTo(map);
								} else {
									if(map.hasLayer(MapLayerArr[layerID].burnedArea)){
										map.removeLayer(MapLayerArr[layerID].burnedArea);
									}
								}
							});
						}

						var series = [{
							name: 'Area in Hectare',
							data: area_data,
							color: '#d95252'
						}];
						showHightChart('burned_area_chart', 'column', _yearArr, series, true);

					}, function (error) {
						console.log(error);
					});
				}

				/**
				* Alert
				*/
				$scope.closeAlert = function () {
					$('.custom-alert').addClass('display-none');
					$scope.alertContent = '';
				};

				var showErrorAlert = function (alertContent) {
					$scope.alertContent = alertContent;
					$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-success').addClass('alert-danger');
					$timeout(function () {
						$scope.closeAlert();
					}, 10000);
				};

				var showSuccessAlert = function (alertContent) {
					$scope.alertContent = alertContent;
					$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-danger').addClass('alert-success');
					$timeout(function () {
						$scope.closeAlert();
					}, 10000);
				};

				var showInfoAlert = function (alertContent) {
					$scope.alertContent = alertContent;
					$('.custom-alert').removeClass('display-none').removeClass('alert-success').removeClass('alert-danger').addClass('alert-info');
					$timeout(function () {
						$scope.closeAlert();
					}, 10000);

				};


				// A $( document ).ready() block.
				$( document ).ready(function() {
				    console.log( "ready!" );
						cal();
				});


				/**
				* function to collapse menu
				**/
				function collapseMenu() {
					var menuControls = document.getElementById('controls');
					var collapseBtn = document.getElementById('collapse-button');

					if($("#collapse-button").hasClass("up")){
						$("#collapse-button").removeClass("up");
						$("#collapse-button").addClass("down");
						$("#controls").css("display", "none");
					}else{
						$("#collapse-button").removeClass("down");
						$("#collapse-button").addClass("up");
						$("#controls").css("display", "block");
					}
				};

				$("#collapse-button").click(function() {
					collapseMenu();
				});

				$(".draw-tab").click(function () {
					$(".draw-menu").removeClass('hide');
					$(".draw-menu").addClass('show');
					$(".uploadfile-menu").removeClass('show');
					$(".uploadfile-menu").addClass('hide');
					$(".draw-upload-tab").removeClass('selected');
					$(this).addClass('selected');
				});
				$(".draw-upload-tab").click(function () {
					$(".draw-menu").removeClass('show');
					$(".draw-menu").addClass('hide');
					$(".uploadfile-menu").removeClass('hide');
					$(".uploadfile-menu").addClass('show');
					$(".draw-tab").removeClass('selected');
					$(this).addClass('selected');
				});

				$("#draw-tool").click(function() {
					$("#drawing-modal").removeClass('hide');
					$("#drawing-modal").addClass('show');

					if(map.hasLayer(cam_adm2_layer)){
						map.removeLayer(cam_adm2_layer);
					}

					if(map.hasLayer(protected_area_layer)){
						map.removeLayer(protected_area_layer);
					}

				});

				$("#disclaimer-button").click(function() {
					$("#disclaimer-modal").removeClass('hide');
					$("#disclaimer-modal").addClass('show');
				});

				$("#draw-polygon").click(function() {
					$(".modal-background").click();
					new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable();
				});
				$("#draw-rectangle").click(function() {
					$(".modal-background").click();
					new L.Draw.Rectangle(map, drawControl.options.draw.rectangle).enable();
				});
				$("#draw-clear").click(function() {
					$(".modal-background").click();
					editableLayers.clearLayers();
					$("#btn_download").prop("disabled",true);
					$("#btn_download").addClass("btn_custom_disable");

				});
				$(".draw-menu-input").click(function() {
					$("input[type='file']").click();
				});

				// Modal Close Function
				$(".modal-background").click(function() {
					$(".modal").removeClass('show');
					$(".modal").addClass('hide');
				});

				/**
				* Change basemap layer(satellite, terrain, street)
				*/
				$('input[type=radio][name=basemap_selection]').change(function(){
					var selected_basemap = $(this).val();
					if(selected_basemap === "street"){
						basemap_layer.setUrl('https://api.mapbox.com/styles/v1/servirmekong/ckduef35613el19qlsoug6u2h/tiles/256/{z}/{x}/{y}@2x?access_token='+MAPBOXAPI);
					}else if(selected_basemap === "satellite"){
						basemap_layer.setUrl('https://api.mapbox.com/styles/v1/servirmekong/ckecozln92fkk19mjhuoqxhuw/tiles/256/{z}/{x}/{y}@2x?access_token='+MAPBOXAPI);
					}else if(selected_basemap === "terrain"){
						basemap_layer.setUrl('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}');
					}
				});

				/**
				* Toggle layer visualizing
				*/

				$('input[type=checkbox][name=district_toggle]').click(function(){
					if(this.checked) {
						mapLayer_cam_adm2.addTo(map)
					} else {
						if(map.hasLayer(mapLayer_cam_adm2)){
							map.removeLayer(mapLayer_cam_adm2);
						}
					}
				});
				$('input[type=checkbox][name=protected_area_toggle]').click(function(){
					if(this.checked) {
						mapLayer_protected_area.addTo(map);
					} else {
						if(map.hasLayer(mapLayer_protected_area)){
							map.removeLayer(mapLayer_protected_area);
						}
					}
				});
				$('input[type=checkbox][name=cambodia_toggle]').click(function(){
					if(this.checked) {
						mapLayer_cambodia.addTo(map)
					} else {
						if(map.hasLayer(mapLayer_cambodia)){
							map.removeLayer(mapLayer_cambodia);
						}
					}
				});

				$('.protected_area_button').click(function(){
					protected_area_layer.addTo(map);
					if(map.hasLayer(cam_adm2_layer)){
						map.removeLayer(cam_adm2_layer);
					}
				});

				$('.district_button').click(function(){
					cam_adm2_layer.addTo(map);
					if(map.hasLayer(protected_area_layer)){
						map.removeLayer(protected_area_layer);
					}
				});


				$("#zoom-in").click(function() {
					map.zoomIn();
				});

				$("#zoom-out").click(function() {
					map.zoomOut();
				});

				$("#legend-toggle").click(function () {
					if($(".legend").css("display") === "none"){
						$(".legend").show();
					}else{
						$(".legend").hide();
					}

				});

				$("#full-screen").click(function() {
					if($(".container-wrapper").css("margin-top") ===  "90px" ){
						$("nav").hide();
						$(".container-wrapper").css("margin-top", "0");
						$(".c-map-menu .menu-tiles").css("top", "0");
						$(".c-menu-panel").css("top", "0");
						$(".map").css("height", "100vh");
						$('.map-controller').css("top", "5px");
					}else{
						$("nav").show();
						$(".container-wrapper").css("margin-top", "90px");
						$(".c-map-menu .menu-tiles").css("top", "90px");
						$(".c-menu-panel").css("top", "90px");
						$(".map").css("height", "calc(100vh - 90px)");
						$('.map-controller').css("top", "95px");
					}
				});

				$(".close-menu").click(function () {
					$(".map-controller").css('left', '80px');
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('.c-menu-panel').css('opacity', 0);
					$("#biophysical-tab").removeClass("active");
					$("#basemap-tab").removeClass("active");
					$("#forest-monitoring-tab").removeClass("active");
					$("#forest-alert-tab").removeClass("active");
					$("#layers-tab").removeClass("active");
					$("#usecase-tab").removeClass("active");

					$("#biophysical-icon").attr("src","/static/images/icons/menu/biophysical-monitoring-green.png");
					$("#forest-monitoring-icon").attr("src","/static/images/icons/menu/forest-monitoring-green.png");
					$("#forest-alert-icon").attr("src","/static/images/icons/menu/forest-alert-green.png");
					$("#layers-icon").attr("src","/static/images/icons/menu/map-layers-green.png");
					$("#fire-icon").attr("src","/static/images/icons/menu/fire-burned-green.png");

				});

				$("#biophysical-tab").click(function () {
					$(".close-menu").click();
					$(".map-controller").css('left', '420px');
					$("#forest-monitoring-tab").removeClass("active");
					$("#forest-alert-tab").removeClass("active");
					$("#fire-tab").removeClass("active");
					$("#basemap-tab").removeClass("active");
					$("#layers-tab").removeClass("active");
					$(this).addClass("active");
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('#panel-biophysical').css('transform', ' translateX(6.75rem)');
					$('#panel-biophysical').css('opacity', 1);
					$("#biophysical-icon").attr("src","/static/images/icons/menu/biophysical-monitoring.png");
					$("#forest-monitoring-icon").attr("src","/static/images/icons/menu/forest-monitoring-green.png");
					$("#forest-alert-icon").attr("src","/static/images/icons/menu/forest-alert-green.png");
					$("#layers-icon").attr("src","/static/images/icons/menu/map-layers-green.png");
					$("#fire-icon").attr("src","/static/images/icons/menu/fire-burned-green.png");
				});
				$("#forest-monitoring-tab").click(function () {
					$(".close-menu").click();
					$(".map-controller").css('left', '420px');
					$("#biophysical-tab").removeClass("active");
					$("#forest-alert-tab").removeClass("active");
					$("#fire-tab").removeClass("active");
					$("#basemap-tab").removeClass("active");
					$("#layers-tab").removeClass("active");
					$(this).addClass("active");
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('#panel-forest-monitoring').css('transform', ' translateX(6.75rem)');
					$('#panel-forest-monitoring').css('opacity', 1);
					$("#biophysical-icon").attr("src","/static/images/icons/menu/biophysical-monitoring-green.png");
					$("#forest-monitoring-icon").attr("src","/static/images/icons/menu/forest-monitoring.png");
					$("#forest-alert-icon").attr("src","/static/images/icons/menu/forest-alert-green.png");
					$("#layers-icon").attr("src","/static/images/icons/menu/map-layers-green.png");
					$("#fire-icon").attr("src","/static/images/icons/menu/fire-burned-green.png");
				});
				$("#forest-alert-tab").click(function () {
					$(".close-menu").click();
					$(".map-controller").css('left', '420px');
					$("#biophysical-tab").removeClass("active");
					$("#forest-monitoring-tab").removeClass("active");
					$("#fire-tab").removeClass("active");
					$("#basemap-tab").removeClass("active");
					$("#layers-tab").removeClass("active");
					$(this).addClass("active");
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('#panel-forest-alert').css('transform', ' translateX(6.75rem)');
					$('#panel-forest-alert').css('opacity', 1);
					$("#biophysical-icon").attr("src","/static/images/icons/menu/biophysical-monitoring-green.png");
					$("#forest-monitoring-icon").attr("src","/static/images/icons/menu/forest-monitoring-green.png");
					$("#forest-alert-icon").attr("src","/static/images/icons/menu/forest-alert.png");
					$("#layers-icon").attr("src","/static/images/icons/menu/map-layers-green.png");
					$("#fire-icon").attr("src","/static/images/icons/menu/fire-burned-green.png");
				});

				$("#fire-tab").click(function () {
					$(".close-menu").click();
					$(".map-controller").css('left', '420px');
					$("#biophysical-tab").removeClass("active");
					$("#forest-monitoring-tab").removeClass("active");
					$("#forest-alert-tab").removeClass("active");
					$(this).addClass("active");
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('#panel-fire').css('transform', ' translateX(6.75rem)');
					$('#panel-fire').css('opacity', 1);
					$("#biophysical-icon").attr("src","/static/images/icons/menu/biophysical-monitoring-green.png");
					$("#forest-monitoring-icon").attr("src","/static/images/icons/menu/forest-monitoring-green.png");
					$("#forest-alert-icon").attr("src","/static/images/icons/menu/forest-alert-green.png");
					$("#layers-icon").attr("src","/static/images/icons/menu/map-layers-green.png");
					$("#fire-icon").attr("src","/static/images/icons/menu/fire-burned.png");
				});

				$("#basemap-tab").click(function () {
					$(".close-menu").click();
					$(".map-controller").css('left', '420px');
					$("#forest-monitoring-tab").removeClass("active");
					$("#biophysical-tab").removeClass("active");
					$("#forest-alert-tab").removeClass("active");
					$("#usecase-tab").removeClass("active");
					$("#layers-tab").removeClass("active");
					$(this).addClass("active");
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('#panel3').css('transform', ' translateX(6.75rem)');
					$('#panel3').css('opacity', 1);
				});

				$("#layers-tab").click(function () {
					$(".close-menu").click();
					$(".map-controller").css('left', '420px');
					$("#forest-monitoring-tab").removeClass("active");
					$("#biophysical-tab").removeClass("active");
					$("#forest-alert-tab").removeClass("active");
					$("#fire-tab").removeClass("active");
					$("#usecase-tab").removeClass("active");
					$("#basemap-tab").removeClass("active");
					$(this).addClass("active");
					$('.c-menu-panel').css('transform', ' translateX(-60rem)');
					$('#panel-layers').css('transform', ' translateX(6.75rem)');
					$('#panel-layers').css('opacity', 1);

					$("#biophysical-icon").attr("src","/static/images/icons/menu/biophysical-monitoring-green.png");
					$("#forest-monitoring-icon").attr("src","/static/images/icons/menu/forest-monitoring-green.png");
					$("#forest-alert-icon").attr("src","/static/images/icons/menu/forest-alert-green.png");
					$("#layers-icon").attr("src","/static/images/icons/menu/map-layers.png");
					$("#fire-icon").attr("src","/static/images/icons/menu/fire-burned-green.png");

				});

				$("#evi_pie_png").click(function() {
					var chart = $('#chart').highcharts();
					chart.exportChart();
				});
				$("#evi_line_png").click(function() {
					var chart = $('#chart_div').highcharts();
					chart.exportChart();
				});

				$("#forest_column_png").click(function() {
					var chart = $('#forest_cover_chart').highcharts();
					chart.exportChart();
				});
				$("#forest_bar_png").click(function() {
					var chart = $('#forest_noneforest_chart').highcharts();
					chart.exportChart();
				});
				$("#forest_gainloss_png").click(function() {
					var chart = $('#forest_gainloss_chart').highcharts();
					chart.exportChart();
				});

				$("#forest_alert_number_png").click(function() {
					var chart = $('#forest_alert_number').highcharts();
					chart.exportChart();
				});
				$("#forest_alert_area_png").click(function() {
					var chart = $('#forest_alert_area').highcharts();
					chart.exportChart();
				});

				$("#burned_area_png").click(function() {
					var chart = $('#burned_area_chart').highcharts();
					chart.exportChart();
				});


				$("#evi_pie_csv").click(function() {
					var chart = $('#chart').highcharts();
					chart.downloadCSV();
				});
				$("#evi_line_csv").click(function() {
					var chart = $('#chart_div').highcharts();
					chart.downloadCSV();
				});

				$("#forest_column_csv").click(function() {
					var chart = $('#forest_cover_chart').highcharts();
					chart.downloadCSV();
				});
				$("#forest_bar_csv").click(function() {
					var chart = $('#forest_noneforest_chart').highcharts();
					chart.downloadCSV();
				});
				$("#forest_gainloss_csv").click(function() {
					var chart = $('#forest_gainloss_chart').highcharts();
					chart.downloadCSV();
				});

				$("#forest_alert_number_csv").click(function() {
					var chart = $('#forest_alert_number').highcharts();
					chart.downloadCSV();
				});
				$("#forest_alert_area_csv").click(function() {
					var chart = $('#forest_alert_area').highcharts();
					chart.downloadCSV();
				});

				$("#burned_area_csv").click(function() {
					var chart = $('#burned_area_chart').highcharts();
					chart.downloadCSV();
				});

				/**
				* Upload Area Button
				**/
				var readFile = function (e) {
					var files = e.target.files;
					if (files.length > 1) {
						console.log('upload one file at a time');
					} else {
						//MapService.removeGeoJson(map);

						var file = files[0];
						var reader = new FileReader();
						reader.readAsText(file);

						reader.onload = function (event) {

							var textResult = event.target.result;
							var addedGeoJson;
							var extension = file.name.split('.').pop().toLowerCase();
							if ((['kml', 'application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz'].indexOf(extension) > -1)) {
								var kmlDoc;

								if (window.DOMParser) {
									var parser = new DOMParser();
									kmlDoc = parser.parseFromString(textResult, 'text/xml');
								} else { // Internet Explorer
									kmlDoc = new ActiveXObject('Microsoft.XMLDOM');
									kmlDoc.async = false;
									kmlDoc.loadXML(textResult);
								}
								addedGeoJson = toGeoJSON.kml(kmlDoc);
							} else {
								try {
									addedGeoJson = JSON.parse(textResult);
								} catch (e) {
									alert('we only accept kml, kmz and geojson');
								}
							}

							if (((addedGeoJson.features) && (addedGeoJson.features.length === 1)) || (addedGeoJson.type === 'Feature')) {

								var geometry = addedGeoJson.features ? addedGeoJson.features[0].geometry : addedGeoJson.geometry;

								if (geometry.type === 'Polygon') {
									//MapService.addGeoJson(map, addedGeoJson);
									// Convert to Polygon
									var polygonArray = [];
									var shape = {};
									var _coord = geometry.coordinates[0];

									for (var i = 0; i < _coord.length; i++) {
										var coordinatePair = [(_coord[i][1]).toFixed(2), (_coord[i][0]).toFixed(2)];
										polygonArray.push(coordinatePair);
									}

									if (polygonArray.length > 500) {
										alert('Complex geometry will be simplified using the convex hull algorithm!');
									}

									polygonArray = polygonArray.map(function(elem) {
										return elem.map(function(elem2) {
											return parseFloat(elem2);
										});
									});
									editableLayers.clearLayers();
									var layer = L.polygon(polygonArray , {color: 'red'});
									drawing_polygon = [];
									var userPolygon = layer.toGeoJSON();
									drawing_polygon.push('ee.Geometry.Polygon(['+ JSON.stringify(userPolygon.geometry.coordinates[0])+'])');
									updateFloodMapLayer();
									updatePermanentWater();
									layer.addTo(map);
									map.fitBounds(layer.getBounds());
									editableLayers.addLayer(layer);
									//active download button
									$("#btn_download").prop("disabled",false);
									$("#btn_download").removeClass("btn_custom_disable");

								} else {
									alert('multigeometry and multipolygon not supported yet!');
								}
							} else {
								alert('multigeometry and multipolygon not supported yet!');
							}
						};
					}
				};

				$('#input-file2').change(function (event) {
					readFile(event);
				});


				function addGibsLayer(layer,product,date){
					var template =
					'//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
					'{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg';

					layer = L.tileLayer(template, {
						layer: product,
						tileMatrixSet: 'GoogleMapsCompatible_Level9',
						maxZoom: 9,
						time: date,
						tileSize: 256,
						subdomains: 'abc',
						noWrap: true,
						continuousWorld: true,
						// Prevent Leaflet from retrieving non-existent tiles on the
						// borders.
						bounds: [
							[-85.0511287776, -179.999999975],
							[85.0511287776, 179.999999975]
						],
						attribution:
						'<a href="https://wiki.earthdata.nasa.gov/display/GIBS" target="_">' +
						'NASA EOSDIS GIBS</a>;'
					});

					map.addLayer(layer);

					return layer;
				}
			});

		})();
