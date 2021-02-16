#!/bin/bash

source /home/ubuntu/dashboard_env/bin/activate
cd /home/ubuntu/CambodiaME_Dashboard
git reset --hard HEAD
git pull
python manage.py collectstatic
sudo service supervisor restart
sudo service nginx restart
