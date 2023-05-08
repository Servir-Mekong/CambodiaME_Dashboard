(function () {
	'use strict';
	angular.module('baseApp')
	.controller('homecontroller', function ($scope, appSettings, $translate, $rootScope) {
        function hideModel() {
            $(".modal").removeClass('show');
            $(".modal").addClass('hide');
        }
        $("#watch-video-button").click(function() {
            hideModel();
            $("#demo-clip-modal").removeClass('hide');
            $("#demo-clip-modal").addClass('show');
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
	});

})();
