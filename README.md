## The steps are meant to turn a generic Ubuntu box into an Django server hosting the M&E Dashboard with PostgreSQL, Nginx, Gunicorn, Virtualenv and supervisor

A dashboard to monitor, evaluate and report landscape improvements in Cambodia

### Update system
```sh
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get clean
```

### Install Admin Tools
```sh
sudo apt-get -y install unzip psmisc mlocate telnet lrzsz vim rcconf htop p7zip dos2unix curl
sudo apt-get clean
sudo apt-get -y install gcc
sudo apt-get clean
sudo apt-get -y install build-essential libssl-dev libffi-dev libxml2-dev libxslt1-dev
sudo apt-get clean
sudo apt-get -y install libtiff5-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev tcl8.6-dev tk8.6-dev python-tk
sudo apt-get clean
```

### Git
```sh
sudo apt-get -y install git-core
sudo apt-get clean
```

### Install Python 3.6
```sh
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install python3.6
```

### Install Python Virtual Environment
```sh
sudo apt-get install python3-venv
sudo apt-get install python3-virtualenv

sudo apt-get clean
```

### Now create a virtual env for the web application
```sh
cd /home/ubuntu
virtualenv --python=python3.6 dashboard_env
```

### Workon the virtual env we just created
```sh
source /home/ubuntu/dashboard_env/bin/activate
```

### Install Python and environment
```sh
sudo apt-get -y install python-dev
sudo apt-get clean
sudo apt-get -y install python-pip
sudo apt-get -y install python-pillow
sudo apt-get clean
```

### Download the source code from git
```sh
env GIT_SSL_NO_VERIFY=true git clone https://github.com/Servir-Mekong/CambodiaME_Dashboard.git CambodiaME_Dashboard
cd CambodiaME_Dashboard/
```

### Install dependencies from the requirements.txt
```sh
pip install -r requirements.txt
```

### Copy the settings.example.py in the cambodiaDashboard and rename it as settings.py
##### Make changes in the settings
1. Enter your EE_ACCOUNT
2. ALLOWED_URL
3. Make a folder named credentials in the project path and copy client_secret.json and privatekey.json
4. Define GEE asset ID

### Verify the server is running by
```sh
python manage.py runserver 0.0.0.0:8000
# To end Ctrl + C
```

### Now migrate the database
```sh
python manage.py migrate
```

### Install application server
```sh
pip install gunicorn
```

### Check if gunicorn is running well by
```sh
gunicorn cambodiaDashboard.wsgi:application --bind 0.0.0.0:8001
```

### Now make sh (or bash) script called outside from project to automate with gunicorn
```sh
cd ..
nano gunicorn_cambodiaDashboard.sh
```
##### Edit according to your environment
```sh
#!/bin/bash

NAME="cambodiaDashboard"                                   # Name of the application
DJANGODIR=/home/ubuntu/CambodiaME_Dashboard             # Django project directory
SOCKFILE=/home/ubuntu/dashboard_env/run/gunicorn.sock # we will communicte using this unix socket
USER=ubuntu                                           # the user to run as
GROUP=ubuntu                                          # the group to run as
NUM_WORKERS=4                                         # how many worker processes should Gunicorn spawn;                                               # usually is NUM_OF_CPU * 2 + 1
DJANGO_SETTINGS_MODULE=cambodiaDashboard.settings          # which settings file should Django use
DJANGO_WSGI_MODULE=cambodiaDashboard.wsgi                  # WSGI module name
TIMEOUT=6000
echo "Starting $NAME as `whoami`"

# Activate the virtual environment

cd $DJANGODIR
source /home/ubuntu/dashboard_env/bin/activate
export DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE
export PYTHONPATH=$DJANGODIR:$PYTHONPATH

# Create the run directory if it doesn't exist

RUNDIR=$(dirname $SOCKFILE)
test -d $RUNDIR || mkdir -p $RUNDIR

# Start your Django Unicorn
# Programs meant to be run under supervisor should not daemonize themselves (do not use --daemon)

exec gunicorn ${DJANGO_WSGI_MODULE}:application \
  --name $NAME \
  --workers $NUM_WORKERS \
  --user=$USER --group=$GROUP \
  --timeout $TIMEOUT \
  --bind=unix:$SOCKFILE \
  --log-level=debug \
  --log-file=-

```

