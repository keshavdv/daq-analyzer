app = angular.module('analyzeApp', ['ngRoute', 'ui.sortable', 'angular-dygraphs', 'nsPopover']).run(['$rootScope', function($rootScope){
	var gui = require('nw.gui');
	var mb = new gui.Menu({type:"menubar"});
	  var win = gui.Window.get();
			if(process.platform == "darwin") mb.createMacBuiltin("");
	  
	  var file = new gui.Menu();
	  file.append(new gui.MenuItem({
	      label: 'Open...',
	      key: 'o',
	      modifiers: 'cmd',
	      click : function () {
	        alert('Action 1 Clicked');
	      }
	  }));

	  file.append(new gui.MenuItem({
	      label: 'Save As...',
	      key: 's',
	      modifiers: 'cmd',
	      click : function () {
	        alert('Action 2 Clicked');
	      }
	  }));

	  mb.insert(new gui.MenuItem({
	      label: 'File',
	      submenu: file
	  }), 1);

	win.menu = mb;

	var menu = new gui.Menu();
	menu.append(new gui.MenuItem({ label: 'Collapse All' }));
	menu.append(new gui.MenuItem({ label: 'Expand All' }));

	document.body.addEventListener('contextmenu', function(ev) { 
	  ev.preventDefault();
	  menu.popup(ev.x, ev.y);
	  return false;
	});
}]);

app.controller('AppController', ['$scope', 'bridge', function($scope, bridge) {
    
    $scope.inputs = [];
    
    $scope.testdata = [{x: 1, y: 2},{x: 2, y: 3},{x: 4, y: 4},{x: 5, y: 2},{x: 6, y: 2}];
    $scope.data = {};
    $scope.graph = {
            data: [
            ],
            options: {
            	axes: {
            		x: {drawAxis: false},
            		y: {drawAxis: false}
            	},
                labels: ["x", "A"]
            }
        }

    var device_handle;
    $scope.configuration = {};
    $scope.connected = false;
    $scope.connect = function() {
    	bridge.createRemoteBridge().connect(function(handle) {
    		device_handle = handle;
    		handle.on('connect', function(configuration) {
    			console.log('Found device: ' + configuration.model);
    			$scope.configuration = configuration;
    			$scope.device = configuration.model;
    			$scope.inputs = configuration.sensors;
    			configuration.sensors.forEach(function(v) {
    				$scope.data[v.id] = {
			            values: []
					};;
    			})
    			$scope.connected = true;
    			$scope.$apply();
    		});

    		handle.on('update', function(update){
				// console.log("Received update " + update.timestamp);
				update.messages.forEach(function(v) {
					$scope.data[v.id].values.push([update.timestamp,v.value]);
				})
				$scope.$apply();
    		})

    		handle.on('configuration', function(config){
				config.sensors.forEach(function(v) {
					$scope.inputs.forEach(function(i) {
						if (i.id == v.id) {
							i.enabled = v.enabled;
							i.frequency = v.frequency;
						}
					})
				})
				$scope.$apply();
    		})

    		handle.on('close', function(message){
    			device_handle = null;
				$scope.started = false;
				$scope.connected = false;
    			$scope.$apply();
    		})
    	});
    };

    $scope.start = function() {
    	// Reset graphs
    	for (var k in $scope.data){
		    if ($scope.data.hasOwnProperty(k)) {
		    	$scope.data[k] = {
								options: {
					            	axes: {
					            		x: {drawAxis: false},
					            		y: {drawAxis: false, drawGrid: false}
					            	},
					                labels: ["x", "A"]
					            },
					            values: []
							};
		    }
		}
    	device_handle.start();
		$scope.started = true;
    }

	$scope.stop = function() {
    	device_handle.stop();
		$scope.started = false;
    }

    $scope.disconnect = function () {
    	device_handle.disconnect();
    	device_handle = null;
		$scope.started = false;
		$scope.connected = false;
    }

    $scope.enableInput = function (input) {
		device_handle.set(input.id, {id: input.id, enabled: true, frequency: 100});
		input.enabled = true;
    }

    $scope.disableInput = function (input) {
		device_handle.set(input.id, {id: input.id, enabled: false, frequency: 100});
		input.enabled = false;
    }

    $scope.sortableOptions = {
	    handle: '.input-drag',
	    axis: 'y'
  	};

}]);



app.directive('rickshawChart', function () {
      return {
        scope: {
          data: '=',
        },
        template: '<div></div>',
        restrict: 'E',
        link: function postLink(scope, element, attrs) {
          scope.$watchCollection('[data, renderer]', function(newVal, oldVal){
            if(!newVal[0]){
              return;
            }

            element[0].innerHTML = '';

            var graph = new Rickshaw.Graph({
              element: element[0],
              width: $(element).parent().width(),
		   	  height: 100,
		   	  // series: [{color: attrs.color, data: scope.data }],
              series: new Rickshaw.Series.FixedDuration([{name: 'input', color: attrs.color, data: scope.data }], undefined, {
					timeInterval: 30,
					maxDataPoints: 10,
					timeBase: 1
				}),
              renderer: attrs.renderer
            });

			$(window).on('resize', function(){
			  graph.configure({
			    width: $(element).parent().width(),
			    height: 100
			  });
			  graph.render();
			});

			var updates = 0;
			scope.$watch('data', function(newValue, oldValue) {
				updates++;
				if (updates > 10) {
					console.log('in');
					graph.series[0].data = scope.data;
			        graph.update();
					updates = 0;
				}
			}, true);

            graph.render();
          });
        }
      };
});


app.directive('chart', function () {
      return {
        scope: {
          data: '=',
        },
        template: '<div></div>',
        restrict: 'E',
        link: function postLink(scope, element, attrs) {
          scope.$watchCollection('[data, renderer]', function(newVal, oldVal){
            if(!newVal[0]){
              return;
            }

            element[0].innerHTML = '';

              var data = [];
		      var t = new Date();
		      for (var i = 10; i >= 0; i--) {
		        var x = new Date(t.getTime() - i * 1000);
		        data.push([x, Math.random()]);
		      }

		      var g = new Dygraph(element[0], data,
                  {
                  	colors: [attrs.color],
                  	// height: 100,
                  	// width: $(element).parent().width(),
                  	axes : { x: { drawAxis: false} },
                    drawPoints: true,
                    gridLineColor: 'red',
                    drawGrid: false,
                    labels: ['Time', 'Random']
                  });
		      
		      window.intervalId = setInterval(function() {
		        var x = new Date();  // current time
		        var y = Math.random();
		        data.push([x, y]);
		        g.updateOptions( { 'file': data } );
		      }, 1);
          });
        }
      };
});