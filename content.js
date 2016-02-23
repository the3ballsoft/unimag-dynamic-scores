/** 
 * content.js
 * content script file
 * @author: Genesis Guerrero [gengue] <genesisdaft@gmail.com>
 * Tue Feb 23, 2016
 */

/* dom variables */
var _scoreTbl = null; 
var _historyTbl= null;

/*
 * checks if a valid domain and retrieve all info
 */
function init(){
  if (location.host === "admisiones.unimagdalena.edu.co" 
      && location.pathname === "/mEstudiantes/miNotas.jsp") {
    _scoreTbl = scoresTableToArray();
    $.ajax({
      method: 'GET',
      url: '/mEstudiantes/miSabana.jsp',
      success: function(res){
        var tempDom = $('<output>').append($.parseHTML(res));
        _historyTbl = historyTableToArray(tempDom);
        sendMessage();
      }
    });
  } else {
    sendMessage();
  }
}

/*
 *send message to popup app
 */
function sendMessage(){
  chrome.runtime.sendMessage({
    action: "getSource",
    scoreSource: _scoreTbl,
    historySource: _historyTbl
  });
}


/**
 * parse jquery table element to array of objects
 *
 * @returns {array} score objects
 */
function scoresTableToArray(){
  var arr =  $('table.tbhorario tr').map(function(i, v) {
    var $td =  $('td', this);
    return {
      id: $td.eq(0).text(),
      classname: $td.eq(1).text(),
      n1: $td.eq(2).text(),
      n2: $td.eq(3).text(),               
      n3: $td.eq(4).text(),               
      hab: $td.eq(5).text()               
    }
  }).get();
  arr.splice(0,1);
  return arr;
}

/**
 * parse jquery table element to array of objects
 *
 * @param {object} DOM temp DOM
 * @returns {array} history score objects
 */
function historyTableToArray(DOM){
  var arr = $('table.tbSabana tr:has(td)', DOM).map(function(i, v) {
    var $td =  $('td', this);
    return {
      id: $td.eq(0).text(),
      classname: $td.eq(1).text(),
      def : $td.eq(2).text(),
      credits : $td.eq(3).text(),               
      reg : $td.eq(4).text()               
    }
  }).get();
  return arr;
}

//run
init();



