# -*- coding: utf-8 -*-
from django.core import serializers
from django.http import HttpResponse
import datetime
import numpy as np
import base64
from django.conf import settings
import ee, json, os, time
from django.http import JsonResponse
from django.http import HttpResponse
from ee.ee_exception import EEException
import requests
# -----------------------------------------------------------------------------
class GEEApi():
    """ Google Earth Engine API """
    ee.Initialize(settings.EE_CREDENTIALS)
    # image collection
    TREE_CANOPY = ee.ImageCollection(settings.TREE_CANOPY)
    TREE_HEIGHT = ee.ImageCollection(settings.TREE_HEIGHT)
    GLAD_ALERT = settings.GLAD_ALERT
    GLAD_FOREST_ALERT_FC = settings.GLAD_FOREST_ALERT_FC
    CAMBODIA_COUNTRY_BOUNDARY = settings.CAMBODIA_COUNTRY_BOUNDARY
    PROTECTED_AREA = settings.PROTECTED_AREA
    CAMBODIA_PROVINCE_BOUNDARY = settings.CAMBODIA_PROVINCE_BOUNDARY
    CAMBODIA_DISTRICT_BOUNDARY = settings.CAMBODIA_DISTRICT_BOUNDARY
    BURNED_AREA = ee.ImageCollection(settings.BURNED_AREA)
    FIRMS_BURNED_AREA = ee.ImageCollection(settings.FIRMS_BURNED_AREA)
    LANDCOVER = ee.ImageCollection(settings.LANDCOVER)
    SAR_ALERT = settings.SAR_ALERT

    COLOR = ['A8D9C6','B0DAB2','BFE1C9','AAD7A0','C3DE98','D5E59E','93D2BF','95CF9C','A4D7B8','9BD291','B1D78A','C9E08E','5CC199','77C78C','37B54A','126039','146232','0F8040','279445','449644','59A044','0E361E','236832','335024', '36461F']
    COLORFORESTALERT = ['943126', 'B03A2E', 'CB4335', 'E74C3C', 'F1948A', 'F5B7B1','943126', 'B03A2E', 'CB4335', 'E74C3C', 'F1948A', 'F5B7B1']
    COLORSARALERT = ['fba004', 'f9bc16', 'ac9d0a', 'fba004', 'f9bc16', 'ac9d0a','fba004', 'f9bc16', 'ac9d0a','fba004', 'f9bc16', 'ac9d0a']

    def __init__(self, area_path, area_name, geom, area_type, area_id):

        self.scale = 100

        if area_type == "draw":
            coords = []
            for items in eval(geom):
                coords.append([items[1],items[0]])
            self.geometry =  ee.FeatureCollection(ee.Geometry.Polygon(coords)).geometry()

        elif area_type == "upload":
            polygons = []
            for items in geom:
                polygons.append(ee.Geometry.Polygon(items))
            self.geometry =  ee.FeatureCollection(ee.Geometry.MultiPolygon(polygons)).geometry()

        elif area_type == "country":
            self.geometry = ee.FeatureCollection(GEEApi.CAMBODIA_COUNTRY_BOUNDARY).filter(ee.Filter.eq("NAME_ENGLI", area_id)).geometry()

        elif area_type == "protected_area":
            self.geometry = ee.FeatureCollection(GEEApi.PROTECTED_AREA).filter(ee.Filter.eq("map_id", area_id)).geometry()

        elif area_type == "province":
            self.geometry = ee.FeatureCollection(GEEApi.CAMBODIA_PROVINCE_BOUNDARY).filter(ee.Filter.eq("gid", area_id)).geometry()

        elif area_type == "district":
            self.geometry = ee.FeatureCollection(GEEApi.CAMBODIA_DISTRICT_BOUNDARY).filter(ee.Filter.eq("DIST_CODE", area_id)).geometry()

        #polygon area in square kilometers.
        self.geometryArea = self.geometry.area().divide(1000 * 1000)
        #polygon area in Hectare
        self.geometryArea = float(self.geometryArea.getInfo()) / 0.010000

    # -------------------------------------------------------------------------
    def getTileLayerUrl(self, ee_image_object):
        map_id = ee.Image(ee_image_object).getMapId()
        #tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}?token={token}"
        tile_url_template =  str(map_id['tile_fetcher'].url_format)
        return tile_url_template

    # Request the pie EVI chart from EcoDash tool-------------------------------------------------------------------------
    def getPieEVI(self, polygon_id, mycounter, folder, refLow, refHigh, studyLow, studyHigh):
        return_obj = {}
        url = "http://ecodash-servir.adpc.net/pieChart?"
        response = requests.get(url, params={'polygon_id': polygon_id, 'mycounter': mycounter, 'folder': folder, 'refLow':refLow, 'refHigh':refHigh, 'studyLow':studyLow,'studyHigh':studyHigh})
        response = response.json()
        return_obj["data"] = response
        return return_obj

    # Request the line EVI chart from EcoDash tool-------------------------------------------------------------------------
    def getLineEVI(self, polygon_id, mycounter, folder, refLow, refHigh, studyLow, studyHigh):
        return_obj = {}
        url = "http://ecodash-servir.adpc.net/details?"
        response = requests.get(url, params={'polygon_id': polygon_id, 'mycounter': mycounter, 'folder': folder, 'refLow':refLow, 'refHigh':refHigh, 'studyLow':studyLow,'studyHigh':studyHigh})
        response = response.json()
        return_obj["data"] = response
        return return_obj



    # -------------------------------------------------------------------------
    def calcPie(self,ref_start,ref_end,series_start,series_end):

        res = []

        # The scale at which to reduce the polygons for the brightness time series.
        REDUCTION_SCALE_METERS = 10000

        ref_start = str(ref_start) + '-01-01'
        ref_end = str(ref_end) + '-12-31'
        series_start = str(series_start) + '-01-01'
        series_end = str(series_end) + '-12-31'

        cumulative = self.Calculation(ref_start,ref_end,series_start,series_end)

        myList = cumulative.toList(500)

        fit = ee.Image(myList.get(-1))

        months = ee.Date(series_end).difference(ee.Date(series_start),"month").getInfo()

        Threshold1 = months * 0.04
        Threshold2 = months * 0.02

        Threshold3 = months * -0.02
        Threshold4 = months * -0.04

        #area in hectare unit
        T1 = fit.where(fit.lt(Threshold1),0)
        T1 = T1.where(T1.gt(0),1).reduceRegion(ee.Reducer.sum(), self.geometry, REDUCTION_SCALE_METERS).getInfo()['EVI'] * (REDUCTION_SCALE_METERS * REDUCTION_SCALE_METERS) * 0.0001

        T2 = fit.where(fit.lt(Threshold2),0)
        T2 = T2.where(T2.gt(0),1).reduceRegion(ee.Reducer.sum(), self.geometry, REDUCTION_SCALE_METERS).getInfo()['EVI'] * (REDUCTION_SCALE_METERS * REDUCTION_SCALE_METERS) * 0.0001

        T3 = fit.where(fit.gt(Threshold3),0)
        T3 = T3.where(T3.lt(0),1).reduceRegion(ee.Reducer.sum(), self.geometry, REDUCTION_SCALE_METERS).getInfo()['EVI'] * (REDUCTION_SCALE_METERS * REDUCTION_SCALE_METERS) * 0.0001

        T4 = fit.where(fit.gt(Threshold4),0)
        T4 = T4.where(T4.lt(0),1).reduceRegion(ee.Reducer.sum(), self.geometry, REDUCTION_SCALE_METERS).getInfo()['EVI'] * (REDUCTION_SCALE_METERS * REDUCTION_SCALE_METERS) * 0.0001

        T5 = fit.where(fit.gt(-9999),1).reduceRegion(ee.Reducer.sum(), self.geometry, REDUCTION_SCALE_METERS).getInfo()['EVI'] * (REDUCTION_SCALE_METERS * REDUCTION_SCALE_METERS) * 0.0001


        p1 = float('%.2f' % (T1))
        p2 = float('%.2f' % ((T2 - T1)))

        m1 = float('%.2f' % (T4))
        m2 = float('%.2f' % ((T3 - T4)))

        middle = float('%.2f' % ((T5 - p1 - p2 - m1 - m2)))

        myArray = [p1,p2,middle,m2,m1]
        return myArray

    def GetPolygonTimeSeries(self,ref_start,ref_end,series_start,series_end):
        """Returns details about the polygon with the passed-in ID."""


        #details = memcache.get(polygon_id)

        # If we've cached details for this polygon, return them.
        #if details is not None:
        #  return details

        details = {}

        try:
            details['timeSeries'] = self.ComputePolygonTimeSeries(ref_start,ref_end,series_start,series_end)
        # Store the results in memcache.
        #memcache.add(polygon_id, json.dumps(details), MEMCACHE_EXPIRATION)
        except ee.EEException as e:
        # Handle exceptions from the EE client library.
            details['error'] = str(e)

        # Send the results to the browser.
        return details


    def ComputePolygonTimeSeries(self,ref_start,ref_end,series_start,series_end):

        """Returns a series of brightness over time for the polygon."""
        ref_start = str(ref_start) + '-01-01'
        ref_end = str(ref_end) + '-12-31'
        series_start = str(series_start) + '-01-01'
        series_end = str(series_end) + '-12-31'

        cumulative = self.Calculation(ref_start,ref_end,series_start,series_end)

        REDUCTION_SCALE_METERS = 10000

        # Compute the mean brightness in the region in each image.
        def ComputeMean(img):
            reduction = img.reduceRegion(
                ee.Reducer.mean(), self.geometry, REDUCTION_SCALE_METERS)
            return ee.Feature(None, {
                'EVI': reduction.get('EVI'),
                'system:time_start': img.get('system:time_start')
            })

        # Extract the results as a list of lists.
        def ExtractMean(feature):
            return [
                feature['properties']['system:time_start'],
                feature['properties']['EVI']
            ]


        chart_data = cumulative.map(ComputeMean).getInfo()
        res = []
        for feature in chart_data['features']:
            res.append(ExtractMean(feature))

        return res


    def ComputePolygonDrawTimeSeries(ref_start,ref_end,series_start,series_end):

        """Returns a series of brightness over time for the polygon."""
        ref_start = str(ref_start) + '-01-01'
        ref_end = str(ref_end) + '-12-31'
        series_start = str(series_start) + '-01-01'
        series_end = str(series_end) + '-12-31'

        cumulative = Calculation(ref_start,ref_end,series_start,series_end)


        REDUCTION_SCALE_METERS = 10000


        # Compute the mean brightness in the region in each image.
        def ComputeMean(img):
            reduction = img.reduceRegion(
                ee.Reducer.mean(), self.geometry, REDUCTION_SCALE_METERS)


        return ee.Feature(None, {
            'EVI': reduction.get('EVI'),
            'system:time_start': img.get('system:time_start')
        })

        # Extract the results as a list of lists.
        def ExtractMean(feature):
            return [
                feature['properties']['system:time_start'],
                feature['properties']['EVI']
            ]

        chart_data = cumulative.map(ComputeMean).getInfo()

        mymap = map(ExtractMean, chart_data['features'])

        return mymap

    def Calculation(self, ref_start,ref_end,series_start,series_end):

        IMAGE_COLLECTION_ID = ee.ImageCollection('MODIS/006/MYD13A1')
        collection = ee.ImageCollection(IMAGE_COLLECTION_ID) #.filterDate('2008-01-01', '2010-12-31').sort('system:time_start')
        reference = collection.filterDate(ref_start,ref_end ).sort('system:time_start').select('EVI')
        series = collection.filterDate(series_start, series_end).sort('system:time_start').select('EVI')

        def calcMonthlyMean(img):

          # get the month of the map
          month = ee.Number.parse(ee.Date(img.get("system:time_start")).format("M"))
          # get the day in month
          day = ee.Number.parse(ee.Date(img.get("system:time_start")).format("d"))

          # select image in reference period
          refmaps = reference.filter(ee.Filter.calendarRange(month,month,"Month"))
          refmaps = refmaps.filter(ee.Filter.calendarRange(day,day,"day_of_month"))
          # get the mean of the reference
          refmean = ee.Image(refmaps.mean()).multiply(0.0001)

          # get date
          time = img.get('system:time_start')

          # multiply image by scaling factor
          study = img.multiply(0.0001)

          # subtract mean from study
          result = ee.Image(study.subtract(refmean).set('system:time_start',time))

          return result

        mycollection = series.map(calcMonthlyMean)

        time0 = series.first().get('system:time_start')
        first = ee.List([ee.Image(0).set('system:time_start', time0).select([0], ['EVI'])])

        ## This is a function to pass to Iterate().
        ## As anomaly images are computed, add them to the list.
        def accumulate(image, mylist):
            ## Get the latest cumulative anomaly image from the end of the list with
            ## get(-1).  Since the type of the list argument to the function is unknown,
            ## it needs to be cast to a List.  Since the return type of get() is unknown,
            ## cast it to Image.
            previous = ee.Image(ee.List(mylist).get(-1))
            ## Add the current anomaly to make a new cumulative anomaly image.
            added = image.unmask(0).add(previous).set('system:time_start', image.get('system:time_start'))
            ## Propagate metadata to the new image.
            #
            ## Return the list with the cumulative anomaly inserted.
            return ee.List(mylist).add(added)

        ## Create an ImageCollection of cumulative anomaly images by iterating.
        ## Since the return type of iterate is unknown, it needs to be cast to a List.
        cumulative = ee.ImageCollection(ee.List(mycollection.iterate(accumulate, first)))

        return cumulative

    # -------------------------------------------------------------------------
    def getEVIMap(self,ref_start,ref_end,series_start,series_end):

        ref_start = str(ref_start) + '-01-01'
        ref_end = str(ref_end) + '-12-31'
        series_start = str(series_start) + '-01-01'
        series_end = str(series_end) + '-12-31'

        cumulative = self.Calculation(ref_start,ref_end,series_start,series_end)

        myList = cumulative.toList(500)

        fit = ee.Image(myList.get(-1)).clip(self.geometry).select('EVI')
        image = fit.reproject(crs=fit.projection());        
        # imgScale =500
        image = image.reproject(crs='EPSG:4326', scale=250)


        months = ee.Date(series_end).difference(ee.Date(series_start),"month").getInfo()

        Threshold1 = months * 0.1
        Threshold2 = months * -0.1
        map_id = image.getMapId({
          'min': Threshold2,
          'max': Threshold1,
          'bands': 'EVI',
          'palette' : 'E76F51,F4A261,E9C46A,2A9D8F,264653'
        })
        return {
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }

    # -------------------------------------------------------------------------
    def downloadEVIMap(self,ref_start,ref_end,series_start,series_end):

        ref_start = str(ref_start) + '-01-01'
        ref_end = str(ref_end) + '-12-31'
        series_start = str(series_start) + '-01-01'
        series_end = str(series_end) + '-12-31'
        cumulative = self.Calculation(ref_start,ref_end,series_start,series_end)
        myList = cumulative.toList(500)
        fit = ee.Image(myList.get(-1)).clip(self.geometry)
        
        try:
            dnldURL = fit.getDownloadURL({
                    'name': 'evi'+series_start+'-'+series_end,
                    'scale': 1000,
                    'crs': 'EPSG:4326',
                    'region': self.geometry
                })

            return {
                'downloadURL': dnldURL,
                'success': 'success'
                    }
        except Exception as e:
            return {
                'success': 'not success'
            }


    # -------------------------------------------------------------------------
    def tree_canopy(self,
                    img_coll = None,
                    get_image = False,
                    for_download = False,
                    year = None,
                    tree_canopy_definition = 10,
                    ):

        if not year:
            return {
                'message': 'Please specify a year for which you want to perform the calculations!'
            }

        if not img_coll:
            def _apply_tree_canopy_definition(img):
                mask = img.select(0).gt(tree_canopy_definition)
                return img.updateMask(mask).rename(['tcc'])

            img_coll = GEEApi.TREE_CANOPY
            img_coll = img_coll.map(_apply_tree_canopy_definition)

        image = ee.Image(img_coll.filterDate('%s-01-01' % year,
                                             '%s-12-31' % year).first())

        if get_image:
            if for_download:
                return image.updateMask(image).clip(self.geometry)
            else:
                return image.clip(self.geometry)

        image = image.updateMask(image).clip(self.geometry)

        map_id = image.getMapId({
            'min': str(tree_canopy_definition),
            'max': '100',
            'palette': 'f7fcf5,e8f6e3,d0edca,b2e0ab,8ed18c,66bd6f,3da75a,238c45,03702e,00441b'
        })

        return {
            'eeMapId': str(map_id['mapid']),
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }

    # -------------------------------------------------------------------------
    def tree_height(self,
                    img_coll = None,
                    get_image = False,
                    for_download = False,
                    year = None,
                    tree_height_definition = 5,
                    ):

        if not year:
            return {
                'message': 'Please specify a year for which you want to perform the calculations!'
            }

        if not img_coll:
            def _apply_tree_height_definition(img):
                mask = img.select(0).gt(tree_height_definition)
                return img.updateMask(mask)

            img_coll = GEEApi.TREE_HEIGHT
            img_coll = img_coll.map(_apply_tree_height_definition)

        image = ee.Image(img_coll.filterDate('%s-01-01' % year,
                                             '%s-12-31' % year).mean())

        if get_image:
            if for_download:
                return image.updateMask(image).clip(self.geometry)
            else:
                return image.clip(self.geometry)

        image = image.updateMask(image).clip(self.geometry)

        map_id = image.getMapId({
            'min': str(tree_height_definition),
            'max': '36', #'{}'.format(int(math.ceil(max.getInfo()[max.getInfo().keys()[0]]))),
            #'palette': 'f7fcf5,e8f6e3,d0edca,b2e0ab,8ed18c,66bd6f,3da75a,238c45,03702e,00441b'
            'palette': '410f74,5e177f,7b2282,982c80,b63679,d3426e,eb5761,f8765c,fe9969,febb80,fedc9d,fcfdbf'
        })

        return {
            'eeMapId': str(map_id['mapid']),
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }


    # -------------------------------------------------------------------------
    @staticmethod
    def _get_combined_img_coll(end_year):
        years = ee.List.sequence(2000, end_year)
        date_ymd = ee.Date.fromYMD

        def addBands(_year):
            tcc = GEEApi.TREE_CANOPY.filterDate(date_ymd(_year, 1, 1),
                                                       date_ymd(_year, 12, 31)).first()
            tcc = ee.Image(tcc).rename(['tcc'])
            tch = GEEApi.TREE_HEIGHT.filterDate(date_ymd(_year, 1, 1),
                                                       date_ymd(_year, 12, 31)).first()
            tch = ee.Image(tch).rename(['tch'])

            return ee.Image(tcc).addBands(tch)

        ic = ee.ImageCollection.fromImages(years.map(addBands))
        return ic

    # -------------------------------------------------------------------------
    @staticmethod
    def _filter_for_forest_definition(img_coll,
                                      tree_canopy_definition,
                                      tree_height_definition):

        # 0 - tcc
        # 1 - tch
        return img_coll.map(lambda img: img.select('tcc').gt(tree_canopy_definition).\
                            And(img.select('tch').gt(tree_height_definition)).
                            rename(['forest_cover']).copyProperties(img, img.propertyNames()))

    # -------------------------------------------------------------------------
    def forest_gain(self,
                    get_image = False,
                    start_year = None,
                    end_year = None,
                    tree_canopy_definition = 10,
                    tree_height_definition = 5,
                    download = 'False'):

        if not start_year and end_year:
            return {
                'message': 'Please specify a start and end year for which you want to perform the calculations!'
            }

        combined_img_coll = GEEApi._get_combined_img_coll(end_year)

        filtered_img_coll = GEEApi._filter_for_forest_definition(\
                                                        combined_img_coll,
                                                        tree_canopy_definition,
                                                        tree_height_definition)

        start_image = self.tree_canopy(img_coll = filtered_img_coll,
                                       get_image = True,
                                       year = start_year,
                                       tree_canopy_definition = tree_canopy_definition,
                                       )

        end_image = self.tree_canopy(img_coll = filtered_img_coll,
                                     get_image = True,
                                     year = end_year,
                                     tree_canopy_definition = tree_canopy_definition,
                                     )

        gain_image = end_image.subtract(start_image).gt(0)
        gain_image = gain_image.updateMask(gain_image).select('forest_cover').clip(self.geometry)

        if get_image:
            return gain_image

        if download == 'True':
            try:
                dnldURL = gain_image.getDownloadURL({
                    'name': 'ForestGain'+str(start_year)+'_'+str(end_year),
                    'scale': 100,
                    'crs': 'EPSG:4326'
                })
                return {
                    'downloadURL': dnldURL,
                    'success': 'success'
                        }
            except Exception as e:
                return {
                    'success': 'not success'
                }
        else:
            map_id = gain_image.getMapId({
                'palette': '173F5F'
            })

            return {
                'eeMapId': str(map_id['mapid']),
                'eeMapURL': str(map_id['tile_fetcher'].url_format),
                'color': '173F5F'
            }

    # -------------------------------------------------------------------------
    def forest_loss(self,
                    get_image = False,
                    start_year = None,
                    end_year = None,
                    tree_canopy_definition = 10,
                    tree_height_definition = 5,
                    download = 'False'):

        if not start_year and end_year:
            return {
                'message': 'Please specify a start and end year for which you want to perform the calculations!'
            }

        combined_img_coll = GEEApi._get_combined_img_coll(end_year)

        filtered_img_coll = GEEApi._filter_for_forest_definition(\
                                                        combined_img_coll,
                                                        tree_canopy_definition,
                                                        tree_height_definition)

        start_image = self.tree_canopy(img_coll = filtered_img_coll,
                                       get_image = True,
                                       year = start_year,
                                       tree_canopy_definition = tree_canopy_definition,
                                       )

        end_image = self.tree_canopy(img_coll = filtered_img_coll,
                                     get_image = True,
                                     year = end_year,
                                     tree_canopy_definition = tree_canopy_definition,
                                     )

        loss_image = end_image.subtract(start_image).lt(0)
        loss_image = loss_image.updateMask(loss_image).select('forest_cover').clip(self.geometry)

        if get_image:
            return loss_image

        if download == 'True':
            try:
                dnldURL = loss_image.getDownloadURL({
                    'name': 'ForestLoss'+str(start_year)+'_'+str(end_year),
                    'scale': 100,
                    'crs': 'EPSG:4326'
                })
                return {
                    'downloadURL': dnldURL,
                    'success': 'success'
                        }
            except Exception as e:
                return {
                    'success': 'not success'
                }
        else:
            map_id = loss_image.getMapId({
            'palette': 'fdb827'
            })

            return {
                'eeMapId': str(map_id['mapid']),
                'eeMapURL': str(map_id['tile_fetcher'].url_format),
                'color': 'fdb827'
            }

        


    # -------------------------------------------------------------------------
    def forest_extend(self,
                      get_image = False,
                      year = None,
                      tree_canopy_definition = 10,
                      tree_height_definition = 5,
                      start_year = 2000,
                      end_year=None,
                      area_type='',
                      area_id=''):


        if not year:
            return {
                'message': 'Please specify a year for which you want to perform the calculations!'
            }

        combined_img_coll = GEEApi._get_combined_img_coll(end_year)

        filtered_img_coll = GEEApi._filter_for_forest_definition(\
                                                        combined_img_coll,
                                                        tree_canopy_definition,
                                                        tree_height_definition)

        image = self.tree_canopy(img_coll = filtered_img_coll,
                                 get_image = True,
                                 year = year,
                                 tree_canopy_definition = tree_canopy_definition,
                                 )

        image = image.updateMask(image).clip(self.geometry)

        map_id = image.getMapId({
            'min': str(tree_canopy_definition),
            'max': '100',
            'palette': GEEApi.COLOR[year - start_year]
        })

        if area_type == "country":
            ic = "projects/servir-mekong/Cambodia-Dashboard-tool/ForestArea/camMetadata"
            forestArea_fc = ee.FeatureCollection(ic)
            forestArea = forestArea_fc.filter(ee.Filter.eq('NAME_ENGLI', area_id)).filter(ee.Filter.eq('year', year))
            areaHA = forestArea.aggregate_array("areaHect").get(0).getInfo()

        elif area_type == "province":
            ic = "projects/servir-mekong/Cambodia-Dashboard-tool/ForestArea/province_"+ str(year) +"Metadata"
            forestArea_fc = ee.FeatureCollection(ic)
            forestArea = forestArea_fc.filter(ee.Filter.eq('gid', area_id))
            areaHA = forestArea.aggregate_array("areaHect").get(0).getInfo()


        elif area_type == "district":
            ic = "projects/servir-mekong/Cambodia-Dashboard-tool/ForestArea/district_"+ str(year) +"Metadata"
            forestArea_fc = ee.FeatureCollection(ic)
            forestArea = forestArea_fc.filter(ee.Filter.eq('DIST_CODE', area_id))
            areaHA = forestArea.aggregate_array("areaHect").get(0).getInfo()

        elif area_type == "protected_area":
            ic = "projects/servir-mekong/Cambodia-Dashboard-tool/ForestArea/protected_"+ str(year) +"Metadata"
            forestArea_fc = ee.FeatureCollection(ic)
            forestArea = forestArea_fc.filter(ee.Filter.eq('map_id', area_id))
            areaHA = forestArea.aggregate_array("areaHect").get(0).getInfo()


        elif area_type == "draw" or area_type == "upload":
            reducer = image.gt(0).multiply(self.scale).multiply(self.scale).reduceRegion(
                reducer = ee.Reducer.sum(),
                geometry = self.geometry,
                crs = 'EPSG:32647', # WGS Zone N 47
                scale = self.scale,
                maxPixels = 10**15
            )
            stats = reducer.getInfo()["forest_cover"]
            # in hectare
            areaHA = stats * 0.0001

        if get_image:
            return image

        return {
            'forest': float('%.2f' % areaHA),
            'noneForest': float('%.2f' % (self.geometryArea - areaHA)),
            'eeMapId': str(map_id['mapid']),
            'eeMapURL': str(map_id['tile_fetcher'].url_format),
            'color': GEEApi.COLOR[year - start_year]
        }

    # -------------------------------------------------------------------------
    def downloadForestMap(self, year, end_year):
        if not year:
            return {
                'message': 'Please specify a year for which you want to perform the calculations!'
            }
        tree_canopy_definition = 10
        tree_height_definition = 5
        combined_img_coll = GEEApi._get_combined_img_coll(end_year)
        filtered_img_coll = GEEApi._filter_for_forest_definition(combined_img_coll, tree_canopy_definition, tree_height_definition)

        image = self.tree_canopy(img_coll = filtered_img_coll, get_image = True, year = year, tree_canopy_definition = tree_canopy_definition)

        image = image.updateMask(image).clip(self.geometry)

        try:
            dnldURL = image.getDownloadURL({
                    'name': 'Forest'+year,
                    'scale': 100,
                    'crs': 'EPSG:4326'
                })
            return {
                'downloadURL': dnldURL,
                'success': 'success'
            }
        except Exception as e:
            return {
                'success': 'not success'
            }

    # -------------------------------------------------------------------------
    def get_mapid(self, type, start_year, end_year, tree_canopy_definition, tree_height_definition, area_type, area_id):
        mapid = []
        res = {}
        for _year in range(start_year, end_year+1):
            res[str(_year)] = self.forest_extend(get_image = False,
                                       year = _year,
                                       tree_canopy_definition = tree_canopy_definition,
                                       tree_height_definition = tree_height_definition,
                                       start_year = start_year,
                                       end_year= end_year,
                                       area_type= area_type, area_id=area_id)

        try:
            return res
        except Exception as e:
            return {
                'reportError': e.message
            }
    # -------------------------------------------------------------------------
    def get_forestGainLoss(self, type, year, start_year, end_year, tree_canopy_definition, tree_height_definition):
        res = {}
        name = 'forest_cover'

        if (type == 'forestGainLoss'):
            imageLoss = self.forest_loss(get_image = True,
                                     start_year = start_year,
                                     end_year = end_year,
                                     tree_canopy_definition = tree_canopy_definition,
                                     tree_height_definition = tree_canopy_definition,
                                     )
            imageGain = self.forest_gain(get_image = True,
                                     start_year = start_year,
                                     end_year = end_year,
                                     tree_canopy_definition = tree_canopy_definition,
                                     tree_height_definition = tree_height_definition
                                     )

            reducerLoss = imageLoss.gt(0).multiply(self.scale).multiply(self.scale).reduceRegion(
                reducer = ee.Reducer.sum(),
                geometry = self.geometry,
                crs = 'EPSG:32647', # WGS Zone N 47
                scale = self.scale,
                maxPixels = 10**15
            )
            reducerGain = imageGain.gt(0).multiply(self.scale).multiply(self.scale).reduceRegion(
                reducer = ee.Reducer.sum(),
                geometry = self.geometry,
                crs = 'EPSG:32647', # WGS Zone N 47
                scale = self.scale,
                maxPixels = 10**15
            )

            statsLoss = reducerLoss.getInfo()[name]
            statsGain = reducerGain.getInfo()[name]
            # in hectare
            statsLoss = statsLoss * 0.0001
            statsGain = statsGain * 0.0001

            res['forestgain'] = float('%.2f' % statsGain)
            res['forestloss'] = float('%.2f' % statsLoss)

        try:
            return res
        except Exception as e:
            return {
                'reportError': e.message
            }

    # -------------------------------------------------------------------------
    def calForestAlert_image(self, get_image, imagecol, bandName, colorIndex):

        GLADIC = imagecol.filterBounds(self.geometry).sort('system:time_start', False)#.filterDate(series_start, series_end)

        image = GLADIC.first().select(bandName)

        confAlert = image.updateMask(image.gt(0)).clip(self.geometry)
        image1 = ee.Image(1).clip(self.geometry)
        confrimAlert = image1.updateMask(confAlert)

        vectorConf = confrimAlert.addBands(confrimAlert).reduceToVectors(
          crs= confrimAlert.select('constant').projection(),
          scale= 30,
          geometryType= 'polygon',
          eightConnected= False,
          labelProperty= 'zone',
          reducer= ee.Reducer.sum(),
          maxPixels= 1E15,
          bestEffort = True
        )
        #filter connected pixels more than 4 pixel
        vectorConf_gt4pix = vectorConf.filterMetadata("sum","greater_than", 4)
        total_number_conf = vectorConf_gt4pix.size().getInfo()

        def calArea(feature):
            #Compute area from the geometry.
            area = feature.geometry().area(10)
            return feature.set('area', area).set('conf', 1)

        #Map the difference function over the collection.
        featureCalAreas = vectorConf_gt4pix.map(calArea)

        #area greater than x (m2)
        area2 = ee.Number(featureCalAreas.aggregate_sum("area")).getInfo()
        #area greater than x (ha)
        areaHA = area2/10000

        confAlertMap = featureCalAreas.filter(ee.Filter.notNull(['conf'])).reduceToImage(
            properties= ['conf'],
            reducer= ee.Reducer.first(),
        )
        colorMap = GEEApi.COLORFORESTALERT[colorIndex]
        map_id = confAlertMap.getMapId({
            'min': '0',
            'max': '1',
            'palette': colorMap
        })

        return {
        'total_area': float('%.2f' % areaHA),
        'total_number': total_number_conf,
        'eeMapId': str(map_id['mapid']),
        'eeMapURL': str(map_id['tile_fetcher'].url_format),
        'color': colorMap
        }

    # -------------------------------------------------------------------------
    def calForestAlert(self, get_image, colorIndex, area_type, area_id, series_start, series_end, year):

        GLADIC = ee.ImageCollection(GEEApi.GLAD_ALERT).filterBounds(self.geometry).filterDate(series_start, series_end)

        image = GLADIC.sort('system:time_start', False).first().select("alert").clip(self.geometry).toInt16()

        binary_image = image.neq(0).rename(['binary']).multiply(1).toInt16().selfMask()

        # ee.Image.pixelArea()
        if area_type == "draw" or area_type == "upload":
            reducer = binary_image.multiply(900).reduceRegion(
              reducer= ee.Reducer.sum(),
              geometry= self.geometry,
              crs = 'EPSG:32647', # WGS Zone N 47
              scale= 30,
              maxPixels= 1E20
            )

            #area in squre meter
            stats = reducer.getInfo()['binary']
            #convert to hactare divide by 10000
            areaHA = stats / 10000
        else:
            if area_type == "country":
                forest_featurecol = ee.FeatureCollection(GEEApi.GLAD_FOREST_ALERT_FC+""+str(year)+"/cambodia_areaMeta")
                forest_alert = forest_featurecol.filter(ee.Filter.eq('NAME_ENGLI', area_id))
            elif area_type == "province":
                forest_featurecol = ee.FeatureCollection(GEEApi.GLAD_FOREST_ALERT_FC+""+str(year)+"/province_Metadata")
                forest_alert = forest_featurecol.filter(ee.Filter.eq('gid', area_id))
            elif area_type == "district":
                forest_featurecol = ee.FeatureCollection(GEEApi.GLAD_FOREST_ALERT_FC+""+str(year)+"/district_Metadata")
                forest_alert = forest_featurecol.filter(ee.Filter.eq('DIST_CODE', area_id))
            elif area_type == "protected_area":
                forest_featurecol = ee.FeatureCollection(GEEApi.GLAD_FOREST_ALERT_FC+""+str(year)+"/protected_Metadata")
                forest_alert = forest_featurecol.filter(ee.Filter.eq('map_id', area_id))

            areaHA = forest_alert.aggregate_array("areaHect").get(0).getInfo()

        colorMap = GEEApi.COLORFORESTALERT[colorIndex]
        map_id = binary_image.getMapId({
            'min': '0',
            'max': '1',
            'palette': colorMap
        })

        return {
            'total_area': float('%.2f' % areaHA),
            'total_number': 0,
            'eeMapId': str(map_id['mapid']),
            'eeMapURL': str(map_id['tile_fetcher'].url_format),
            'color': colorMap
        }

    # -------------------------------------------------------------------------
    def calSARAlert(self, get_image, colorIndex, area_type, area_id, series_start, series_end, year):

        # SARIC = ee.ImageCollection(GEEApi.SAR_ALERT).filterBounds(self.geometry).filterDate(series_start, series_end)
        image = ee.Image(GEEApi.SAR_ALERT+"/"+"alert_"+str(year))

        image = image.select("landclass").clip(self.geometry).toInt16()

        binary_image = image.neq(0).rename(['binary']).multiply(1).toInt16().selfMask()
        
        #ee.Image.pixelArea()
        #multiply 900 (30m * 30m)
        reducer = binary_image.multiply(ee.Image.pixelArea()).reduceRegion(
            reducer= ee.Reducer.sum(),
            geometry= self.geometry,
            crs = 'EPSG:32647', # WGS Zone N 47
            scale= 30,
            maxPixels= 1E20
        )
        #area in squre meter
        stats = reducer.getInfo()['binary']
        #convert to hactare divide by 10000
        areaHA = stats / 10000
     

        colorMap = GEEApi.COLORSARALERT[colorIndex]
        map_id = binary_image.getMapId({
            'min': '0',
            'max': '1',
            'palette': colorMap
        })

        return {
            'total_area': float('%.2f' % areaHA),
            'total_number': 0,
            'eeMapId': str(map_id['mapid']),
            'eeMapURL': str(map_id['tile_fetcher'].url_format),
            'color': colorMap
        }

    # -------------------------------------------------------------------------
    def downloadForestAlert(self, year):
        series_start = str(year) + '-01-01'
        series_end = str(year) + '-12-31'
        GLADIC = ee.ImageCollection(GEEApi.GLAD_ALERT).filterBounds(self.geometry).filterDate(series_start, series_end)
        image = GLADIC.sort('system:time_start', False).first().select("alert").clip(self.geometry).toInt16()
        binary_image = image.neq(0).rename(['binary']).multiply(1).toInt16().selfMask()

        try:
            dnldURL = binary_image.getDownloadURL({
                    'name': 'ForestAlert'+year,
                    'scale': 100,
                    'crs': 'EPSG:4326'
                })
            return {
                'downloadURL': dnldURL,
                'success': 'success'
                }
        except Exception as e:
            return {
                'success': 'not success'
            }
    
    # -------------------------------------------------------------------------
    def downloadSARAlert(self, year):
        image = ee.Image(GEEApi.SAR_ALERT+"/"+"alert_"+str(year))

        image = image.select("landclass").clip(self.geometry).toInt16()

        binary_image = image.neq(0).rename(['binary']).multiply(1).toInt16().selfMask()

        try:
            dnldURL = binary_image.getDownloadURL({
                    'name': 'ForestAlert'+year,
                    'scale': 30,
                    'crs': 'EPSG:4326'
                })
            return {
                'downloadURL': dnldURL,
                'success': 'success'
                }
        except Exception as e:
            return {
                'success': 'not success'
            }


    # -------------------------------------------------------------------------
    def getForestAlert(self, get_image, start_year, end_year, area_type, area_id):

        res = {}
        colorIndex = 0
        for _year in range(start_year, end_year+1):
            series_start = str(_year) + '-01-01'
            series_end = str(_year) + '-12-31'
            colorIndex += 1
            res[str(_year)] = self.calForestAlert(get_image, colorIndex, area_type, area_id, series_start, series_end, _year)
        return res
    
    # -------------------------------------------------------------------------
    def getSARAlert(self, get_image, start_year, end_year, area_type, area_id):

        res = {}
        colorIndex = 0
        for _year in range(start_year, end_year+1):
            series_start = str(_year) + '-01-01'
            series_end = str(_year) + '-12-31'
            colorIndex += 1
            print(_year)
            res[str(_year)] = self.calSARAlert(get_image, colorIndex, area_type, area_id, series_start, series_end, _year)
        return res

    # -------------------------------------------------------------------------
    def calBurnedArea(self, series_start, series_end, year, area_type, area_id):

        IC= GEEApi.BURNED_AREA.filterBounds(self.geometry).sort('system:time_start', False).filterDate(series_start, series_end)

        yearlyBurned = IC.sum().clip(self.geometry).select("BurnDate")
        imgScale =500
        image = yearlyBurned.unitScale(-2000, 10000).reproject(crs='EPSG:4326', scale=imgScale)

        #burned Area Feature collection
        ic = "projects/servir-mekong/Cambodia-Dashboard-tool/BurnArea/"+ area_type +"_"+ str(year) +"Metadata"
        burnedArea_fc = ee.FeatureCollection(ic)

        if area_type == "draw" or area_type == "upload":
            reducer = image.multiply(ee.Image.pixelArea()).reduceRegion(
              reducer= ee.Reducer.sum(),
              geometry= self.geometry,
              scale= imgScale,
              maxPixels= 1E20
            )
            #area in squre meter
            stats = reducer.getInfo()['BurnDate']
            #convert to hactare divide by 10000
            areaHA = stats / 10000

        else:
            if area_type == "country":
                ic = "projects/servir-mekong/Cambodia-Dashboard-tool/BurnArea/camMetadata"
                burnedArea_fc = ee.FeatureCollection(ic)
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('NAME_ENGLI', area_id)).filter(ee.Filter.eq('year', year))
            elif area_type == "province":
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('gid', area_id))
            elif area_type == "district":
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('DIST_CODE', area_id))
            elif area_type == "protected_area":
                ic = "projects/servir-mekong/Cambodia-Dashboard-tool/BurnArea/protected_"+ str(year) +"Metadata"
                burnedArea_fc = ee.FeatureCollection(ic)
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('map_id', area_id))

            areaHA = burnedArea.aggregate_array("areaHect").get(0).getInfo()

        map_id = image.getMapId({
            'min': '-2',
            'max': '1',
            'palette': 'ff0000'
        })

        return {
        'total_area': float('%.2f' % areaHA),
        'eeMapId': str(map_id['mapid']),
        'eeMapURL': str(map_id['tile_fetcher'].url_format),
        'color': 'ff0000'
        }

    # -------------------------------------------------------------------------
    def calFirmBurnedArea(self, series_start, series_end, year, area_type, area_id):
        #burned Area Feature collection
        ic = "projects/servir-mekong/Cambodia-Dashboard-tool/BurnArea/"+ area_type +"_"+ str(year) +"Metadata"
        burnedArea_fc = ee.FeatureCollection(ic)

        IC= GEEApi.FIRMS_BURNED_AREA.filterBounds(self.geometry).sort('system:time_start', False).filterDate(series_start, series_end)
        proj = ee.Projection('EPSG:4326')
        fire = IC.select('T21').max().toInt16().clip(self.geometry)

        #confidance more then 90%
        maskconf = IC.select('confidence').mean().gt(90).toInt16()
        fire = fire.updateMask(maskconf)
        fire = fire.reproject(crs=proj,scale=1000)
        #binary image
        image = fire.neq(0).rename(['binary']).multiply(1).toInt16().selfMask()
        image = image.reproject(crs=proj,scale=1000)

        if area_type == "draw" or area_type == "upload":

            v1 = image.addBands(image).reduceToVectors(
              crs= image.select('binary').projection(),
              scale= 1000,
              geometryType= 'polygon',
              eightConnected= False,
              labelProperty= 'zone',
              reducer= ee.Reducer.sum(),
              maxPixels= 1E15,
              bestEffort = True
            ).filterMetadata("sum","greater_than", 1)


            number_fire = v1.size().getInfo()
            #area in squre meter
            areaSq = number_fire * (1000*1000)
            #convert to hactare divide by 10000
            areaHA = areaSq / 10000

        else:
            if area_type == "country":
                ic = "projects/servir-mekong/Cambodia-Dashboard-tool/BurnArea/camMetadata"
                burnedArea_fc = ee.FeatureCollection(ic)
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('NAME_ENGLI', area_id)).filter(ee.Filter.eq('year', year))
            elif area_type == "province":
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('gid', area_id))
            elif area_type == "district":
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('DIST_CODE', area_id))
            elif area_type == "protected_area":
                ic = "projects/servir-mekong/Cambodia-Dashboard-tool/BurnArea/protected_"+ str(year) +"Metadata"
                burnedArea_fc = ee.FeatureCollection(ic)
                burnedArea = burnedArea_fc.filter(ee.Filter.eq('map_id', area_id))

            areaHA = burnedArea.aggregate_array("areaHect").get(0).getInfo()
            number_fire = burnedArea.aggregate_array("numberFire").get(0).getInfo()

        map_id = image.getMapId({
            'min': '0',
            'max': '1',
            'palette': 'red'
        })

        return {
        'number_fire': int(number_fire),
        'total_area': float('%.2f' % areaHA),
        'eeMapId': str(map_id['mapid']),
        'eeMapURL': str(map_id['tile_fetcher'].url_format),
        'color': 'ff0000'
        }

    # -------------------------------------------------------------------------
    def dowmloadFirmBurnedArea(self, year):
        #burned Area Feature collection
        series_start = str(year) + '-01-01'
        series_end = str(year) + '-12-31'
        IC= GEEApi.FIRMS_BURNED_AREA.filterBounds(self.geometry).sort('system:time_start', False).filterDate(series_start, series_end)
        proj = ee.Projection('EPSG:4326')
        fire = IC.select('T21').max().toInt16().clip(self.geometry)

        #confidance more then 90%
        maskconf = IC.select('confidence').mean().gt(90).toInt16()
        fire = fire.updateMask(maskconf)
        fire = fire.reproject(crs=proj,scale=1000)
        #binary image
        image = fire.neq(0).rename(['binary']).multiply(1).toInt16().selfMask()
        image = image.reproject(crs=proj,scale=1000)

        try:
            dnldURL = image.getDownloadURL({
                    'name': 'BurnedArea'+year,
                    'scale': 1000,
                    'crs': 'EPSG:4326'
                })
            return {
                'downloadURL': dnldURL,
                'success': 'success'
                    }
        except Exception as e:
            return {
                'success': 'not success'
            }

    # -------------------------------------------------------------------------
    def getBurnedArea(self, start_year, end_year, area_type, area_id):
        res = {}
        for _year in range(start_year, end_year+1):
            series_start = str(_year) + '-01-01'
            series_end = str(_year) + '-12-31'
            res[str(_year)] = self.calFirmBurnedArea(series_start, series_end, _year, area_type, area_id)
        return res

    # -------------------------------------------------------------------------
    def get_changeForestGainLoss(self, type, studyLow, studyHigh, refLow, refHigh, tree_canopy_definition, tree_height_definition):
        res = {}
        name = 'forest_cover'
        refLoss = self.forest_loss(get_image = True,
                                 start_year = refLow,
                                 end_year = refHigh,
                                 tree_canopy_definition = tree_canopy_definition,
                                 tree_height_definition = tree_canopy_definition,
                                 )
        studyLoss = self.forest_loss(get_image = True,
                                 start_year = studyLow,
                                 end_year = studyHigh,
                                 tree_canopy_definition = tree_canopy_definition,
                                 tree_height_definition = tree_canopy_definition,
                                 )

        refGain = self.forest_gain(get_image = True,
                                 start_year = refLow,
                                 end_year = refHigh,
                                 tree_canopy_definition = tree_canopy_definition,
                                 tree_height_definition = tree_height_definition
                                 )

        studyGain = self.forest_gain(get_image = True,
                                 start_year = studyLow,
                                 end_year = studyHigh,
                                 tree_canopy_definition = tree_canopy_definition,
                                 tree_height_definition = tree_height_definition
                                 )

        reducerRefLoss = refLoss.gt(0).multiply(ee.Image.pixelArea()).reduceRegion(
            reducer = ee.Reducer.sum(),
            geometry = self.geometry,
            crs = 'EPSG:32647', # WGS Zone N 47
            scale = self.scale,
            maxPixels = 10**15
        )
        reducerStudyLoss = studyLoss.gt(0).multiply(ee.Image.pixelArea()).reduceRegion(
            reducer = ee.Reducer.sum(),
            geometry = self.geometry,
            crs = 'EPSG:32647', # WGS Zone N 47
            scale = self.scale,
            maxPixels = 10**15
        )
        reducerRefGain = refGain.gt(0).multiply(ee.Image.pixelArea()).reduceRegion(
            reducer = ee.Reducer.sum(),
            geometry = self.geometry,
            crs = 'EPSG:32647', # WGS Zone N 47
            scale = self.scale,
            maxPixels = 10**15
        )
        reducerStudyGain = studyGain.gt(0).multiply(ee.Image.pixelArea()).reduceRegion(
            reducer = ee.Reducer.sum(),
            geometry = self.geometry,
            crs = 'EPSG:32647', # WGS Zone N 47
            scale = self.scale,
            maxPixels = 10**15
        )

        statsRefLoss = reducerRefLoss.getInfo()[name]
        statsStudyLoss = reducerStudyLoss.getInfo()[name]
        statsRefGain = reducerRefGain.getInfo()[name]
        statsStudyGain = reducerStudyGain.getInfo()[name]

        # in hectare
        statsRefLoss = statsRefLoss * 0.0001
        statsStydyLoss = statsStudyLoss * 0.0001
        statsRefGain = statsRefGain * 0.0001
        statsStudyGain = statsStudyGain * 0.0001

        res['statsRefLoss'] = float('%.2f' % statsRefLoss)
        res['statsStudyLoss'] = float('%.2f' % statsStydyLoss)
        res['statsRefGain'] = float('%.2f' % statsRefGain)
        res['statsStudyGain'] = float('%.2f' % statsStudyGain)

        try:
            return res
        except Exception as e:
            return {
                'reportError': e.message
            }


    # -------------------------------------------------------------------------
    def calLandcoverArea(self, series_start, series_end, year, area_type, area_id):
        lcImage = ee.Image("projects/cemis-camp/assets/landcover/lcv3/"+str(year)).clip(self.geometry)
        IC= GEEApi.LANDCOVER.filterBounds(self.geometry).sort('system:time_start', False).filterDate(series_start, series_end)
        LANDCOVERCLASSES = [
          {'name':'evergreen' ,'number': 0, 'color': '267300'},
          {'name':'semi-evergreen' ,'number': 1, 'color': '38A800'},
          {'name':'deciduous' ,'number': 2, 'color': '70A800'},
          {'name':'mangrove' ,'number': 3, 'color': '00A884'},
          {'name':'flooded forest' ,'number': 4, 'color': 'B4D79E'},
          {'name':'rubber' ,'number': 5, 'color': 'AAFF00'},
          {'name':'other plantations' ,'number': 6, 'color': 'F5F57A'},
          {'name':'rice' ,'number': 7, 'color': 'FFFFBE'},
          {'name':'cropland' ,'number': 8, 'color': 'FFD37F'},
          {'name':'surface water' ,'number': 9, 'color': '004DA8'},
          {'name':'grassland' ,'number': 10, 'color': 'D7C29E'},
          {'name':'woodshrub' ,'number': 11, 'color': '89CD66'},
          {'name':'built-up area' ,'number': 12, 'color': 'E600A9'},
          {'name':'village' ,'number': 13, 'color': 'A900E6'},
          {'name':'other' ,'number': 14, 'color': '6f6f6f'}
        ]

        INDEX_CLASS = {}
        for _class in LANDCOVERCLASSES:
            INDEX_CLASS[int(_class['number'])] = _class['name']

        classNames = ['evergreen', 'semi-evergreen', 'deciduous', 'mangrove', 'flooded forest','rubber', 'other plantations', 'rice', 'cropland', 'surface water', 'grassland', 'woodshrub', 'built-up area', 'village', 'other'];
        classNumbers = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]
        PALETTE_list = ['267300', '38A800', '70A800', '00A884', 'B4D79E','AAFF00', 'F5F57A', 'FFFFBE', 'FFD37F', '004DA8', 'D7C29E', '89CD66', 'E600A9', 'A900E6', '6f6f6f'];
        AreaClass= {}
        class_areas = ee.Image.pixelArea().addBands(lcImage).reduceRegion(
            reducer= ee.Reducer.sum().group(
              groupField= 1,
              groupName= 'code',
            ),
            geometry= self.geometry,
            scale= 100,  # sample the geometry at 1m intervals
            maxPixels= 1e15
          )

        data = class_areas.getInfo()['groups']
        for item in data:
            #area hetare
            AreaClass[INDEX_CLASS[int(item['code'])]] = float('{0:.2f}'.format(item['sum']/10000))

        lcarea = AreaClass

        map_id = lcImage.getMapId({
            'min': '0',
            'max': str(len(classNames)-1),
            'palette': '267300, 38A800, 70A800, 00A884, B4D79E, AAFF00, F5F57A, FFFFBE, FFD37F, 004DA8, D7C29E, 89CD66, E600A9, A900E6, 6f6f6f'
        })

        return {
            'total_area': lcarea,
            'eeMapId': str(map_id['mapid']),
            'eeMapURL': str(map_id['tile_fetcher'].url_format),
            'color':'267300'
        }

    # -------------------------------------------------------------------------
    def DownloadLandcover(self, year):
        lcImage = ee.Image("projects/cemis-camp/assets/landcover/lcv3/"+str(year)).clip(self.geometry).int()
        try:
            dnldURL = lcImage.getDownloadURL({
                    'name': 'LC'+year,
                    'scale': 100,
                    'crs': 'EPSG:4326'
                })
            return {
                'downloadURL': dnldURL,
                'success': 'success'
            }
        except Exception as e:
            return {
                'success': 'not success'
            }


    # -------------------------------------------------------------------------
    def getLandcoverArea(self, start_year, end_year, area_type, area_id):
        res = {}
        for _year in range(start_year, end_year+1):
            series_start = str(_year) + '-01-01'
            series_end = str(_year) + '-12-31'
            res[str(_year)] = self.calLandcoverArea(series_start, series_end, _year, area_type, area_id)
        return res

    # -------------------------------------------------------------------------
    def checkAvailableData(self, start_year, end_year):

        EVI_IC = ee.ImageCollection('MODIS/006/MYD13A1')
        series_start = str(start_year) + '-01-01'
        series_end = str(end_year) + '-12-31'

        def imgDate(d):
            return ee.Date(d).format("YYYY")

        EVI_dates = ee.List(EVI_IC.filterDate(series_start, series_end).aggregate_array("system:time_start")).map(imgDate).getInfo()
        #LANDCOVER_dates = ee.List(GEEApi.LANDCOVER.filterDate(series_start, series_end).aggregate_array("system:time_start")).map(imgDate).getInfo()
        TREE_CANOPY_dates = ee.List(ee.ImageCollection(GEEApi.TREE_CANOPY).filterDate(series_start, series_end).aggregate_array("system:time_start")).map(imgDate).getInfo()
        TREE_HEIGHT_dates = ee.List(ee.ImageCollection(GEEApi.TREE_HEIGHT).filterDate(series_start, series_end).aggregate_array("system:time_start")).map(imgDate).getInfo()
        GLAD_ALERT_dates = ee.List(ee.ImageCollection(GEEApi.GLAD_ALERT).filterDate(series_start, series_end).aggregate_array("system:time_start")).map(imgDate).getInfo()
        BURNED_AREA_dates = ee.List(ee.ImageCollection(GEEApi.BURNED_AREA).filterDate(series_start, series_end).aggregate_array("system:time_start")).map(imgDate).getInfo()
        LANDCOVER_dates = []

        for _year in range(start_year, end_year+1):
            try:
                lcImage = ee.Image("projects/cemis-camp/assets/landcover/lcv3/"+str(_year)).clip(self.geometry)
                LANDCOVER_dates.append(str(_year))
                #break
            except ValueError:
                print("Oops!  That was no valid number.  Try again...")


        res = {}
        res["evi"] = list(dict.fromkeys(EVI_dates))
        res["landcover"] = LANDCOVER_dates
        res["tcc"] = list(dict.fromkeys(TREE_CANOPY_dates))
        res["tch"] = list(dict.fromkeys(TREE_HEIGHT_dates))
        res["forestalert"] = list(dict.fromkeys(GLAD_ALERT_dates))
        res["burned"] = list(dict.fromkeys(BURNED_AREA_dates))
        return res
