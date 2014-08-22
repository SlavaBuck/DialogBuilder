/**************************************************************************
 *  02application.jsx
 *  DESCRIPTION: Настройки, специфические для текущей платформы (CC|CS)
 *  @@@BUILDINFO@@@ 10platformSpecific.jsx !Version! Thu Aug 07 2014 03:04:31 GMT+0300
 * 
 * NOTICE: 
 * 
/**************************************************************************
 * © Вячеслав aka SlavaBuck, 10.02.2014.  slava.boyko#hotmail.com
 */

// возвращает true для Adobe InDesign СС;
function isCC() {
    if ($.global.app && $.global.app.name == "Adobe InDesign")
        return parseInt($.global.app.version.charAt(0)) > 8;
    // Определяем косвенно - по наличию папки 'AppData/Adobe/InDesign/Version X.X'
    var indFolder = Folder(Folder.appData + "/Adobe/InDesign"),
        indFile = indFolder.getFiles("Version ?.*")[0],
        indVersion = parseInt(File.decode(indFile.name).split(" ")[1]);
    return indVersion > 8;
};