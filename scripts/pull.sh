#!/bin/bash

source /home/ubuntu/dashboard_env/bin/activate
cd /home/ubuntu/CambodiaME_Dashboard
git reset --hard HEAD
git pull
python manage.py collectstatic
sudo systemctl restart emperor.uwsgi.service
sudo service nginx restart
