﻿/* *************************************************************************
 *  00main.jsx
 *  DESCRIPTION: Файл сборки приложения DialogBuilder
 *  @@@BUILDINFO@@@ 00main.jsx 1.90 Fri Aug 22 2014 18:22:43 GMT+0300
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
    #include "09initMainWindow.jsx"
    try {
        trace.echo = debugmode; // Вывод отладочной информации в консль только для отладочных запусков
        MVC.fastmode = true;    // Включение быстрого режима обработки коллекций
        var app = new BuilderApplication((debugmode ? "palette" : "dialog" ));
        app.run();
    } catch(e) { trace(e) };
}((typeof debugmode == 'undefined' ? 0 : debugmode)));