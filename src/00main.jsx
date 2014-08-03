/* *************************************************************************
 *  00main.jsx
 *  DESCRIPTION: Файл сборки приложения DialogBuilder
 *  @@@BUILDINFO@@@ 00main.jsx 1.80 Sat Aug 02 2014 21:23:03 GMT+0300
 * 
 * NOTICE: 
 * 
/* *************************************************************************
 * © Вячеслав aka SlavaBuck, 08.02.2014. slava.boyko#hotmail.com
 */
//#targetengine "session"
//#targetengine "DialogBuilder"

// debugmode - если true (отладочный запуск) - Главное окно имеет тип palette, в противном случае dialog
(function main(debugmode) {
    #include "01globals.jsx"
    #include "02application.jsx"
    #include "03document.jsx"
    #include "04initControls.jsx"
    #include "05processingOptions.jsx"
    #include "06uiModel.jsx"
    #include "07uiView.jsx"
    #include "08customControllers.jsx"
    
    trace.echo = debugmode; // Вывод отладочной информации в консль только для отладочных запусков
    var app = new BuilderApplication((debugmode ? "palette" : "dialog" ));
    app.run();
    
}((typeof debugmode == 'undefined' ? 0 : debugmode)));