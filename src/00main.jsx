/* *************************************************************************
 *  00main.jsx
 *  DESCRIPTION: Файл сборки приложения DialogBuilder
 *  @@@BUILDINFO@@@ 00main.jsx 1.20.2 Sun Jun 01 2014 20:15:56 GMT+0300
 * 
 * NOTICE: 
 * 
/* *************************************************************************
 * © Вячеслав aka SlavaBuck, 08.02.2014. slava.boyko#hotmail.com
 */
//#targetengine "session"
//#targetengine "DialogBuilder"

// startmode - если true(1) - Главное окно имеет тип palette, в противном случае dialog
(function main(startmode) {
    #include "01globals.jsx"
    #include "02application.jsx"
    #include "03document.jsx"
    #include "04initControls.jsx"
    #include "05processingOptions.jsx"
    
    //var tm = new _timer(); tm.start();
    var app = new BuilderApplication((startmode ? "dialog" : "palette" ));
    app.run();
    //tm.stop(); log("Время запуска:", tm); 
    
}((typeof startmode == 'undefined' ? 1 : startmode)));