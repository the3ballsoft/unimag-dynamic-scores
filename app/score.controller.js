'use strict';

angular.module('app')
.controller('ScoreCtrl', function ($scope, ScoreService, $timeout, PageService) {
  $scope.scores = [];
  $scope.historyScores = [];
  $scope.message = '<h4>Injecting Script....</h4>';
  $scope.showForm = false;
  $scope.parseInt = parseInt;


  //load content script
  chrome.tabs.executeScript(null, { file: "lib/jquery/jquery-2.1.3.min.js" }, function() {
    chrome.tabs.executeScript(null, {
      file: "content.js"
    }, function() {
      // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        $scope.message = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
      }
    });
  });

  chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action === "getSource") {
      if(request.scoreSource && request.historySource && request.scoreSource.length){
        $scope.historyScores = sanitizeHistoryScores(request.historySource);
        $scope.scores = sanitizeScores(request.scoreSource);
        $scope.showForm = true;
        console.log($scope.scores);
        console.log($scope.historyScores);
      }
    } else {
      $scope.message = 'No es la pagina de admisiones o no se encuentra en la pagina de notas, <br> por favor ingrese a el \
      <a href="http://admisiones.unimagdalena.edu.co/mEstudiantes/miNotas.jsp" target="_blank"> \
      modulo estudiantil</a>  en el apartado de <b>"mis notas".</b>';
    }
    $scope.$apply();
  });

  $scope.calcProm = function(){
    var totalSum = 0; 
    var totalCredits = 0; 
    for(var i=0; i<$scope.scores.length; i++){
      var localsum = $scope.scores[i].n1 + $scope.scores[i].n2 + $scope.scores[i].n3;
      totalSum += localsum * $scope.scores[i].credits; 
      totalCredits += $scope.scores[i].credits;
    }
    if(totalCredits == 0){
      return "No hay creditos." 
    }
    return parseInt(totalSum/totalCredits);
  }

  var sanitizeHistoryScores = function(scores){
    var arr = scores.filter(function(item){
      return item.classname != 'Asignatura' && 
             item.id.substr(0, 7) !== 'Periodo' && 
             item.id.substr(0, 8) !== 'Promedio';
    }); 
    return arr;
  }

  var addCreditsToScore = function(score){
    for(var i=0; i<$scope.historyScores.length; i++){
      if($scope.historyScores[i].id == score.id){
        return parseInt($scope.historyScores[i].credits);
      }
    } 
    return false;
  };

  var sanitizeScores = function(scores){
    return scores.map(function(item){
      item.n1 = item.n1 != '-' ? parseInt(item.n1) : 0; 
      item.n2 = item.n2 != '-' ? parseInt(item.n2) : 0; 
      item.n3 = item.n3 != '-' ? parseInt(item.n3) : 0; 
      item.credits = addCreditsToScore(item); //map credits from historyScores
      return item;
    }); 
  }
});
