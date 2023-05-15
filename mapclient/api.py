# -*- coding: utf-8 -*-

from celery.result import AsyncResult
from mapclient.core import GEEApi
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
import time

@csrf_exempt
@require_POST
def api(request):
    post = json.loads(request.body).get
    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-line-lc-rice', 'get-line-lc-rubber', 'get-line-evi', 'get-pie-evi', 'get-evi-map', 'get-stats', 'get-forestgainloss', 
        'get-forest-extent-map', 'get-forest-gain-map', 'get-forest-loss-map', 'get-forest-alert', 'get-sar-alert', 'get-burned-area', 
        'get-changeforestgainloss', 'get-landcover', 'get-landcover-rice', 'get-landcover-rubber', 'check-date', 'download-evi-map', 'download-landcover', 'download-landcover-rice', 'download-burned-area', 
        'download-forest-alert', 'download-sar-alert', 'download-forest-extent-map']
        if action in public_methods:
            shape = post('shape', '')
            geom = post('polygon_id', '')
            area_path = post('areaSelectFrom', '')
            area_name = post('areaName', '')
            polygon_id=post('polygon_id', '')
            area_type=post('area_type', '')
            area_id=post('area_id', '')
            refLow=post('refLow', '')
            refHigh= post('refHigh', '')
            studyLow= post('studyLow', '')
            studyHigh=post('studyHigh', '')
            start_year = post('startYear', '')
            end_year = post('endYear', '')
            year = post('year', '')
            type = post('type', '')
            tree_canopy_definition = post('treeCanopyDefinition', 10) # in percentage
            tree_height_definition = post('treeHeightDefinition', 5) # in meters
            get_image = post('get_image', False)
            download  = post('download', '')

            core = GEEApi(area_path, area_name, geom, area_type, area_id)
            if action == 'get-line-evi':
                data = core.GetPolygonTimeSeries(refLow, refHigh, studyLow, studyHigh)
            elif action == 'get-pie-evi':
                data = core.calcPie(refLow, refHigh, studyLow, studyHigh)
            elif action == 'get-evi-map':
                data = core.getEVIMap(refLow, refHigh, studyLow, studyHigh)
            elif action == 'download-evi-map':
                data = core.downloadEVIMap(refLow, refHigh, studyLow, studyHigh)
            elif action == 'get-stats':
                data = core.get_stats(type, year, start_year, end_year, tree_canopy_definition, tree_height_definition)
            elif action == 'get-forestgainloss':
                data = core.get_forestGainLoss(type, year, start_year, end_year, tree_canopy_definition, tree_height_definition)
            elif action == 'get-forest-extent-map':
                data = core.get_mapid(type, start_year, end_year, tree_canopy_definition, tree_height_definition, area_type, area_id)
            elif action == 'get-forest-gain-map':
                data = core.forest_gain(False, start_year, end_year, tree_canopy_definition, tree_height_definition, download)
            elif action == 'get-forest-loss-map':
                data = core.forest_loss(False, start_year, end_year, tree_canopy_definition, tree_height_definition, download)
            elif action == 'get-forest-alert':
                data = core.getForestAlert(get_image, start_year, end_year, area_type, area_id)
            elif action == 'get-sar-alert':
                data = core.getSARAlert(get_image, start_year, end_year, area_type, area_id)
            elif action == 'get-burned-area':
                data = core.getBurnedArea(start_year, end_year, area_type, area_id)
            elif action == 'get-changeforestgainloss':
                data = core.get_changeForestGainLoss(type, studyLow, studyHigh, refLow, refHigh, tree_canopy_definition, tree_height_definition)
            elif action == 'get-landcover':
                data = core.getLandcoverArea(start_year, end_year, area_type, area_id)
            elif action == 'get-landcover-rice':
                data = core.getLandcoverRiceArea(start_year, end_year, area_type, area_id)
            elif action == 'get-line-lc-rice':
                data = core.getLCRiceTimeSeriesLine(start_year, end_year, area_type, area_id)
            elif action == 'get-line-lc-rubber':
                data = core.getLCRubberTimeSeriesLine(start_year, end_year, area_type, area_id)
            elif action == 'get-landcover-rubber':
                data = core.getLandcoverRubberArea(start_year, end_year, area_type, area_id)
            elif action == 'check-date':
                data = core.checkAvailableData(start_year, end_year)
            elif action == 'get-evi-map':
                data = core.getEVIMap(refLow, refHigh, studyLow, studyHigh)
            elif action == 'download-landcover':
                data = core.DownloadLandcover(year)
            elif action == 'download-landcover-rice':
                data = core.DownloadLandcoverRice(year)
            elif action == 'download-burned-area':
                data = core.dowmloadFirmBurnedArea(year)
            elif action == 'download-forest-alert':
                data = core.downloadForestAlert(year)
            elif action == 'download-forest-extent-map':
                data = core.downloadForestMap(year, end_year)
            elif action == 'download-sar-alert':
                data = core.downloadSARAlert(year)

            return JsonResponse(data, safe=False)
