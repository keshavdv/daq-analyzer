app.controller('ParseController', ['$scope', function($scope) {
    
    $scope.inputs = [
      {name:'Analog Input 1'},
      {name:'Analog Input 2'},
      {name:'Analog Input 3'},
      {name:'Analog Input 4'},
      {name:'Analog Input 5'},
      {name:'Analog Input 6'},
      {name:'Analog Input 7'},
      {name:'Analog Input 8'},
      {name:'Analog Input 9'},
      {name:'Analog Input 10'},
      {name:'Analog Input 11'},
      {name:'Analog Input 12'},
      {name:'Analog Input 1'},
      {name:'Analog Input 2'},
      {name:'Analog Input 3'},
      {name:'Analog Input 4'},
      {name:'Analog Input 5'},
      {name:'Analog Input 6'},
      {name:'Analog Input 7'},
      {name:'Analog Input 8'},
      {name:'Analog Input 9'},
      {name:'Analog Input 10'},
      {name:'Analog Input 11'},
      {name:'Analog Input 12'}]
 	
 	$scope.selectedIndex = 0;
	$scope.itemClicked = function ($index) {
	    $scope.selectedIndex = $index;
  	};

}]);