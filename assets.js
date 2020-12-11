'use strict';

module.exports = {
    client: {
        css: [
            'cambodiaDashboard/static/css/*.css',
        ],
        js: [
            'cambodiaDashboard/static/app/*.js',
            'cambodiaDashboard/static/app/**/*.js'
        ],
        views: [
            'cambodiaDashboard/templates/*.html',
            'cambodiaDashboard/templates/**/*.html',
        ],
        templates: ['static/templates.js']
    },
    server: {
        gulpConfig: ['gulpfile.js']
    }
};
