(function () {
	'use strict';
	angular.module('baseApp')
	.controller('mapcontroller' ,function ($scope, $timeout, MapService, appSettings) {

		$(".menu-container").css("background-color", "#000");

		/* global variables to be tossed around like hot potatoes */
		$scope.showAlert = false;
		$scope.showLoader = false;
		$scope.REFHIGH = '';
		$scope.REFLOW = '';
		$scope.STUDYHIGH = '';
		$scope.STUDYLOW = '';

		$scope.startYear = appSettings.startYear_controller;
		$scope.endYear = appSettings.endYear_controller;
		$scope.partnersFooter = appSettings.partnersFooter;

		$scope.forestAlertStartYear = appSettings.forestAlertStartYear_controller;

		var showSpiner = function(){
			setTimeout(function () {
        $scope.$apply(function(){
            $scope.showLoader = true;
        });
    	}, 100);
		};
		var hideSpiner = function(){
			setTimeout(function () {
        $scope.$apply(function(){
            $scope.showLoader = false;
        });
    	}, 6000);
		};

		var MAPBOXAPI = appSettings.mapboxapi;

		var map, basemap_layer , drawing_polygon;

		var refHigh, refLow, studyHigh, studyLow;

		var arrayWMSLayers = []
	  var k = 'value';
	  var y = 0;
		var EVILayer,ForestGainLayer, ForestLossLayer, ForestAlertLayer;
		var overlayLayers = [EVILayer,ForestGainLayer, ForestLossLayer, ForestAlertLayer];
		var MapLayerArr = {}
	  for(y = $scope.startYear; y <= $scope.endYear+1; y++) {
	    	eval('$scope.Forest' + y + '=null;');
			eval('$scope.ForestAlert' + y + '=null;');
			eval('$scope.BurnedArea' + y + '=null;');
			eval('$scope.Landcover' + y + '=null;');
			eval('$scope.sarAlert' + y + '=null;');
		  	overlayLayers.push(eval('$scope.Forest' + y));
			overlayLayers.push(eval('$scope.ForestAlert' + y));
			overlayLayers.push(eval('$scope.BurnedArea' + y));
			overlayLayers.push(eval('$scope.Landcover' + y));
			overlayLayers.push(eval('$scope.sarAlert' + y));

			MapLayerArr[y.toString()] = {
				'forest': eval('$scope.Forest' + y),
				'forestAlert': eval('$scope.ForestAlert' + y),
				'burnedArea': eval('$scope.BurnedArea' + y),
				'landcover': eval('$scope.Landcover' + y),
				'sarAlert': eval('$scope.sarAlert' + y),

				}
	  	}
			var selected_admin = 'Cambodia';

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
				min: yearInt($scope.startYear),
				max: yearInt($scope.endYear),
				from: yearInt(2009),
				to: yearInt(2020),
				prettify: yearToInt,
				onChange: function (data) {
					studyHigh = data.to;
					studyLow = data.from;
					$scope.STUDYHIGH = studyHigh;
					$scope.STUDYLOW = studyLow;
					$scope.$apply();
				},
				// onFinish: function (data) {
				// 	checkAvailableData(studyHigh, studyLow);
				// },
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
				min: yearInt($scope.startYear),
				max: yearInt($scope.endYear),
				from: yearInt(2000),
				to: yearInt(2008),
				prettify: yearToInt,
				onChange: function (data) {
					refHigh = data.to;
					refLow = data.from;
					$scope.REFHIGH = refHigh;
					$scope.REFLOW = refLow;
				},
				// onFinish: function (data) {
				// 	checkAvailableData(refHigh, refLow);
				// },
			});

			refHigh = $("#baseline_period").data("ionRangeSlider").result.to;
			refLow = $("#baseline_period").data("ionRangeSlider").result.from;
			$scope.REFHIGH = refHigh;
			$scope.REFLOW = refLow;
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			//init leaflet map
			var mapCenter_lat = 12.75118782414063;
			var mapCenter_long = 104.22877523601562;
			// init map
			map = L.map('map',{
				center: [mapCenter_lat,mapCenter_long],
				zoom: 8,
				minZoom:2,
				maxZoom: 16,
				maxBounds: [
					[-120, -220],
					[120, 220]
				]
			});

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			//create the index of map overlay layers

			map.createPane('EVILayer');
			map.getPane('EVILayer').style.zIndex = 300;

			map.createPane('geeMapLayer');
			map.getPane('geeMapLayer').style.zIndex = 300;

			map.createPane('ForestLossLayer');
			map.getPane('ForestLossLayer').style.zIndex = 401;

			map.createPane('ForestGainLayer');
			map.getPane('ForestGainLayer').style.zIndex = 402;

			map.createPane('ForestAlertLayer');
			map.getPane('ForestAlertLayer').style.zIndex = 403;

			map.createPane('admin');
			map.getPane('admin').style.zIndex =1000;
			//	map.getPane('admin').style.pointerEvents = 'none';
			map.createPane('maplayer_cam');
			map.getPane('maplayer_cam').style.zIndex = 450;
			map.getPane('maplayer_cam').style.pointerEvents = 'none';
			map.createPane('maplayer_protect');
			map.getPane('maplayer_protect').style.zIndex = 451;
			map.getPane('maplayer_protect').style.pointerEvents = 'none';

			map.createPane('maplayer_gis');
			map.getPane('maplayer_gis').style.zIndex = 1001;

			map.createPane('basemap');
			map.getPane('basemap').style.zIndex = 0;
			map.getPane('basemap').style.pointerEvents = 'none';


			basemap_layer = L.tileLayer('https://api.mapbox.com/styles/v1/servirmekong/ckduef35613el19qlsoug6u2h/tiles/256/{z}/{x}/{y}@2x?access_token='+MAPBOXAPI, {
				attribution: '',
				pane:'basemap'
			}).addTo(map);

			var mapWidth = map.getSize().x*0.3;
			var mapHeight = map.getSize().y*0.3;


			// Initialise the FeatureGroup to store editable layers
			var editableLayers = new L.FeatureGroup({pane:'admin'});
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


			function download(url, filename) {
				fetch(url).then(function(t) {
					return t.blob().then((b)=>{
						
						var a = document.createElement("a");
						a.href = URL.createObjectURL(b);
						a.setAttribute("download", filename);
						a.click();
						$scope.showLoader = false;
					}
					);
				});
			}
			function downloadMetadata(url, filename) {
				fetch(url).then(function(t) {
					return t.blob().then((b)=>{
						var a = document.createElement("a");
						a.href = URL.createObjectURL(b);
						a.setAttribute("download", filename);
						a.click();
						$scope.showLoader = false;
					}
					);
				});
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			var mapLayer_airport =L.geoJson(airport, {
				pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
					radius: 5,
					fillColor: "#ff7800",
					color: "#FFF",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8,
					 pane:'maplayer_gis'
				});
		    },
				onEachFeature: function(feature, layer) {
						layer.bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
				}
			});

			var mapLayer_dams =L.geoJson(dams, {
				pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
					radius: 5,
					fillColor: "#294AB9",
					color: "#FFF",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8,
					pane:'maplayer_gis'
					});
    		},
				onEachFeature: function(feature, layer) {
						layer.bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');

				}
			});

			var mapLayer_main_road =L.geoJson(main_road, {
				style: function (feature) {
					return {
						color: "#FF5733",
						//fill: false,
						opacity: 1,
						clickable: true,
						weight: 1,
					};
				},
				pane:'maplayer_gis'
			});

			var mapLayer_cpa =L.geoJson(cpa, {
				style: function (feature) {
					return {
						fillColor: "#67D657",
				    color: "#FFF",
				    weight: 1,
				    opacity: 1,
				    fillOpacity: 0.8
					};
				},
				pane:'maplayer_gis',
				onEachFeature: function(feature, layer) {
						layer.bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');

				}
			});

			var mapLayer_railway =L.geoJson(railway, {
				style: function (feature) {
					return {
						color: "#FF5733",
						//fill: false,
						opacity: 1,
						clickable: true,
						weight: 2,
						dashArray: 3,
					};
				},
				pane:'maplayer_gis'
			});

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
							$(".highlight_area_textbox").text(e.target.feature.properties.DIST_NAME);
						},
						'mouseout': function (e) {
							dehighlight(e.target, cam_adm2_layer);
							$(".highlight_area_textbox").css("display", "none");
						},
						'click': function (e) {
							var selected_name =  e.target.feature.properties.DIST_NAME;
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
				selected_admin = "Your Drawing Area";
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


				function cal(){

					//clear all map layers
					clearMapLayers();
					// clear all toggle layer list
					$("#toggle-list-forest").html('');
					$("#toggle-list-evi").html('');
					$("#toggle-list-forest-alert").html('');
					$("#toggle-list-sar-alert").html('');
					$("#toggle-list-burned-area").html('');
					$("#toggle-list-landcover").html('');

					//show spiner
					$scope.showLoader = true;
					getPieEvi();
					getLineEvi();
					getEviMap();
					getLandcover();
					getForestMapID();
					getForestGainMapID();
					getForestLossMapID();
					getForestGainLossStats();
					getChangeForestGainLossStats();
					getForestAlert();
					getBurnedArea();
					getSarAlert();

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
					selected_admin = selectedArea;

				}

				// function to add and update tile layer to map
				function addMapLayer(layer,url, pane){
					layer = L.tileLayer(url,{
						attribution: '<a href="https://earthengine.google.com" target="_">' +
						'Google Earth Engine</a>;',
						pane: pane});
						return layer;
					}

				////////////////////////////////////////////////////////////////////////////////////////////////////////////

				function showHightChart(chartContainer, chartType, categories, chartSeries, labelArea, pointWidth, subtitle){

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
						exporting:{
							chartOptions:{
								title: {
									text:''
								},
								subtitle: {
									text: subtitle
								}
							},
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
									return this.series.name + " (" + this.point.y + " )";
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
						legend: true,
					});

				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////////
				function createToggleList(parentUL, inputID, label, yid, checked, bgcolor) {
					$("#"+parentUL).append(
						'<li class="toggle">'+
						'<span class="tooltip" name="download_'+inputID+'" id="download_'+inputID+'" data-id="'+inputID+'"  data-yid="'+yid+'" data-name="'+label+'" style="cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#d4dbd4" class="bi bi-file-arrow-down-fill" viewBox="0 0 16 16">' +
						'<path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM8 5a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5A.5.5 0 0 1 8 5z"/>' +
					  	'</svg><span class="tooltiptext">Download </span></span>'+
						'<label class="switch_layer"><input name="'+inputID+'" id="'+inputID+'" data-id="'+inputID+'"  data-yid="'+yid+'" data-name="'+label+'" data-color="#'+bgcolor+'" type="checkbox" '+checked+'><span class="slider_toggle round"></span></input></label><label>'+label+'</label></li>'
					);
				}

				function isInArray(value, array) {
				  return array.indexOf(value) > -1;
				}

				function checkAvailableData(high, low){
					showSpiner();
					showInfoAlert("Checking available dataset");
					var noforestalertyear = "";
					var nolandcoveryear = "";
					var noeviyear = "";
					var notccyear = "";
					var notchyear = "";
					var noburnedyear = "";
					var forestalertA= [];
					var lca= [];
					var evia= [];
					var tcca= [];
					var tcha= [];
					var burneda = [];
					var parameters = {
						polygon_id: polygon_id,
						area_id: area_id,
						area_type: area_type,
						startYear: low,
						endYear: high,
					};
					MapService.checkAvailableData(parameters)
					.then(function (res) {
						//hideSpiner();
						var eviyear = res.evi;
						var landcoveryear = res.landcover;
						var foresttccyear = res.tcc;
						var foresttchyear = res.tch;
						var forestalertyear = res.forestalert;
						var burnedyear = res.burned;

						for(var i=low; i<=high; i++){
							if(!isInArray(i.toString(), forestalertyear)){
								noforestalertyear += i.toString()+" ";
								forestalertA.push(i);
								//document.getElementById("update-map").disabled = true;
							}
							if(!isInArray(i.toString(), landcoveryear)){
								nolandcoveryear += i.toString()+" ";
								lca.push(i);
								//document.getElementById("update-map").disabled = true;
							}
							if(!isInArray(i.toString(), eviyear)){
								noeviyear += i.toString()+" ";
								evia.push(i);
								//document.getElementById("update-map").disabled = true;
							}
							if(!isInArray(i.toString(), foresttccyear)){
								notccyear += i.toString()+" ";
								tcca.push(i);
								//document.getElementById("update-map").disabled = true;
							}
							if(!isInArray(i.toString(), foresttchyear)){
								notchyear += i.toString()+" ";
								tcha.push(i);
								//document.getElementById("update-map").disabled = true;
							}
							if(!isInArray(i.toString(), burnedyear)){
								noburnedyear += i.toString()+" ";
								burneda.push(i);
								//document.getElementById("update-map").disabled = true;
							}
						}

						if(burneda.length === 0 && tcca.length === 0 && tcha.length === 0){
							//document.getElementById("update-map").disabled = false;
							showInfoAlert("Please wait while we are processing your request.");
							cal();
						}else{
							var mgsAlert = "<b>Please select period agian</b> <br>No Fire Burned Area data: " + noburnedyear + "  <br> " + "No Tree Conopy data: " + notccyear + "  <br> " + "No Tree Height  data: " + notchyear + "  <br> " + "No Forest GLAD Alert data: " + noforestalertyear ;
							showErrorAlert(mgsAlert);
							hideSpiner();
						}


					}, function (error) {
						console.log(error);
					});
				}

				////////////////////////////////////////////////////////////////////////////////////////////////////////////
				var total_area_evi = 0;
				var graphDataEVI;
				function getPieEvi(){
					graphDataEVI = [];
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
						total_area_evi = 0;
						for (var i=0; i< className.length; i++) {
							graphDataEVI.push({ name: className[i], y: data[i], color: classColor[i]});
							total_area_evi = total_area_evi + data[i];
						}
						//var totalEVIArea = graphDataEVI[0]["y"].toString() +   graphDataEVI[1]["y"].toString() + graphDataEVI[2]["y"].toString() + graphDataEVI[3]["y"].toString()+graphDataEVI[4]["y"].toString()

						//Showing the pie chart
						Highcharts.chart('chart', {
							chart: {
								type: 'pie',
								// Explicitly tell the width and height of a chart
								width: 315,
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

							exporting:{
								chartOptions:{
									title: {
										text:''
									},
									subtitle: {
										text: 'PROPORTION OF BIOPHYSICAL HEALTH IN '+ selected_admin.toUpperCase()
									}
								},
								enabled: false
							},

							series: [{
								name: 'Area (ha)',
								data: graphDataEVI,
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
						//map.addLayer(EVILayer);
						createToggleList('toggle-list-evi', 'EVILayer', 'Enhanced vegetation index', '', '', '36461F');

						$("#download_EVILayer").click(function() {
							//show spiner
							$scope.showLoader = true;
							//set ajax parameters
							MapService.download_evi_map(parameters).then(function (res){
								var dnlurl = res.downloadURL;
								if(res.success === 'success'){
									download(dnlurl, "EVIMAP"+ studyLow + "_" + studyHigh);
									showSuccessAlert("Download URL: "+dnlurl);
									$scope.showLoader = false;
								}else{
									showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
									$scope.showLoader = false;
								}

							}, function (error) {
								$scope.showLoader = false;
								console.log(error);
							})
						});

						$("#EVILayer").change(function() {
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
						if($("#biophysical-tab").hasClass("active")) {
							$("#EVILayer").prop( "checked", true ).trigger( "change" );
						}
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
								width: 315,
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
							exporting:{
								chartOptions:{
									title: {
										text:''
									},
									subtitle: {
										text: 'CUMULATIVE ANOMALY EVI IN '+ selected_admin.toUpperCase()
									}
								},
								enabled: false
							},
							series: serieses,
							credits: {
								enabled: false
							},

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
								exporting:{
									chartOptions:{
										title: {
											text:''
										},
										subtitle: {
											text: 'THE CHANGE OF FOREST GAIN AND LOSS IN '+ selected_admin.toUpperCase()
										}
									},
									enabled: false
								},
								credits: {
									enabled: false
								},

							});
						});
					}

					var gainArea = 0;
					var lossArea = 0;

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
							gainArea = gain;
							lossArea = loss;
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

					var forestAreaEndYear = 0;
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
							download: false
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

								if(map.hasLayer(MapLayerArr[year_string].forest)){
									map.removeLayer(MapLayerArr[year_string].forest);
								}
								//add map layer
								MapLayerArr[year_string].forest = addMapLayer(MapLayerArr[year_string].forest, data[year_string].eeMapURL, 'geeMapLayer');
								//set map style with opacity = 0.5
								MapLayerArr[year_string].forest.setOpacity(1);

								/*jshint loopfunc: true */
								createToggleList('toggle-list-forest', 'forest_'+year_string, year_string, year_string, '', data[year_string].color);

								$("#download_forest_"+ year_string).click(function() {
									//show spiner
									$scope.showLoader = true;
									var layerID= $(this).attr('data-yid');
									//set ajax parameters
									var download_parameters = {
										polygon_id: polygon_id,
										treeCanopyDefinition: 10,
										treeHeightDefinition: 5,
										startYear: studyLow,
										endYear: studyHigh,
										type: 'forestExtend',
										area_id: area_id,
										area_type: area_type,
										year: layerID,
										download: true
									};
									MapService.getForestMapID(download_parameters).then(function (res){
										var dnlurl = res.downloadURL;

										if(res.success === 'success'){
											download(dnlurl, "forest_"+ layerID);
											showSuccessAlert("Download URL: "+dnlurl);
											$scope.showLoader = false;
										}else{
											showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
											$scope.showLoader = false;
										}
									}, function (error) {
										$scope.showLoader = false;
										console.log(error);
									})
								});

								//toggle each of forest map layer
								$("#forest_"+year_string).change(function() {
									var layerID= $(this).attr('data-yid');
									var toggleColor = $(this).attr('data-color');
									var toggleName = $(this).attr('data-name');
									var toggleId = $(this).attr('data-id');
									if(this.checked) {
										$(this).closest("label").find("span").css("background-color", toggleColor);
										$("#ul-forest-legend").append(
											'<li id="'+toggleId+'"> <p><span style="width: 500px; height: 100px; background:'+toggleColor+'; border: 1px solid '+toggleColor+'; color:'+toggleColor+'; "> XX</span> '+toggleName+'</p> </li>'
										);
										MapLayerArr[layerID].forest.addTo(map);
									} else {
										$(this).closest("label").find("span").css("background-color", '#bbb');
										if(map.hasLayer(MapLayerArr[layerID].forest)){
											map.removeLayer(MapLayerArr[layerID].forest);
										}
										$('li[id="' + toggleId + '"').remove();
									}
								});

							}
							forestAreaEndYear = data[studyHigh].forest;

							var series = [{
								name: 'Area in Hectare',
								data: forestArea,
								color: '#138D75'
							}];

							showHightChart('forest_cover_chart', 'column', yearArr, series, true, 10, 'AREA OF FOREST COVER IN '+ selected_admin.toUpperCase());


							var seriesNoneForest = [{
								name: 'Forest',
								data: forestArea,
								color: '#138D75'
							},
							{
								name: 'Non-Forest',
								data: noneforestArea,
								color: '#919F94'
							}];
							showHightChart('forest_noneforest_chart', 'bar', yearArr, seriesNoneForest, true, 10, 'AREA OF FOREST AND NON-FOREST IN '+ selected_admin.toUpperCase());

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
							download: 'False'
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

							$("#download_ForestGainLayer").click(function() {
								//show spiner
								$scope.showLoader = true;
								//set ajax parameters
								var download_parameters = {
									polygon_id: polygon_id,
									treeCanopyDefinition: 10,
									treeHeightDefinition: 5,
									startYear: studyLow,
									endYear: studyHigh,
									area_id: area_id,
									area_type: area_type,
									download: 'True'
								};
								MapService.getForestGainMapid(download_parameters).then(function (res){
									var dnlurl = res.downloadURL;

									if(res.success === 'success'){
										download(dnlurl, "ForestGainLayer"+ studyLow + "_" + studyHigh);
										showSuccessAlert("Download URL: "+dnlurl);
										$scope.showLoader = false;
									}else{
										showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
										$scope.showLoader = false;
									}
								}, function (error) {
									$scope.showLoader = false;
									console.log(error);
								})
							});

							$("#ForestGainLayer").change(function() {
								var layerID= $(this).attr('data-yid');
								var toggleColor = $(this).attr('data-color');
								var toggleName = $(this).attr('data-name');
								var toggleId = $(this).attr('data-id');
								if(this.checked) {
									$(this).closest("label").find("span").css("background-color", toggleColor);
									$("#ul-forest-legend").append(
										'<li id="'+toggleId+'"> <p><span style="width: 500px; height: 100px; background:'+toggleColor+'; border: 1px solid '+toggleColor+'; color:'+toggleColor+'; "> XX</span> '+toggleName+'</p> </li>'
									);
									ForestGainLayer.addTo(map);
								} else {
									$(this).closest("label").find("span").css("background-color", '#bbb');
									if(map.hasLayer(ForestGainLayer)){
										map.removeLayer(ForestGainLayer);
									}
									$('li[id="' + toggleId + '"').remove();
								}
							});

							if($("#forest-monitoring-tab").hasClass("active")) {
								$("#ForestGainLayer").prop( "checked", true ).trigger( "change" );
							}


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
							download: 'False'
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

							$("#download_ForestLossLayer").click(function() {
								//show spiner
								$scope.showLoader = true;
								//set ajax parameters
								var download_parameters = {
									polygon_id: polygon_id,
									treeCanopyDefinition: 10,
									treeHeightDefinition: 5,
									startYear: studyLow,
									endYear: studyHigh,
									area_id: area_id,
									area_type: area_type,
									download: 'True'
								};
								MapService.getForestLossMapid(download_parameters).then(function (res){
									var dnlurl = res.downloadURL
									
									if(res.success === 'success'){
										download(dnlurl, "ForestLossLayer"+ studyLow + "_" + studyHigh);
										showSuccessAlert("Download URL: "+dnlurl);
										$scope.showLoader = false;
									}else{
										showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
										$scope.showLoader = false;
									}
								}, function (error) {
									$scope.showLoader = false;
									console.log(error);
								})
							});

							$("#ForestLossLayer").change(function() {
								var layerID= $(this).attr('data-yid');
								var toggleColor = $(this).attr('data-color');
								var toggleName = $(this).attr('data-name');
								var toggleId = $(this).attr('data-id');
								if(this.checked) {
									$(this).closest("label").find("span").css("background-color", toggleColor);
									ForestLossLayer.addTo(map);
									$("#ul-forest-legend").append(
										'<li id="'+toggleId+'"> <p><span style="width: 500px; height: 100px; background:'+toggleColor+'; border: 1px solid '+toggleColor+'; color:'+toggleColor+'; "> XX</span> '+toggleName+'</p> </li>'
									);


								} else {
									$(this).closest("label").find("span").css("background-color", '#bbb');
									if(map.hasLayer(ForestLossLayer)){
										map.removeLayer(ForestLossLayer);
									}
									$('li[id="' + toggleId + '"').remove();
								}
							});

							if($("#forest-monitoring-tab").hasClass("active")) {
								$("#ForestLossLayer").prop( "checked", true ).trigger( "change" );
							}

						}, function (error) {
							console.log(error);
						});
					}
					var total_forest_alert_area = 0;
					function getForestAlert(){
						var parameters = {
							polygon_id: polygon_id,
							area_id: area_id,
							area_type: area_type,
							get_image: false,
							startYear: $scope.forestAlertStartYear,
							endYear: studyHigh,
							download: false
						};

						MapService.getForestAlert(parameters)
						.then(function (data) {
							total_forest_alert_area = 0;
							var area_data = [];
							var number_data = [];

							var _yearArr = [];

							for(var i=$scope.forestAlertStartYear; i<=studyHigh; i++){

								var _yearData = data[i.toString()];
								var _year = i.toString();

								area_data.push([i, _yearData.total_area]);
								number_data.push([i, _yearData.total_number]);
								_yearArr.push(i);

								total_forest_alert_area += _yearData.total_area;

								if(map.hasLayer(MapLayerArr[_year].forestAlert)){
									map.removeLayer(MapLayerArr[_year].forestAlert);
								}

								//add map layer
								MapLayerArr[_year].forestAlert = addMapLayer(MapLayerArr[_year].forestAlert, _yearData.eeMapURL, 'geeMapLayer');
								//set map style with opacity = 0.5
								MapLayerArr[_year].forestAlert.setOpacity(1);

								/*jshint loopfunc: true */
		
								createToggleList('toggle-list-forest-alert', 'forestAlert_'+_year, _year, _year, '',_yearData.color);
								
								$("#download_forestAlert_"+ _year).click(function() {
									//show spiner
									$scope.showLoader = true;
									var layerID= $(this).attr('data-yid');
									//set ajax parameters
									var download_parameters = {
										polygon_id: polygon_id,
										year: layerID,
										area_type: area_type,
										area_id: area_id,
										download: true
									};
									MapService.getForestAlert(download_parameters).then(function (res){
										var dnlurl = res.downloadURL;
										if(res.success === 'success'){
											download(dnlurl, "forestAlert_"+ layerID);
											showSuccessAlert("Download URL: "+dnlurl);
											$scope.showLoader = false;
										}else{
											showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
											$scope.showLoader = false;
										}
									}, function (error) {
										$scope.showLoader = false;
										console.log(error);
									})
								});

								//toggle each of forest map layer
								$("#forestAlert_"+_year).change(function() {
									var layerID= $(this).attr('data-yid');
									var toggleColor = $(this).attr('data-color');
									var toggleName = $(this).attr('data-name');
									var toggleId = $(this).attr('data-id');
									if(this.checked) {
										$(this).closest("label").find("span").css("background-color", toggleColor);
										$("#ul-forest-alert-legend").append(
											'<li id="'+toggleId+'"> <p><span style="width: 500px; height: 100px; background:'+toggleColor+'; border: 1px solid '+toggleColor+'; color:'+toggleColor+'; "> XX</span>GLAD '+toggleName+'</p> </li>'
										);
										MapLayerArr[layerID].forestAlert.addTo(map);
									} else {
										$(this).closest("label").find("span").css("background-color", '#bbb');
										if(map.hasLayer(MapLayerArr[layerID].forestAlert)){
											map.removeLayer(MapLayerArr[layerID].forestAlert);
										}
										$('li[id="' + toggleId + '"').remove();
									}
								});

							}
							if($("#forest-alert-tab").hasClass("active")) {
								$("#forestAlert_"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
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
							showHightChart('forest_alert_area', 'column', _yearArr, seriesArea, true, 30, 'TOTAL AREA OF FOREST ALERT IN'+ selected_admin.toUpperCase());


						}, function (error) {
							console.log(error);
						});
					}


					var total_sar_alert_area = 0;
					function getSarAlert(){
						var parameters = {
							polygon_id: polygon_id,
							area_id: area_id,
							area_type: area_type,
							get_image: false,
							startYear: $scope.forestAlertStartYear,
							endYear: studyHigh,
							download: false
						};

						MapService.getSarAlert(parameters)
						.then(function (data) {
							total_sar_alert_area = 0
							$scope.showLoader = false;
							var area_data = [];
							var number_data = [];

							var _yearArr = [];

							for(var i=$scope.forestAlertStartYear; i<=studyHigh; i++){

								var _yearData = data[i.toString()];
								var _year = i.toString();

								area_data.push([i, _yearData.total_area]);
								number_data.push([i, _yearData.total_number]);
								_yearArr.push(i);

								total_sar_alert_area += _yearData.total_area;

								if(map.hasLayer(MapLayerArr[_year].sarAlert)){
									map.removeLayer(MapLayerArr[_year].sarAlert);
								}

								//add map layer
								MapLayerArr[_year].sarAlert = addMapLayer(MapLayerArr[_year].sarAlert, _yearData.eeMapURL, 'geeMapLayer');
								//set map style with opacity = 0.5
								MapLayerArr[_year].sarAlert.setOpacity(1);

								/*jshint loopfunc: true */
		
								createToggleList('toggle-list-sar-alert', 'sarAlert_'+_year, _year, _year, '',_yearData.color);
								
								$("#download_sarAlert_"+ _year).click(function() {
									//show spiner
									$scope.showLoader = true;
									var layerID= $(this).attr('data-yid');
									//set ajax parameters
									var download_parameters = {
										polygon_id: polygon_id,
										year: layerID,
										area_type: area_type,
										area_id: area_id,
										download: true
									};
									MapService.getSarAlert(download_parameters).then(function (res){
										var dnlurl = res.downloadURL;
										if(res.success === 'success'){
											download(dnlurl, "sarAlert_"+ layerID);
											showSuccessAlert("Download URL: "+dnlurl);
											$scope.showLoader = false;
										}else{
											showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
											$scope.showLoader = false;
										}
									}, function (error) {
										$scope.showLoader = false;
										console.log(error);
									})
								});

								//toggle each of sar forest map layer
								$("#sarAlert_"+_year).change(function() {
									var layerID= $(this).attr('data-yid');
									var toggleColor = $(this).attr('data-color');
									var toggleName = $(this).attr('data-name');
									var toggleId = $(this).attr('data-id');
									if(this.checked) {
										$(this).closest("label").find("span").css("background-color", toggleColor);
										$("#ul-forest-alert-legend").append(
											'<li id="'+toggleId+'"> <p><span style="width: 500px; height: 100px; background:'+toggleColor+'; border: 1px solid '+toggleColor+'; color:'+toggleColor+'; "> XX</span> SAR '+toggleName+'</p> </li>'
										);
										MapLayerArr[layerID].sarAlert.addTo(map);
									} else {
										$(this).closest("label").find("span").css("background-color", '#bbb');
										if(map.hasLayer(MapLayerArr[layerID].sarAlert)){
											map.removeLayer(MapLayerArr[layerID].sarAlert);
										}
										$('li[id="' + toggleId + '"').remove();
									}
								});

							}
							if($("#sar-alert-tab").hasClass("active")) {
								$("#sarAlert_"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
							}

							var seriesArea = [{
								name: 'Area in Hectare',
								data: area_data,
								color: '#d95252'
							}];
							showHightChart('sar_alert_area', 'column', _yearArr, seriesArea, true, 30, 'TOTAL AREA OF FOREST ALERT IN'+ selected_admin.toUpperCase());


						}, function (error) {
							console.log(error);
						});
					}



					var total_burned_area = 0;
					function getBurnedArea(){
						var parameters = {
							polygon_id: polygon_id,
							startYear: studyLow,
							endYear: studyHigh,
							area_type: area_type,
							area_id: area_id,
							download: false
						};

						MapService.getBurnedArea(parameters)
						.then(function (data) {
							var area_data = [];
							var _yearArr = [];
							total_burned_area= 0;
							for(var i=studyLow; i<=studyHigh; i++){

								var _yearData = data[i.toString()];
								var _year = i.toString();

								area_data.push([i, _yearData.number_fire]);
								_yearArr.push(i);
								total_burned_area = total_burned_area + _yearData.number_fire;

								if(map.hasLayer(MapLayerArr[_year].burnedArea)){
									map.removeLayer(MapLayerArr[_year].burnedArea);
								}

								//add map layer
								MapLayerArr[_year].burnedArea = addMapLayer(MapLayerArr[_year].burnedArea, _yearData.eeMapURL, 'geeMapLayer');
								//set map style with opacity = 0.5
								MapLayerArr[_year].burnedArea.setOpacity(1);

								/*jshint loopfunc: true */
								createToggleList('toggle-list-burned-area', 'burnedArea_'+_year, _year, _year, '', _yearData.color);

								$("#download_burnedArea_"+ _year).click(function() {
									//show spiner
									$scope.showLoader = true;
									var layerID= $(this).attr('data-yid');
									//set ajax parameters
									var download_parameters = {
										polygon_id: polygon_id,
										year: layerID,
										area_type: area_type,
										area_id: area_id,
										download: true
									};
									MapService.downloadBurnedArea(download_parameters).then(function (res){
										var dnlurl = res.downloadURL;
										if(res.success === 'success'){
											download(dnlurl, "FirmBurnedArea_"+ layerID);
											showSuccessAlert("Download URL: "+dnlurl);
											$scope.showLoader = false;
										}else{
											showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
											$scope.showLoader = false;
										}
									}, function (error) {
										$scope.showLoader = false;
										console.log(error);
									})
								});


								//toggle each of forest map layer
								$("#burnedArea_"+_year).change(function() {
									var layerID= $(this).attr('data-yid');
									var toggleColor = $(this).attr('data-color');
									var toggleName = $(this).attr('data-name');
									var toggleId = $(this).attr('data-id');
									if(this.checked) {

										$(this).closest("label").find("span").css("background-color", toggleColor);
										$("#ul-fire-legend").append(
											'<li id="'+toggleId+'"> <p><span style="width: 500px; height: 100px; background:'+toggleColor+'; border: 1px solid '+toggleColor+'; color:'+toggleColor+'; "> XX</span> '+toggleName+'</p> </li>'
										);
										MapLayerArr[layerID].burnedArea.addTo(map);
									} else {
										$(this).closest("label").find("span").css("background-color", '#bbb');
										if(map.hasLayer(MapLayerArr[layerID].burnedArea)){
											map.removeLayer(MapLayerArr[layerID].burnedArea);
										}
										$('li[id="' + toggleId + '"').remove();

									}
								});
							}
							if($("#fire-tab").hasClass("active")) {
								$("#burnedArea_"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
							}

							var series = [{
								name: 'Number of Fire hotspot',
								data: area_data,
								color: '#d95252'
							}];
							showHightChart('burned_area_chart', 'column', _yearArr, series, false, 10, 'NUMBER OF FIRE HOTSPOT '+ selected_admin.toUpperCase());

							//$scope.showLoader = false;

						}, function (error) {
							console.log(error);
						});
					}


					function getLandcover(){
						var parameters = {
							polygon_id: polygon_id,
							startYear: studyLow,
							endYear: studyHigh,
							area_type: area_type,
							area_id: area_id,
							year: '',
							download: false
						};
						var area_data = [];
						var _yearArr =[];
						var lcclass = [
				          {name:'evergreen' ,data: [], color: '#267300'},
				          {name:'semi-evergreen' ,data: [], color: '#38A800'},
				          {name:'deciduous' ,data: [], color: '#70A800'},
				          {name:'mangrove' ,data: [], color: '#00A884'},
				          {name:'flooded forest' ,data: [], color: '#B4D79E'},
				          {name:'rubber' ,data: [], color: '#AAFF00'},
				          {name:'other plantations' ,data: [], color: '#F5F57A'},
				          {name:'rice' ,data: [], color: '#FFFFBE'},
				          {name:'cropland' ,data: [], color: '#FFD37F'},
				          {name:'surface water' ,data: [], color: '#004DA8'},
				          {name:'grassland' ,data: [], color: '#D7C29E'},
				          {name:'woodshrub' ,data: [], color: '#89CD66'},
				          {name:'built-up area' ,data: [], color: '#E600A9'},
				          {name:'village' ,data: [], color: '#A900E6'},
				          {name:'other' ,data: [], color: '#6f6f6f'}
				        ];
						MapService.getLandcover(parameters)
						.then(function (data) {
							for(var i=studyLow; i<=studyHigh; i++){

								var _yearData = data[i.toString()];
								var _year = i.toString();

								_yearArr.push(i);
								//total_burned_area = total_burned_area + _yearData.total_area;
									for(var key in _yearData.total_area) {
										for(var j=0; j<lcclass.length; j++){
										if(lcclass[j].name === key){
											lcclass[j].data.push(_yearData.total_area[key])
										}
									}
								}
								if(map.hasLayer(MapLayerArr[_year].landcover)){
									map.removeLayer(MapLayerArr[_year].landcover);
								}

								//add map layer
								MapLayerArr[_year].landcover = addMapLayer(MapLayerArr[_year].landcover, _yearData.eeMapURL, 'geeMapLayer');
								//set map style with opacity = 0.5
								MapLayerArr[_year].landcover.setOpacity(1);

								/*jshint loopfunc: true */
								createToggleList('toggle-list-landcover', 'landcover'+_year, _year, _year, '', _yearData.color);
								
								$("#download_landcover"+ _year).click(function() {
									//show spiner
									$scope.showLoader = true;
									var layerID= $(this).attr('data-yid');
									//set ajax parameters
									var download_parameters = {
										polygon_id: polygon_id,
										year: layerID,
										area_type: area_type,
										area_id: area_id,
										download: true
									};
									MapService.getLandcover(download_parameters).then(function (res){
										var dnlurl = res.downloadURL;
										if(res.success === 'success'){
											download(dnlurl, "LANDCOVER_"+ layerID);
											showSuccessAlert("Download URL: "+dnlurl);
											downloadMetadata('/static/data/landcover-metadata.csv', 'landcover-metadata.csv')
											$scope.showLoader = false;
										}else{
											showErrorAlert("The cover area is quite large!, please define area of interest again you can define the area by administrative boundaries, protected area or customized your own shape.")
											$scope.showLoader = false;
										}
										
									}, function (error) {
										$scope.showLoader = false;
									})
								});

								//toggle each of forest map layer
								$("#landcover"+_year).change(function() {
									var layerID= $(this).attr('data-yid');
									if(this.checked) {
										var toggleColor = $(this).attr('data-color');
										$(this).closest("label").find("span").css("background-color", toggleColor);
										MapLayerArr[layerID].landcover.addTo(map);
										console.log("show land cover")
									} else {
										$(this).closest("label").find("span").css("background-color", '#bbb');
										if(map.hasLayer(MapLayerArr[layerID].landcover)){
											map.removeLayer(MapLayerArr[layerID].landcover);
										}
									}
								});
							}

							var series = lcclass;
							showHightChart('landcover_chart', 'column', _yearArr, series, true, 10, 'LAND COVER IN '+ selected_admin.toUpperCase());
							if($("#biophysical-tab").hasClass("active")) {
								$("#landcover"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
							}
							

							$scope.showLoader = false;

						}, function (error) {
							console.log(error);
						});
					}

					/**
					* Alert
					*/
					$scope.closeAlert = function () {
						$(".alert").html('');
						$('.custom-alert').addClass('display-none');
						$scope.alertContent = '';
						$(".alert").html('');
					};

					var showErrorAlert = function (alertContent) {
						$scope.alertContent = '';
						$(".alert").html(alertContent);
						$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-success').addClass('alert-danger');
						$timeout(function () {
							$scope.closeAlert();
						}, 6000);
					};

					var showSuccessAlert = function (alertContent) {
						$scope.alertContent = '';
						$(".alert").html(alertContent);
						$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-danger').addClass('alert-success');
						$timeout(function () {
							$scope.closeAlert();
						}, 10000);
					};

					var showInfoAlert = function (alertContent) {
						$(".alert").html(alertContent);
						$scope.alertContent = '';
						$('.custom-alert').removeClass('display-none').removeClass('alert-success').removeClass('alert-danger').addClass('alert-info');
						$timeout(function () {
							$scope.closeAlert();
						}, 10000);

					};


					// A $( document ).ready() block.
					$( document ).ready(function() {
						cal();
						$("#biophysical-tab").click();
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

					function clearMapLayers() {
						$("#ul-forest-legend").html('');
						$("#ul-forest-alert-legend").html('');
						$("#ul-fire-legend").html('');
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

						for(var i=$scope.startYear; i<=$scope.endYear+1; i++){
							var _year  = i.toString();
							if(map.hasLayer(MapLayerArr[_year].forest)){
								map.removeLayer(MapLayerArr[_year].forest);
							}
							if(map.hasLayer(MapLayerArr[_year].forestAlert)){
								map.removeLayer(MapLayerArr[_year].forestAlert);
							}
							if(map.hasLayer(MapLayerArr[_year].sarAlert)){
								map.removeLayer(MapLayerArr[_year].sarAlert);
							}
							if(map.hasLayer(MapLayerArr[_year].burnedArea)){
								map.removeLayer(MapLayerArr[_year].burnedArea);
							}
							if(map.hasLayer(MapLayerArr[_year].landcover)){
								map.removeLayer(MapLayerArr[_year].landcover);
							}
						}

					}

					$("#guiding-button").click(function() {
						hideModel();
						$("#guiding-modal").removeClass('hide');
						$("#guiding-modal").addClass('show');
					});

					$("#watch-video-button").click(function() {
						hideModel();
						$("#demo-clip-modal").removeClass('hide');
						$("#demo-clip-modal").addClass('show');
					});

					$("#evi-info").click(function() {
						hideModel();
						$("#evi-info-modal").removeClass('hide');
						$("#evi-info-modal").addClass('show');
					});
					$("#landcover-info").click(function() {
						hideModel();
						$("#landcover-info-modal").removeClass('hide');
						$("#landcover-info-modal").addClass('show');
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
					$("#gis-info").click(function() {
						hideModel();
						$("#gis-info-modal").removeClass('hide');
						$("#gis-info-modal").addClass('show');
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
						$("#input-file2").click();
					});

					$(".close").click(function() {
						$(".modal-background").click();
						var x = document.getElementById("demo-clip");
            			x.pause();  
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

					//////////////////////////////////////////////////
					$('input[type=checkbox][name=dams_toggle]').click(function(){
						if(this.checked) {
							mapLayer_dams.addTo(map);
						} else {
							if(map.hasLayer(mapLayer_dams)){
								map.removeLayer(mapLayer_dams);
							}
						}
					});

					$('input[type=checkbox][name=airport_toggle]').click(function(){
						if(this.checked) {
							mapLayer_airport.addTo(map);
						} else {
							if(map.hasLayer(mapLayer_airport)){
								map.removeLayer(mapLayer_airport);
							}
						}
					});

					$('input[type=checkbox][name=main_road_toggle]').click(function(){
						if(this.checked) {
							mapLayer_main_road.addTo(map);
						} else {
							if(map.hasLayer(mapLayer_main_road)){
								map.removeLayer(mapLayer_main_road);
							}
						}
					});

					$('input[type=checkbox][name=cpa_toggle]').click(function(){
						if(this.checked) {
							mapLayer_cpa.addTo(map);
						} else {
							if(map.hasLayer(mapLayer_cpa)){
								map.removeLayer(mapLayer_cpa);
							}
						}
					});

					$('input[type=checkbox][name=railway_toggle]').click(function(){
						if(this.checked) {
							mapLayer_railway.addTo(map);
						} else {
							if(map.hasLayer(mapLayer_railway)){
								map.removeLayer(mapLayer_railway);
							}
						}
					});


					//////////////////////////////////////////////////
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
						//$(".legend").css("display", "none");

					});

					$("#biophysical-tab").click(function () {
						clearMapLayers();
						$("#EVILayer").prop( "checked", true ).trigger( "change" );
						$("#landcover"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
						$("#evi-legend").css("display", "block");
						$("#forest-legend").css("display", "none");
						$("#forest-alert-legend").css("display", "none");
						$("#fire-legend").css("display", "none");
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
						clearMapLayers();
						$("#ForestLossLayer").prop( "checked", true ).trigger( "change" );
						$("#ForestGainLayer").prop( "checked", true ).trigger( "change" );
						$("#evi-legend").css("display", "none");
						$("#forest-legend").css("display", "block");
						$("#forest-alert-legend").css("display", "none");
						$("#fire-legend").css("display", "none");
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
						clearMapLayers();
						$("#forestAlert_"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
						$("#evi-legend").css("display", "none");
						$("#forest-legend").css("display", "none");
						$("#forest-alert-legend").css("display", "block");
						$("#fire-legend").css("display", "none");
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
						clearMapLayers();
						$("#burnedArea_"+studyHigh.toString()).prop( "checked", true ).trigger( "change" );
						$("#evi-legend").css("display", "none");
						$("#forest-legend").css("display", "none");
						$("#forest-alert-legend").css("display", "none");
						$("#fire-legend").css("display", "block");
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
						//cal();
						var min = 0
						var max = 0
						if(studyHigh >= refHigh){
							max = studyHigh;
						}else{
							max = refHigh;
						}

						if(studyLow <= refLow){
							min = studyLow;
						}else{
							min = refLow;
						}
						checkAvailableData(max, min);
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

						clearMapLayers();

						// clear all toggle layer list
						$("#toggle-list-forest").html('');
						$("#toggle-list-landcover").html('');
						$("#toggle-list-evi").html('');
						$("#toggle-list-forest-alert").html('');
						$("#toggle-list-sar-alert").html('');
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

					$("#sar_alert_area_png").click(function() {
						var chart = $('#sar_alert_area').highcharts();
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

					$("#landcover_bar_png").click(function() {
						var chart = $('#landcover_chart').highcharts();
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
					$("#sar_alert_area_csv").click(function() {
						var chart = $('#sar_alert_area').highcharts();
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

					$("#landcover_bar_csv").click(function() {
						var chart = $('#landcover_chart').highcharts();
						chart.downloadCSV();
					});

					$("#export_evi_report").click(function() {
						showSpiner();
						hideSpiner();
						var pdf = new jsPDF("p", "pt", "a4");
						var width = pdf.internal.pageSize.getWidth();
						var height = pdf.internal.pageSize.getHeight();

						pdf.setFont("helvetica");
						pdf.setFontType("normal");
						pdf.setFontSize(10);

						var eviPieChart = document.getElementById('chart');
						domtoimage.toPng(eviPieChart)
						.then(function (dataUrl) {
							var img = new Image();
							img.src = dataUrl;
							var evi_main_title = pdf.splitTextToSize("BIOPHYSICAL HEALTH" , 200);
							var chart_title = pdf.splitTextToSize('Proportion of biophysical health in'+ selected_admin + " from "+ studyLow+ " to " + studyHigh , 500);
							//left top
							pdf.text(50,70, evi_main_title)

							pdf.text(50,90, pdf.splitTextToSize("Name of Area Admin boundary/ protected area: "+ selected_admin , 500))
							pdf.text(50,110, pdf.splitTextToSize("Total area: "+total_area_evi.toFixed(2) + " (ha)", 500))
							pdf.text(50,130, pdf.splitTextToSize("Area of biophysical change:" , 500))
							pdf.text(70,150, pdf.splitTextToSize("-	Large improvement   "+graphDataEVI[0]["y"]+" (ha)" , 500))
							pdf.text(70,170, pdf.splitTextToSize("-	Improvement         "+graphDataEVI[1]["y"]+" (ha)" , 500))
							pdf.text(70,190, pdf.splitTextToSize("-	No change           "+graphDataEVI[2]["y"]+" (ha)" , 500))
							pdf.text(70,210, pdf.splitTextToSize("-	Under stress        "+graphDataEVI[3]["y"]+" (ha)" , 500))
							pdf.text(70,230, pdf.splitTextToSize("-	Severe stress       "+graphDataEVI[4]["y"]+" (ha)" , 500))

							pdf.text(50, 250, chart_title);
							pdf.addImage(img, 'JPEG', 50, 260, undefined, undefined);
							var bio_chart = document.getElementById('chart_div');
							domtoimage.toPng(bio_chart)
							.then(function (dataUrl) {
								var imgChart = new Image();
								imgChart.src = dataUrl;
								//pdf.addPage();

								var lines = pdf.splitTextToSize('Cumulative anomaly EVI in '+ selected_admin+ " from "+ studyLow+ " to " + studyHigh , 500);
								pdf.text(50, 530, lines);
								// addImage(imageData, format, x, y, width, height, alias, compression, rotation)
								pdf.addImage(imgChart, 'JPEG', 50, 550, undefined, undefined);
								pdf.addPage();

								var landcover_chartDiv = document.getElementById('landcover_chart');

								domtoimage.toPng(landcover_chartDiv)
								.then(function (dataUrl) {
									var img = new Image();
									img.src = dataUrl;
									pdf.text(50,70, pdf.splitTextToSize('Land Cover in '+ selected_admin+ " from "+ studyLow+ " to " + studyHigh , 500))
									pdf.addImage(img, 'JPEG', 50, 90, undefined, undefined);

									var mapDiv = document.getElementById('map');
									domtoimage.toPng(mapDiv).then(function (dataUrl) {
										var img = new Image();
										img.src = dataUrl;
										pdf.text(50,330, pdf.splitTextToSize("Map of biophysical health in the period from "+studyLow+" to "+studyHigh , 500))
										pdf.addImage(img, 'JPEG', 50, 350 ,mapWidth, mapHeight);
										var newDate = new Date();
										var pdffilename = "M&E-REPORT: " + newDate.toLocaleDateString() + " @ " + newDate.toLocaleTimeString()+ ".pdf";
										pdf.save(pdffilename);

									})
									.catch(function (error) {
										console.error('oops, something went wrong!', error);
										showErrorAlert('oops, something went wrong! Please try agian');
									});

								})
								.catch(function (error) {
									console.error('oops, something went wrong!', error);
								});

							})
							.catch(function (error) {
								console.error('oops, something went wrong!', error);
							});

						})

						.catch(function (error) {
							console.error('oops, something went wrong!', error);
						});

					});


					$("#export_forest_report").click(function() {
						showSpiner();
						hideSpiner();
						var pdf = new jsPDF("p", "pt", "a4");
						var width = pdf.internal.pageSize.getWidth();
						var height = pdf.internal.pageSize.getHeight();

						pdf.setFont("helvetica");
						pdf.setFontType("normal");
						pdf.setFontSize(10);

						var currentMap = document.getElementById('forest_change_gainloss_chart');
							domtoimage.toPng(currentMap)
							.then(function (dataUrl) {
								var img = new Image();
								img.src = dataUrl;
								pdf.text(50,70, pdf.splitTextToSize("FOREST MONITORING" , 500))
								pdf.text(50,90, pdf.splitTextToSize("Name of Area Admin boundary/ protected area: "+ selected_admin , 500))
								//pdf.text(50,110, pdf.splitTextToSize("Total area: ", 500))
								//pdf.text(50,110, pdf.splitTextToSize("Area of biophysical change:" , 500))
								pdf.text(70,130, pdf.splitTextToSize("-	Area of forest gain from   "+studyLow+ " to " +studyHigh+ " : " + gainArea+" (ha)" , 500))
								pdf.text(70,150, pdf.splitTextToSize("-	Area of forest lost from   "+studyLow+ " to " +studyHigh+ " : " + lossArea+" (ha)" , 500))
								pdf.text(70,170, pdf.splitTextToSize("-	Area of forest in   "+studyHigh+" : " + forestAreaEndYear +" (ha)" , 500))
								pdf.text(50, 210, pdf.splitTextToSize('The change of forest gain and loss in '+ selected_admin + " from "+ studyLow+ " to " + studyHigh , 500));
								pdf.text(50, 230, pdf.splitTextToSize('Compare the area of forest change between the baseline period '+ " ("+ refLow+ " - " + refHigh + ") and the measuring period "+ " ("+ studyLow+ " - " + studyHigh + ")", 500));

								pdf.addImage(img, 'JPEG', 50, 250, undefined, undefined);

								var forest_noneforest = document.getElementById('forest_cover_chart');
								domtoimage.toPng(forest_noneforest)
								.then(function (dataUrl) {
									var imgChart = new Image();
									imgChart.src = dataUrl;
									//pdf.addPage();
									var lines = pdf.splitTextToSize('Area of forest cover in '+ selected_admin + " from "+ studyLow+ " to " + studyHigh , 500);
									pdf.text(50, 500, lines);
									pdf.addImage(imgChart, 'JPEG', 50, 520, undefined, undefined);
									pdf.addPage();
									var outlookMap = document.getElementById('forest_noneforest_chart');

									domtoimage.toPng(outlookMap)
									.then(function (dataUrl) {
										var imgChart = new Image();
										imgChart.src = dataUrl;
										var lines = pdf.splitTextToSize('Area of forest and none forest in '+ selected_admin+ " from "+ studyLow+ " to " + studyHigh , 500);
										pdf.text(50, 70, lines);
										pdf.addImage(imgChart, 'JPEG', 50, 90, undefined, undefined);
										var mapDiv = document.getElementById('map');
										domtoimage.toPng(mapDiv)
										.then(function (dataUrl) {

											var img = new Image();
											img.src = dataUrl;
											pdf.text(50, 300, pdf.splitTextToSize('Map of forest cover and change in '+ selected_admin+ " from "+ studyLow+ " to " + studyHigh , 500));
											pdf.addImage(img, 'JPEG', 50, 320,mapWidth, mapHeight);
											var newDate = new Date();
											var pdffilename = "M&E-REPORT: " + newDate.toLocaleDateString() + " @ " + newDate.toLocaleTimeString()+ ".pdf";
											pdf.save(pdffilename);
										})
										.catch(function (error) {
											console.error('oops, something went wrong!', error);
											showErrorAlert('oops, something went wrong! Please try agian');
										});

									});
								})
								.catch(function (error) {
									console.error('oops, something went wrong!', error);
								});
							})
							.catch(function (error) {
								console.error('oops, something went wrong!', error);
							});

					});

					$("#export_forest_alert_report").click(function() {
						showSpiner();
						hideSpiner();
						var pdf = new jsPDF("p", "pt", "a4");
						var width = pdf.internal.pageSize.getWidth();
						var height = pdf.internal.pageSize.getHeight();

						pdf.setFont("helvetica");
						pdf.setFontType("normal");
						pdf.setFontSize(10);

						var currentMap = document.getElementById('forest_alert_area');
						domtoimage.toPng(currentMap)
						.then(function (dataUrl) {
							var img = new Image();
							img.src = dataUrl;
							pdf.text(50,70, pdf.splitTextToSize("FOREST ALERT" , 500))
							pdf.text(50,90, pdf.splitTextToSize("Name of Area Admin boundary/ protected area: "+ selected_admin , 500))
							pdf.text(50,110, pdf.splitTextToSize("Total area of forest alert : "+total_forest_alert_area.toFixed(2)+ " (ha)", 500))
							var title = pdf.splitTextToSize('Total area of forest alert in '+ selected_admin , 500);
							pdf.text(50, 140, title);
							pdf.addImage(img, 'JPEG', 50, 150, undefined, undefined);

							var sarAlert = document.getElementById('sar_alert_area');
							domtoimage.toPng(sarAlert)
							.then(function (dataUrl) {
								var img2 = new Image();
								img2.src = dataUrl;
								pdf.text(50, 370, pdf.splitTextToSize('SAR ALERT' , 500));
								pdf.text(50,390, pdf.splitTextToSize("Name of Area Admin boundary/ protected area: "+ selected_admin , 500))
								pdf.text(50,410, pdf.splitTextToSize("Total area of SAR alert : "+total_sar_alert_area.toFixed(2)+ " (ha)", 500))
								var title2 = pdf.splitTextToSize('Total area of SAR alert in '+ selected_admin , 500);
								pdf.text(50, 430, title2);
								pdf.addImage(img2, 'JPEG', 50, 450, undefined, undefined);
								pdf.addPage();

								var mapDiv2 = document.getElementById('map');
									domtoimage.toPng(mapDiv2)
									.then(function (dataUrl) {
										var img = new Image();
										img.src = dataUrl;
										pdf.text(50, 70, pdf.splitTextToSize('Map of forest cover change' , 500));
										pdf.addImage(img, 'JPEG', 50, 90,mapWidth, mapHeight);
										var newDate = new Date();
										var pdffilename = "M&E-REPORT: " + newDate.toLocaleDateString() + " @ " + newDate.toLocaleTimeString()+ ".pdf";
										pdf.save(pdffilename);
									})
									.catch(function (error) {
										console.error('oops, something went wrong!', error);
										showErrorAlert('oops, something went wrong! Please try agian');
									});
								
							})
							.catch(function (error) {
								console.error('oops, something went wrong!', error);
								showErrorAlert('oops, something went wrong! Please try agian');
							});


						})
						.catch(function (error) {
							console.error('oops, something went wrong!', error);
						});

					});


					$("#export_burned_area_report").click(function() {
						showSpiner();
						hideSpiner();
						var pdf = new jsPDF("p", "pt", "a4");
						var width = pdf.internal.pageSize.getWidth();
						var height = pdf.internal.pageSize.getHeight();
						pdf.setFont("helvetica");
						pdf.setFontType("normal");
						pdf.setFontSize(10);
						var currentMap = document.getElementById('burned_area_chart');
						domtoimage.toPng(currentMap)
						.then(function (dataUrl) {
							var img = new Image();
							img.src = dataUrl;
							pdf.text(50,70, pdf.splitTextToSize("FIRE HOTSPOT MONITORING" , 500))
							pdf.text(50,90, pdf.splitTextToSize("Name of Area Admin boundary/ protected area: "+ selected_admin , 500))
							pdf.text(50,110, pdf.splitTextToSize("Total count number of fire hotspot was detected from "+ studyLow+ " to " + studyHigh+" : "+total_burned_area.toFixed(2)+ " (points)", 500))
							pdf.text(50, 140, pdf.splitTextToSize('Number of fire hotspot in '+ selected_admin + " from "+ studyLow+ " to " + studyHigh  , 500));
							pdf.addImage(img, 'JPEG', 50, 150, undefined, undefined);
							var mapDiv = document.getElementById('map');
							domtoimage.toPng(mapDiv)

							.then(function (dataUrl) {
								var img = new Image();
								img.src = dataUrl;
								pdf.text(50, 370, pdf.splitTextToSize('Map of forest fire hotspot ' , 500));
								pdf.addImage(img, 'JPEG', 50, 390,mapWidth, mapHeight);
								var newDate = new Date();
								var pdffilename = "M&E-REPORT: " + newDate.toLocaleDateString() + " @ " + newDate.toLocaleTimeString()+ ".pdf";
								pdf.save(pdffilename);
							})
							.catch(function (error) {
								console.error('oops, something went wrong!', error);
								showErrorAlert('oops, something went wrong! Please try agian');
							});

						})
						.catch(function (error) {
							console.error('oops, something went wrong!', error);
						});
					});

					/**
					* Upload Area Button
					**/
					var readFile = function (e) {

						editableLayers.clearLayers();
						var files = e.target.files;
						if (files.length > 1) {
							console.log('upload one file at a time');
						} else {

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

								if (addedGeoJson.features) {
									var polygon_coords_arr = [];
									for(var i=0; i<addedGeoJson.features.length; i++){
										var polygonArray = [];
										var polygonArray2 = [];
										var shape = {};
										var _coord;
										var uploadPolygon;
										var coordinatePair;
										var geometry = addedGeoJson.features ? addedGeoJson.features[i].geometry : addedGeoJson.geometry;
										if (geometry.type === 'Polygon') {
											// Convert to Polygon
											shape = {};
										  _coord = geometry.coordinates[0];

											for (var j = 0; j < _coord.length; j++) {
												coordinatePair = [parseFloat(_coord[j][1]), parseFloat(_coord[j][0])];
												polygonArray.push(coordinatePair);
												polygonArray2.push([parseFloat(_coord[j][0]), parseFloat(_coord[j][1])]);
											}

											polygon_coords_arr.push(polygonArray2);
											uploadPolygon = new L.polygon(polygonArray,{color:'red',weight:2,fillOpacity: 0,pane:'admin'}).addTo(map);
											editableLayers.addLayer(uploadPolygon);

										}
										else if(geometry.type === 'MultiPolygon') {
											shape = {};
											_coord = geometry.coordinates[0][0];
											polygonArray2.push(_coord);

											for (var jj = 0; jj < _coord.length; jj++) {
												coordinatePair = [parseFloat(_coord[jj][1]), parseFloat(_coord[jj][0])];
												polygonArray.push(coordinatePair);
											}

											polygon_coords_arr.push(polygonArray2);
											uploadPolygon = new L.polygon(polygonArray,{color:'red',weight:2,fillOpacity: 0,pane:'admin'}).addTo(map);
											editableLayers.addLayer(uploadPolygon);
										}
										else{
											alert('we only accept polygons');
										}
									}
									polygon_id = polygon_coords_arr;
									area_type = "upload";
									selected_admin = "Your Uploaded Area";
									hideModel();

								} else {
									alert('Please check your files, there is an error!');
								}

							};
						}
					};

					$('#input-file2').change(function (event) {
						readFile(event);
					});


					var export_report  = function (e) {
						showSpiner();
						hideSpiner();

						setTimeout(function(){
							$("#forest-monitoring-tab").click();
							setTimeout(function(){
								$("#export_forest_report").click();
							}, 22000);
						}, 16000);

						setTimeout(function(){
							$("#forest-alert-tab").click();
							setTimeout(function(){
								$("#export_forest_alert_report").click();
							}, 38000);
						}, 32000);

						setTimeout(function(){
							$("#fire-tab").click();
							setTimeout(function(){
								$("#export_burned_area_report").click();
							}, 54000);
						}, 48000);

						setTimeout(function(){
							var newDate = new Date();
							var pdffilename = "M&E-REPORT: " + newDate.toLocaleDateString() + " @ " + newDate.toLocaleTimeString()+ ".pdf";
							pdf.save(pdffilename);
							$scope.showLoader = false;
						}, 64000);

					}

				});

			})();
