#!/bin/bash

source /home/ubuntu/dashboard_env/bin/activate
cd /home/ubuntu/CambodiaME_Dashboard
git reset --hard HEAD
git pull
gulp build
python manage.py collectstatic
sudo systemctl restart supervisor
sudo service nginx restart
