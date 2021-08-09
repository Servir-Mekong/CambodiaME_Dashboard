"""cambodiaDashboard URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from __future__ import absolute_import, print_function, unicode_literals
from cms.sitemaps import CMSSitemap
from django.contrib import admin
from django.urls import path
from django.contrib.sitemaps.views import sitemap
from django.conf.urls import include, url
from django.views.static import serve
from django.views.generic import TemplateView
from mapclient import api as mapclient_api
from django.conf import settings
admin.autodiscover()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name="home.html")),
    path('map/', TemplateView.as_view(template_name="map.html")),
    url('api/mapclient/$', mapclient_api.api),

]
if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)