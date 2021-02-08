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
			Forest2015, Forest2016, Forest2017, Forest2018, Forest2019, Forest2020, Forest2021, ForestAlert2000, ForestAlert2001, ForestAlert2002, ForestAlert2003,ForestAlert2004, ForestAlert2005, ForestAlert2006, ForestAlert2007, ForestAlert2008, ForestAlert2009, ForestAlert2010, ForestAlert2011, ForestAlert2012, ForestAlert2013, ForestAlert2014,
			ForestAlert2015, ForestAlert2016, ForestAlert2017, ForestAlert2018, ForestAlert2019,ForestAlert2020, ForestAlert2021, BurnedArea2000, BurnedArea2001, BurnedArea2002, BurnedArea2003,BurnedArea2004, BurnedArea2005, BurnedArea2006, BurnedArea2007, BurnedArea2008, BurnedArea2009, BurnedArea2010, BurnedArea2011, BurnedArea2012, BurnedArea2013, BurnedArea2014,
			BurnedArea2015, BurnedArea2016, BurnedArea2017, BurnedArea2018, BurnedArea2019,BurnedArea2020, BurnedArea2021, ForestGainLayer, ForestLossLayer, ForestAlertLayer];

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
				}
			};

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			// Extract an array of coordinates for the given polygon.
			var getCoordinates = function (coords) {
				var polygon_coords = "";
				for(var i=0; i<coords.length; i++){
					if(i!==coords.length-1){
						polygon_coords += "("+coords[i][1]+","+coords[i][0]+"),";
					}else{
						polygon_coords += "("+coords[i][1]+","+coords[i][0]+")";
					}
				}
				return polygon_coords;
			};

			var polygon_id = "";
			//var coords = cambodia_polygon.features[0].geometry.coordinates[0][0];
			var area_id = "";
			var area0 = "";
			var area1 = "";
			var area_type = "";

			//Geojson feature style
			var polygonstyle = {
				color: "#FF412C",
				fill: false,
				opacity: 1,
				clickable: true,
				weight: 0.8,
			};

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
					studyHigh = data.to;
					studyLow = data.from;
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
					refHigh = data.to;
					refLow = data.from;
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

			map.createPane('basemap');
			map.getPane('basemap').style.zIndex = 0;
			map.getPane('basemap').style.pointerEvents = 'none';


			basemap_layer = L.tileLayer('https://api.mapbox.com/styles/v1/servirmekong/ckduef35613el19qlsoug6u2h/tiles/256/{z}/{x}/{y}@2x?access_token='+MAPBOXAPI, {
				attribution: '',
				pane:'basemap'
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
			var coords = cambodia_polygon.features[0].geometry.coordinates[0][0];
			polygon_id = getCoordinates(coords);
			area_type = 'country';
			area_id = 'Cambodia';


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
			map.getPane('admin').style.zIndex = 999;
			//	map.getPane('admin').style.pointerEvents = 'none';
			map.createPane('maplayer_cam');
			map.getPane('maplayer_cam').style.zIndex = 450;
		  map.getPane('maplayer_cam').style.pointerEvents = 'none';
			map.createPane('maplayer_protect');
			map.getPane('maplayer_protect').style.zIndex = 451;
		  map.getPane('maplayer_protect').style.pointerEvents = 'none';

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
				pane:'maplayer_protect'
			});

			var mapLayer_cam_adm1 =L.geoJson(cam_adm1, {
				style: function (feature) {
					return {
						color: "#222831",
						fill: false,
						opacity: 1,
						clickable: true,
						weight: 0.5,
					};
				},
				pane:'maplayer_cam'
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
				pane:'maplayer_cam'
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
				pane:'maplayer_cam'
			});

			var protected_area_layer = L.geoJson(protected_area, {
				style: function (feature) {
	  			return {
	  				weight: 2,
	  				opacity: 1,
	  				color: '#333',
						fillOpacity: 0.1,
	  				dashArray: 3,
	  			};
	  		},
				onEachFeature: function (feature, layer) {
			    layer.on({
	  		    'mouseover': function (e) {
	  		      highlight(e.target);
							$(".highlight_area_textbox").css("display", "block");
							$(".highlight_area_textbox").text(e.target.feature.properties.name);
	  		    },
	  		    'mouseout': function (e) {
	  		      dehighlight(e.target, protected_area_layer);
							$(".highlight_area_textbox").css("display", "none");
	  		    },
	  				'click': function (e) {
							var selected_name = e.target.feature.properties.name;
							select(e.target, protected_area_layer, selected_name, "protected_area");
	  				}
	  			});
	  		},
				pane:'admin'
			});

			var cam_adm1_layer =L.geoJson(cam_adm1, {
				style: function (feature) {
	  			return {
	  				weight: 2,
	  				opacity: 1,
						fillOpacity: 0.1,
	  				color: '#333',
	  				dashArray: 3,
	  			};
	  		},
				onEachFeature: function (feature, layer) {
			    layer.on({
	  		    'mouseover': function (e) {
	  		      highlight(e.target);
							$(".highlight_area_textbox").css("display", "block");
							$(".highlight_area_textbox").text( e.target.feature.properties.country + '/' + e.target.feature.properties.name);
	  		    },
	  		    'mouseout': function (e) {
	  		      dehighlight(e.target, cam_adm1_layer);
							$(".highlight_area_textbox").css("display", "none");
	  		    },
	  				'click': function (e) {
							var selected_name = e.target.feature.properties.country + '/' + e.target.feature.properties.name;
							select(e.target, cam_adm1_layer, selected_name, "province");
	  				}
	  			});
	  		},
				pane:'admin',
				interactive: true
			});


			var cam_adm2_layer =L.geoJson(cam_adm2, {
				style: function (feature) {
	  			return {
	  				weight: 2,
	  				opacity: 1,
						fillOpacity: 0.1,
	  				color: '#333',
	  				dashArray: 3,
	  			};
	  		},
				onEachFeature: function (feature, layer) {
			    layer.on({
	  		    'mouseover': function (e) {
	  		      highlight(e.target);
							$(".highlight_area_textbox").css("display", "block");
							$(".highlight_area_textbox").text( e.target.feature.properties.ADM1_NAME + '/' + e.target.feature.properties.ADM2_NAME);
	  		    },
	  		    'mouseout': function (e) {
	  		      dehighlight(e.target, cam_adm2_layer);
							$(".highlight_area_textbox").css("display", "none");
	  		    },
	  				'click': function (e) {
							var selected_name = e.target.feature.properties.ADM1_NAME + '/' + e.target.feature.properties.ADM2_NAME;
							select(e.target, cam_adm2_layer, selected_name, "district");
	  				}
	  			});
	  		},
				pane:'admin',
				interactive: true
			});

			// Initialise the draw control and pass it the FeatureGroup of editable layers
			var drawControl = new L.Control.Draw(drawPluginOptions);
			map.addControl(drawControl);

			map.on('draw:created', function(e) {
				if(map.hasLayer(protected_area_layer)){
					map.removeLayer(protected_area_layer);
				}
				if(map.hasLayer(cam_adm2_layer)){
					map.removeLayer(cam_adm2_layer);
				}
				editableLayers.clearLayers();
				var type = e.layerType,
				layer = e.layer;

				map.fitBounds(layer.getBounds());
				editableLayers.addLayer(layer);

				var userPolygon = layer.toGeoJSON();
				var coords = userPolygon.geometry.coordinates;
				polygon_id = getCoordinates(coords[0]);
				polygonVertex = coords.length;
				area_type= "draw";
				//cal();
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
					if(map.hasLayer(EVILayer)){
						map.removeLayer(EVILayer);
					}
					if(map.hasLayer(ForestGainLayer)){
						map.removeLayer(ForestGainLayer);
					}
					if(map.hasLayer(ForestLossLayer)){
						map.removeLayer(ForestLossLayer);
					}

					for(var i=studyLow; i<=studyHigh; i++){
						var _year  = i.toString();
						if(map.hasLayer(MapLayerArr[_year].forest)){
							map.removeLayer(MapLayerArr[_year].forest);
						}
						if(map.hasLayer(MapLayerArr[_year].forestAlert)){
							map.removeLayer(MapLayerArr[_year].forestAlert);
						}
						if(map.hasLayer(MapLayerArr[_year].burnedArea)){
							map.removeLayer(MapLayerArr[_year].burnedArea);
						}
					}

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
					getChangeForestGainLossStats();

					getForestAlert();
					getBurnedArea();


				}
				var selected = null;
				var previous = null;
				function highlight (layer) {
					layer.setStyle({
						weight: 5,
						dashArray: '',
						fillOpacity: 0,
						color: 'yellow'
					});
					if (!L.Browser.ie && !L.Browser.opera) {
						layer.bringToFront();
					}

				}

				function dehighlight (layer, geojson) {
				  if (selected === null || selected._leaflet_id !== layer._leaflet_id) {
					  geojson.resetStyle(layer);
				  }
				}

				function select(layer, geojson, selectedArea, areaType) {
				  if (selected !== null) {
				    previous = selected;
				  }
					map.fitBounds(layer.getBounds());
					selected = layer;
					var coords = layer.feature.geometry.coordinates;
					polygon_id = getCoordinates(coords[0][0]);
					polygonVertex = coords.length;
					area_type = areaType;
					if(areaType === "protected_area"){
						area_id = layer.feature.properties.map_id;
					}else if(areaType === "province"){
						area_id = layer.feature.properties.gid;
					}else if(areaType === "district"){
						area_id = layer.feature.properties.DIST_CODE;
					}else if(areaType === "country"){
						area_id = layer.feature.properties.NAME_ENGLI;
					}

					if (previous) {
					  dehighlight(previous, geojson);
					}

					$('.selected_area_name').text(selectedArea);

				}


				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function showHightChart(chartContainer, chartType, categories, chartSeries, labelArea, pointWidth){

					Highcharts.chart(chartContainer, {
						chart: {
							type: chartType,
							style: {
								fontFamily: 'Roboto Condensed'
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
							formatter: function () {
								if(labelArea){
									return this.series.name + " (" + this.point.y + " hectare)";
								}else{
									return this.series.name + " (" + this.point.y + " evidence)";
								}
							}
						},
						plotOptions: {
							column: {
								pointPadding: 0.2,
								pointWidth: pointWidth,
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

				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////
				function createToggleList(parentUL, inputID, label, yid, checked, bgcolor) {
					$("#"+parentUL).append(
						'<li class="toggle"><label class="switch_layer"><input name="'+inputID+'" id="'+inputID+'" data-yid="'+yid+'" data-color="#'+bgcolor+'" type="checkbox" '+checked+'><span class="slider_toggle round"></span></input></label><label>'+label+'</label></li>'
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
						studyHigh: studyHigh,
						area_id: area_id,
						area_type: area_type,
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
									fontFamily: "Roboto Condensed"
								}
							},
							tooltip: {
								formatter: function () {
									return this.point.name + " (" + this.point.percentage.toFixed(2) + "%)";
								}
								// pointFormat: '{series.name}: <br>{point.percentage:.1f} %<br>: {point.total}'
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
										style: { fontFamily: 'Roboto Condensed'}
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
									return this.name + " (" + this.percentage.toFixed(2) + "%)";
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
						studyHigh: studyHigh,
						area_id: area_id,
						area_type: area_type,
					};

					MapService.get_evi_map(parameters)
					.then(function (result){

						EVILayer = addMapLayer(EVILayer, result.eeMapURL, 'EVILayer');
						map.addLayer(EVILayer);
						createToggleList('toggle-list-evi', 'EVILayer', 'Enhanced vegetation index', '', 'checked', '36461F');

						$("#EVILayer").click(function() {
							if(this.checked) {
								EVILayer.addTo(map);
								var toggleColor = $(this).attr('data-color');
								$(this).closest("label").find("span").css("background-color", '#36461F');
							} else {
								$(this).closest("label").find("span").css("background-color", '#bbb');
								if(map.hasLayer(EVILayer)){
									map.removeLayer(EVILayer);
								}
							}
						});
					});
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function getLineEvi(){
					//set ajax parameters
					var params= {
						polygon_id: polygon_id,
						refLow: refLow,
						refHigh: refHigh,
						studyLow: studyLow,
						studyHigh: studyHigh,
						area_id: area_id,
						area_type: area_type,
					};

					MapService.getLineEvi(params)
					.then(function (data) {
						var serieses = [{
							data: data.timeSeries,
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
									fontFamily: 'Roboto Condensed'
								},
								type: 'spline',
								width: 250,
								height: 280,

							},
							title: false,
							tooltip: {
								formatter: function () {
								return '<b>' + this.series.name + '</b><br/>' +
								'Cumulative anomaly EVI: ' +  this.point.y.toFixed(2) ;
							}
						},
							yAxis: {
								title: {
									text: 'Cumulative anomaly EVI'
								}
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

						// $scope.showLoader = false;
						// $("#biophysical-tab").click();


					}, function (error) {
						$scope.showLoader = false;
						console.log(error);
					});
				}

				function getForestGainLossStats(){
					var params = {
						year: 2018,
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
						type: 'forestGainLoss',
						area_id: area_id,
						area_type: area_type,
					};

					MapService.getForestGainLoss(params)
					.then(function (data) {

						Highcharts.chart('forest_gainloss_chart', {
							chart: {
								type: 'bar',
								style: {
									fontFamily: 'Roboto Condensed'
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
									data: [data.forestloss * -1],
									color: '#73C6B6'
								},
								{
									name: 'Forest Gain',
									data: [data.forestgain],
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

					function getChangeForestGainLossStats(){
						var params = {
							year: 2018,
							polygon_id: polygon_id,
							treeCanopyDefinition: 10,
							treeHeightDefinition: 5,
							studyLow: studyLow,
							studyHigh: studyHigh,
							refLow: refLow,
							refHigh: refHigh,
							type: 'forestGainLoss',
							area_id: area_id,
							area_type: area_type,
						};

						MapService.getChangeForestGainLoss(params)
						.then(function (data) {

								var gain = (data.statsStudyGain - data.statsRefGain).toFixed(2);
								var loss = (data.statsStudyLoss - data.statsRefLoss).toFixed(2);

								if(gain < 0){
									//gain = "-" + gain
									$('#gain_compared').css("color", "red");
									$('#gain_compared').text(gain);
								}else{
									//gain = "+" + gain
									$('#gain_compared').css("color", "green");
									$('#gain_compared').text(gain);
								}

								if(loss < 0 ){
									//loss = "-" + loss
									$('#loss_compared').css("color", "green");
									$('#loss_compared').text(loss);
								}else{
									//loss = "+" + loss
									$('#loss_compared').css("color", "red");
									$('#loss_compared').text(loss);
								}


								$('#loss_compared').text(loss);

								Highcharts.setOptions({
								  lang: {
								    thousandsSep: ' '
								  },
								  colors: [ '#A04000','#117A65']
								});
								Highcharts.chart('forest_change_gainloss_chart', {
								    chart: {
								        type: 'column',
												style: {
													fontFamily: 'Roboto Condensed'
												},
												width: 300,
												height: 200,
								    },
										title: false,
 			 							subtitle: false,
								    xAxis: {
								        categories: [
								            'BASELINE PERIOD',
								            'MEASURING PERIOD'
								        ],
								        crosshair: true
								    },
								    yAxis: {
								        min: 0,
								        title: {
								            text: null
								        }
								    },
								    tooltip: {
											formatter: function () {
												return this.series.name + " (" + (this.point.y).toFixed(2) + ")";
											}
								    },
								    plotOptions: {
								        column: {
														pointPadding: 0,
														pointWidth: 25,
								            borderWidth: 0
								        }
								    },
								    series: [{
								        name: 'LOSS',
								        data: [data.statsRefLoss, data.statsStudyLoss],
												color: ''

								    }, {
								        name: 'GAIN',
								        data: [data.statsRefGain, data.statsStudyGain],
												color: ''

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

				function getForestMapID(){
					var parameters = {
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
						type: 'forestExtend',
						area_id: area_id,
						area_type: area_type,
					};

					MapService.getForestMapID(parameters)
					.then(function (res) {
						var data = res;
						var forestArea = [];
						var noneforestArea = [];
						var yearArr = [];

						for(var i=studyLow; i<=studyHigh; i++){
							//create map layer index
							var year_string =  i.toString();
							yearArr.push(year_string);
							forestArea.push(data[year_string].forest);
							noneforestArea.push(data[year_string].noneForest);

							var paneIndex = 'forest_'+year_string;
							map.createPane(paneIndex);
							map.getPane(paneIndex).style.zIndex = 300+i;

							if(map.hasLayer(MapLayerArr[year_string].forest)){
								map.removeLayer(MapLayerArr[year_string].forest);
							}
							//add map layer
							MapLayerArr[year_string].forest = addMapLayer(MapLayerArr[year_string].forest, data[year_string].eeMapURL, paneIndex);
							//set map style with opacity = 0.5
							MapLayerArr[year_string].forest.setOpacity(1);

							/*jshint loopfunc: true */
							createToggleList('toggle-list-forest', 'forest_'+year_string, year_string, year_string, '', data[year_string].color);

							//toggle each of forest map layer
							$("#forest_"+year_string).click(function() {
								var layerID= $(this).attr('data-yid');
								if(this.checked) {
									var toggleColor = $(this).attr('data-color');
									$(this).closest("label").find("span").css("background-color", toggleColor);
									MapLayerArr[layerID].forest.addTo(map);
								} else {
									$(this).closest("label").find("span").css("background-color", '#bbb');
									if(map.hasLayer(MapLayerArr[layerID].forest)){
										map.removeLayer(MapLayerArr[layerID].forest);
									}
								}
							});

						}

						var series = [{
							name: 'Area in Hectare',
							data: forestArea,
							color: '#138D75'
						}];
						showHightChart('forest_cover_chart', 'column', yearArr, series, true, 10);


						var seriesNoneForest = [{
							name: 'Forest',
							data: forestArea,
							color: '#138D75'
						},
						{
							name: 'None Forest',
							data: noneforestArea,
							color: '#919F94'
						}];
						showHightChart('forest_noneforest_chart', 'bar', yearArr, seriesNoneForest, true, 10);

					}, function (error) {
						console.log(error);
					});
				}

				function getForestGainMapID(){
					var parameters = {
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
						area_id: area_id,
						area_type: area_type,
					};

					MapService.getForestGainMapid(parameters)
					.then(function (data) {

						if(map.hasLayer(ForestGainLayer)){
							map.removeLayer(ForestGainLayer);
						}
						ForestGainLayer = addMapLayer(ForestGainLayer, data.eeMapURL, 'ForestGainLayer');
						//ForestGainLayer.addTo(map);

						/*jshint loopfunc: true */
						createToggleList('toggle-list-forest', 'ForestGainLayer', 'Forest Gain', '', '', data.color);

						$("#ForestGainLayer").click(function() {
							if(this.checked) {
								var toggleColor = $(this).attr('data-color');
								$(this).closest("label").find("span").css("background-color", toggleColor);
								ForestGainLayer.addTo(map);
							} else {
								$(this).closest("label").find("span").css("background-color", '#bbb');
								if(map.hasLayer(ForestGainLayer)){
									map.removeLayer(ForestGainLayer);
								}
							}
						});

					}, function (error) {
						console.log(error);
					});
				}

				function getForestLossMapID(){
					var parameters = {
						polygon_id: polygon_id,
						treeCanopyDefinition: 10,
						treeHeightDefinition: 5,
						startYear: studyLow,
						endYear: studyHigh,
						area_id: area_id,
						area_type: area_type,
					};

					MapService.getForestLossMapid(parameters)
					.then(function (data) {
						if(map.hasLayer(ForestLossLayer)){
							map.removeLayer(ForestLossLayer);
						}
						ForestLossLayer = addMapLayer(ForestLossLayer, data.eeMapURL, 'ForestLossLayer');
						//ForestLossLayer.addTo(map);
						//Forest Loss Layer.setStyle({opacity: 1});

						/*jshint loopfunc: true */
						createToggleList('toggle-list-forest', 'ForestLossLayer', 'Forest Loss', '', '', data.color);

						$("#ForestLossLayer").click(function() {
							if(this.checked) {
								var toggleColor = $(this).attr('data-color');
								$(this).closest("label").find("span").css("background-color", toggleColor);
								ForestLossLayer.addTo(map);
							} else {
								$(this).closest("label").find("span").css("background-color", '#bbb');
								if(map.hasLayer(ForestLossLayer)){
									map.removeLayer(ForestLossLayer);
								}
							}
						});

					}, function (error) {
						console.log(error);
					});
				}

				function getForestAlert(){
					var parameters = {
						polygon_id: polygon_id,
						area_id: area_id,
						area_type: area_type,
						get_image: false,
						startYear: studyLow,
						endYear: studyHigh,
					};

					MapService.getForestAlert(parameters)
					.then(function (data) {
						var area_data = [];
						var number_data = [];
						var total_number = 0;
						var _yearArr = [];

						for(var i=2019; i<=2020; i++){

							var _yearData = data[i.toString()];
							var _year = i.toString();

							area_data.push([i, _yearData.total_area]);
							number_data.push([i, _yearData.total_number]);
							_yearArr.push(i);

							total_number += _yearData.total_number;

							//create map layer index
							var paneIndex = 'forestAlert_'+_year;
							map.createPane(paneIndex);
							map.getPane(paneIndex).style.zIndex = 350+i;

							if(map.hasLayer(MapLayerArr[_year].forestAlert)){
								map.removeLayer(MapLayerArr[_year].forestAlert);
							}

							//add map layer
							MapLayerArr[_year].forestAlert = addMapLayer(MapLayerArr[_year].forestAlert, _yearData.eeMapURL, paneIndex);
							//set map style with opacity = 0.5
							MapLayerArr[_year].forestAlert.setOpacity(1);

							/*jshint loopfunc: true */
							createToggleList('toggle-list-forest-alert', 'forestAlert_'+_year, _year, _year, '',_yearData.color);

							//toggle each of forest map layer
							$("#forestAlert_"+_year).click(function() {
								var layerID= $(this).attr('data-yid');
								if(this.checked) {
									var toggleColor = $(this).attr('data-color');
									$(this).closest("label").find("span").css("background-color", toggleColor);
									MapLayerArr[layerID].forestAlert.addTo(map);
								} else {
									$(this).closest("label").find("span").css("background-color", '#bbb');
									if(map.hasLayer(MapLayerArr[layerID].forestAlert)){
										map.removeLayer(MapLayerArr[layerID].forestAlert);
									}
								}
							});

						}

						// $("#total_number_forest_alert").text(total_number);
						//
						// var series = [{
						// 	name: 'Total Number',
						// 	data: number_data,
						// 	color: '#F5B7B1'
						// }];
						// showHightChart('forest_alert_number', 'column', _yearArr, series, false, 30);

						var seriesArea = [{
							name: 'Area in Hectare',
							data: area_data,
							color: '#d95252'
						}];
						showHightChart('forest_alert_area', 'column', _yearArr, seriesArea, true, 30);


					}, function (error) {
						console.log(error);
					});
				}


				function getBurnedArea(){
					var parameters = {
						polygon_id: polygon_id,
						startYear: studyLow,
						endYear: studyHigh,
						area_type: area_type,
						area_id: area_id
					};

					MapService.getBurnedArea(parameters)
					.then(function (data) {
						var area_data = [];
						var _yearArr = [];

						for(var i=studyLow; i<=studyHigh; i++){

							var _yearData = data[i.toString()];
							var _year = i.toString();

							area_data.push([i, _yearData.total_area]);
							_yearArr.push(i);

							var paneIndex = 'burnedArea_'+_year;
							map.createPane(paneIndex);
							map.getPane(paneIndex).style.zIndex = 380+i;

							if(map.hasLayer(MapLayerArr[_year].burnedArea)){
								map.removeLayer(MapLayerArr[_year].burnedArea);
							}

							//add map layer
							MapLayerArr[_year].burnedArea = addMapLayer(MapLayerArr[_year].burnedArea, _yearData.eeMapURL, paneIndex);
							//set map style with opacity = 0.5
							MapLayerArr[_year].burnedArea.setOpacity(1);

							/*jshint loopfunc: true */
							createToggleList('toggle-list-burned-area', 'burnedArea_'+_year, _year, _year, '', _yearData.color);

							//toggle each of forest map layer
							$("#burnedArea_"+_year).click(function() {
								var layerID= $(this).attr('data-yid');
								if(this.checked) {
									var toggleColor = $(this).attr('data-color');
									$(this).closest("label").find("span").css("background-color", toggleColor);
									MapLayerArr[layerID].burnedArea.addTo(map);
								} else {
									$(this).closest("label").find("span").css("background-color", '#bbb');
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
						showHightChart('burned_area_chart', 'column', _yearArr, series, true, 10);

						$scope.showLoader = false;

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
				}

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
					if(map.hasLayer(cam_adm1_layer)){
						map.removeLayer(cam_adm1_layer);
					}
					if(map.hasLayer(protected_area_layer)){
						map.removeLayer(protected_area_layer);
					}

				});
				function hideModel() {
					$(".modal").removeClass('show');
					$(".modal").addClass('hide');
				}
				$("#disclaimer-button").click(function() {
					hideModel();
					$("#disclaimer-modal").removeClass('hide');
					$("#disclaimer-modal").addClass('show');
				});

				$("#evi-info").click(function() {
					hideModel();
					$("#evi-info-modal").removeClass('hide');
					$("#evi-info-modal").addClass('show');
				});
				$("#forest-info").click(function() {
					hideModel();
					$("#forest-info-modal").removeClass('hide');
					$("#forest-info-modal").addClass('show');
				});
				$("#forest-alert-info").click(function() {
					hideModel();
					$("#forest-alert-info-modal").removeClass('hide');
					$("#forest-alert-info-modal").addClass('show');
				});
				$("#burned-area-info").click(function() {
					hideModel();
					$("#burned-area-info-modal").removeClass('hide');
					$("#burned-area-info-modal").addClass('show');
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
				$('input[type=checkbox][name=province_toggle]').click(function(){
					if(this.checked) {
						mapLayer_cam_adm1.addTo(map);
					} else {
						if(map.hasLayer(mapLayer_cam_adm1)){
							map.removeLayer(mapLayer_cam_adm1);
						}
					}
				});
				$('input[type=checkbox][name=district_toggle]').click(function(){
					if(this.checked) {
						mapLayer_cam_adm2.addTo(map);
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
						mapLayer_cambodia.addTo(map);
					} else {
						if(map.hasLayer(mapLayer_cambodia)){
							map.removeLayer(mapLayer_cambodia);
						}
					}
				});

				$('.protected_area_button').click(function(){
					protected_area_layer.addTo(map);
					editableLayers.clearLayers();
					if(map.hasLayer(cam_adm2_layer)){
						map.removeLayer(cam_adm2_layer);
					}
					if(map.hasLayer(cam_adm1_layer)){
						map.removeLayer(cam_adm1_layer);
					}
				});


				$('.district_button').click(function(){
					cam_adm2_layer.addTo(map);
					editableLayers.clearLayers();
					if(map.hasLayer(protected_area_layer)){
						map.removeLayer(protected_area_layer);
					}
					if(map.hasLayer(cam_adm1_layer)){
						map.removeLayer(cam_adm1_layer);
					}
				});

				$('.province_button').click(function(){
					cam_adm1_layer.addTo(map);
					editableLayers.clearLayers();
					if(map.hasLayer(protected_area_layer)){
						map.removeLayer(protected_area_layer);
					}
					if(map.hasLayer(cam_adm2_layer)){
						map.removeLayer(cam_adm2_layer);
					}
				});
				$('.province_button').click();


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
						$('.highlight_area_textbox').css("top", "5px");
					}else{
						$("nav").show();
						$(".container-wrapper").css("margin-top", "90px");
						$(".c-map-menu .menu-tiles").css("top", "90px");
						$(".c-menu-panel").css("top", "90px");
						$(".map").css("height", "calc(100vh - 90px)");
						$('.map-controller').css("top", "95px");
						$('.highlight_area_textbox').css("top", "95px");
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

				});

				$("#update-map").click(function() {
					cal();
				});

				$("#clear-map").click(function() {
					editableLayers.clearLayers();
					//clear all map layers
					if(map.hasLayer(protected_area_layer)){
						map.removeLayer(protected_area_layer);
					}
					if(map.hasLayer(cam_adm1_layer)){
						map.removeLayer(cam_adm1_layer);
					}
					if(map.hasLayer(cam_adm2_layer)){
						map.removeLayer(cam_adm2_layer);
					}
					if(map.hasLayer(EVILayer)){
						map.removeLayer(EVILayer);
					}
					if(map.hasLayer(ForestGainLayer)){
						map.removeLayer(ForestGainLayer);
					}
					if(map.hasLayer(ForestLossLayer)){
						map.removeLayer(ForestLossLayer);
					}

					for(var i=studyLow; i<=studyHigh; i++){
						var _year  = i.toString();
						if(map.hasLayer(MapLayerArr[_year].forest)){
							map.removeLayer(MapLayerArr[_year].forest);
						}
						if(map.hasLayer(MapLayerArr[_year].forestAlert)){
							map.removeLayer(MapLayerArr[_year].forestAlert);
						}
						if(map.hasLayer(MapLayerArr[_year].burnedArea)){
							map.removeLayer(MapLayerArr[_year].burnedArea);
						}
					}

					// clear all toggle layer list
					$("#toggle-list-forest").html('');
					$("#toggle-list-evi").html('');
					$("#toggle-list-forest-alert").html('');
					$("#toggle-list-burned-area").html('');
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

				$("#forest_changegainloss_png").click(function() {
					var chart = $('#forest_change_gainloss_chart').highcharts();
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

				$("#forest_changegainloss_csv").click(function() {
					var chart = $('#forest_change_gainloss_chart').highcharts();
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
