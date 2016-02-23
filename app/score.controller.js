/** 
 * app/score.controller.js
 * main controller, calculate all values. 
 * @author: Genesis Guerrero [gengue] <genesisdaft@gmail.com>
 * Tue Feb 23, 2016
 */

'use strict';

angular.module('app')
.controller('ScoreCtrl', function ($scope, ScoreService, $timeout, PageService) {
  $scope.scores = [];
  $scope.historyScores = [];
  $scope.balancedProm = 0;
  $scope.semestralProm = 0;
  $scope.message = '<h6>Injecting Script....</h6>';
  $scope.showForm = false;
  $scope.busy = true;
  $scope.parseInt = parseInt;


  //load content script
  chrome.tabs.executeScript(null, { file: "lib/jquery/jquery-2.1.3.min.js" }, function() {
    chrome.tabs.executeScript(null, {
      file: "content.js"
    }, function() {
      // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        $scope.busy = false;
        $scope.message = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
      }
    });
  });

  /* receives information from the site (content scripts ) history and current scores */
  chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action === "getSource") {
      if(request.scoreSource && request.historySource && request.scoreSource.length){
        if(!request.historySource.length){
          $scope.message = 'No tienes una sesion activa, por favor vuelva \
              a <a href="http://admisiones.unimagdalena.edu.co/mEstudiantes/miNotas.jsp" target="_blank"> \
              iniciar sesion</a> en AYRE.' ;
        } else {
          $scope.historyScores = sanitizeHistoryScores(request.historySource);
          $scope.scores = sanitizeScores(request.scoreSource);
          $scope.balancedProm = calcBalancedProm();
          $scope.semestralProm = calcSemestralProm(); 
          $scope.showForm = true;
          _initWatches();
        }
        $scope.busy = false;
      } else {
        $scope.message = 'No es la pagina de admisiones o no se encuentra en la pagina de notas, <br> \
              por favor ingrese a el <a href="http://admisiones.unimagdalena.edu.co/mEstudiantes/miNotas.jsp" target="_blank"> \
              modulo estudiantil</a>  en el apartado de <b>"mis notas".</b>';
        $scope.busy = false;
      }
      $scope.$apply();
    }     
  });

  /**
   * calculate large average
   *
   * @returns {Number} avg
   */
  var calcBalancedProm = function(){
    var totalSum = 0;  
    var totalCredits = 0; 
    var classes = $scope.historyScores.concat($scope.scores);
    angular.forEach(classes, function(score){
      var localsum = 0;
      if(score["def"]){
        localsum = score.def;
      } else {
        localsum = calcDef(score);
      }
      if(localsum >= 300){
        totalSum += localsum * score.credits; 
        totalCredits += score.credits;
      }
    });
    if(totalCredits == 0){
      return "No hay creditos." 
    }
    return Math.round(totalSum/totalCredits);
  }

  /**
   * calculate semestral average
   *
   * @returns {Number} avg
   */
  var calcSemestralProm = function(){
    console.log($scope.scores);
    var totalSum = 0; 
    var totalCredits = 0; 
    angular.forEach($scope.scores, function(score){
      var localsum = calcDef(score);
      totalSum += localsum * score.credits; 
      totalCredits += score.credits;
    });
    if(totalCredits == 0){
      return "No hay creditos." 
    }
    return Math.round(totalSum/totalCredits);
  }

  /**
   * calculate definitive score
   *
   * @param {object} item score detail object
   * @returns {Number} definitive score
   */
  var calcDef = function(item){
    var def = 0;
    def = item.n1 + item.n2 + item.n3;
    if(item.hab){
      if(def >= 300){
        item.hab = null; 
      } else {
        def = Math.round(def * 0.30) + Math.round(item.hab * 0.70); 
      }
    }
    return def;
  }

  /**
   * transform score array for easy handle
   *
   * @param {array} scores score list
   * @returns {array} new array formatted
   */
  var sanitizeHistoryScores = function(scores){
    var arr = scores.filter(function(item){
      return item.classname != 'Asignatura' && 
             item.id.substr(0, 7) !== 'Periodo' && 
             item.id.substr(0, 8) !== 'Promedio';
    }).map(function(item){
      item.def = item.def != 'A' ? parseInt(item.def) : 500; 
      item.credits = parseInt(item.credits);  
      return item;
    }); 
    return arr;
  }

  /**
   * find the score from history and add the number of credits
   *
   * @param {object} score score object
   * @returns {Number} credits (-1 if not found)
   */
  var addCreditsToScore = function(score){
    for(var i=0; i<$scope.historyScores.length; i++){
      if($scope.historyScores[i].id == score.id){
        var val = parseInt($scope.historyScores[i].credits);
        $scope.historyScores.splice(i, 1);
        return val; 
      }
    } 
    return -1;
  };

  /**
   * transform array for easy handle
   *
   * @param {array} scores score array
   * @returns {array} new array
   */
  var sanitizeScores = function(scores){
    return scores.map(function(item){
      item.n1 = item.n1 != '-' ? parseInt(item.n1) : 0; 
      item.n2 = item.n2 != '-' ? parseInt(item.n2) : 0; 
      item.n3 = item.n3 != '-' ? parseInt(item.n3) : 0; 
      item.hab = item.hab != '-' ? parseInt(item.hab) : null; 
      item.credits = addCreditsToScore(item); //map credits from historyScores
      item.def = calcDef(item);
      return item;
    }); 
  }

  /*
   * calculate all definitives scores
   */
  var calcAlldef = function(){
    angular.forEach($scope.scores, function(item){
      item.def = calcDef(item); 
    }); 
  }

  /*
   * init watches
   */
  var _initWatches = function(){
    $scope.$watch('scores', function(oldValue, newValue){
      $scope.semestralProm = calcSemestralProm(); 
      $scope.balancedProm = calcBalancedProm();
      calcAlldef();
      return newValue;
    }, true);
  };

});