### Now make this script executable
```sh
sudo chmod u+x gunicorn_cambodiaDashboard.sh
```

### Now install supervisor
```sh
sudo apt-get -y install supervisor
```

### Now create a supervisor conf file for the project
```sh
sudo nano /etc/supervisor/conf.d/cambodiaDashboard.conf
```

##### And add the following bash script
```sh
[program:cambodiaDashboard]
command = /home/ubuntu/gunicorn_cambodiaDashboard.sh ; Command to start app
user = ubuntu                                         ; User to run as
stdout_logfile = /home/ubuntu/logs/cambodiaDashboard_supervisor.log ; Where to $
redirect_stderr = true                                ; Save stderr in the same$
environment=LANG=en_US.UTF-8,LC_ALL=en_US.UTF-8       ; Set UTF-8 as default en$
```

### Now create the required files and folder
```sh
mkdir -p /home/ubuntu/logs/
touch /home/ubuntu/logs/cambodiaDashboard_supervisor.log
```

### Make supervisor reread configuration files

#### Check your Ubuntu version
```sh
lsb_release -a
```

##### For ubuntu 14.04
```sh
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start cambodiaDashboard
```

##### For ubuntu 16.04
```sh
sudo systemctl restart supervisor
sudo systemctl enable supervisor
```

#### Check status of supervisor
```sh
sudo supervisorctl status cambodiaDashboard
```

### Install nginx
```sh
sudo apt-get -y install nginx
```

### Make a conf file for nginx
```sh
sudo nano /etc/nginx/sites-available/cambodiaDashboard.conf
```
##### Then add the following script to the conf file
```sh
upstream cambodiadashboard_server {
  # fail_timeout=0 means we always retry an upstream even if it failed
  # to return a good HTTP response (in case the Unicorn master nukes a
  # single worker for timing out).
  server unix:/home/ubuntu/dashboard_env/run/gunicorn.sock fail_timeout=0;
}

server {
    server_name me-dashboard-servir.adpc.net;

    client_max_body_size 4G;

    keepalive_timeout 0;
    sendfile on;

    access_log /home/ubuntu/logs/nginx-access.log;
    error_log /home/ubuntu/logs/nginx-error.log;

    location /static/ {
        alias   /home/ubuntu/CambodiaME_Dashboard/static/;
    }

    location / {

        # an HTTP header important enough to have its own Wikipedia entry:
        #   http://en.wikipedia.org/wiki/X-Forwarded-For
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;


        # enable this if and only if you use HTTPS, this helps Rack
        # set the proper protocol for doing redirects:
        # proxy_set_header X-Forwarded-Proto https;

        # pass the Host: header from the client right along so redirects
        # can be set properly within the Rack application
        proxy_set_header Host $http_host;

        proxy_read_timeout 60000;
        proxy_connect_timeout 60000;
        proxy_send_timeout 60000;
        send_timeout 60000;

        # we don't want nginx trying to do something clever with
        # redirects, we set the Host: header above already.
        proxy_redirect off;

        # set "proxy_buffering off" *only* for Rainbows! when doing
        # Comet/long-poll stuff.  It's also safe to set if you're
        # using only serving fast clients with Unicorn + nginx.
        # Otherwise you _want_ nginx to buffer responses to slow
        # clients, really.
        # proxy_buffering off;

        # Try to serve static files from nginx, no point in making an
        # *application* server like Unicorn/Rainbows! serve static files.
        if (!-f $request_filename) {
            proxy_pass http://cambodiadashboard_server;
            break;
          }
  }

  # Error pages
  error_page 500 502 503 504 /500.html;
  location = /500.html {
      root /home/ubuntu/CambodiaME_Dashboard/static/;
  }
}

```

### Make a soft link to the nginx conf
```sh
sudo ln -s /etc/nginx/sites-available/cambodiaDashboard.conf /etc/nginx/sites-enabled/cambodiaDashboard.conf
```

### You can delete the default soft link in the sites-enabled as
```sh
sudo rm /etc/nginx/sites-enabled/default
```

### start the nginx service
```sh
sudo service nginx start
```

### Sometimes ngnix might not work, so consider restarting the service as well
```sh
sudo service nginx restart
```

### see the status of the nginx service
```sh
sudo service nginx status
```

`NB: make sure the application, script and services have necessary permission to run`
### You can change permissions as
`sudo chown -R -v your-user /your-folder`
