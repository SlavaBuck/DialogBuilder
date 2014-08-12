/**************************************************************************
 *  01globals.jsx
 *  DESCRIPTION: Цвета и ресурсы
 *  @@@BUILDINFO@@@ 01globals.jsx 1.50 Tue Jun 10 2014 02:00:29 GMT+0300
 * 
 * NOTICE: 
 * 
/**************************************************************************
 * © Вячеслав aka SlavaBuck, 13.02.2014.  slava.boyko#hotmail.com
 */

// Список доступных языков (Требуется чтобы соответствовало строкам в locales.jsxinc)
var UILANGUAGES = [
    {text:'Auto', value:""},
    {text:'English', value:"en" },
    {text:'Russian', value:"ru" }
];

// Список целевых платформ
var UITARGETS = [
    {text:'Auto', value:""},
    {text:'CS - Adobe Creative Suite', value:"CS" },
    {text:'CC - Adobe Creative Cloud', value:"CC" }
];

// true если запущено под Adobe InDesign СС (в противном случае - false, в том числе и под ESTK CC);
const CC_FLAG = (function isCC() {
    if ($.global.app && $.global.app.name.match(/Adobe InDesign/)) return parseInt($.global.app.version.charAt(0)) > 8;
    return false;
//~     // Определяем косвенно - по наличию папки 'AppData/Adobe/InDesign/Version X.X'
//~     var indFolder = Folder(Folder.appData + "/Adobe/InDesign"),
//~         indFile = indFolder.getFiles("Version ?.*")[0],
//~         indVersion = parseInt(File.decode(indFile.name).split(" ")[1]);
//~     return indVersion > 8;
}());

// Current Platform:
var CP = CC_FLAG ? {
        target:"CC",
        CLICK:"mousedown"
    } : {
        target:"CS",
        CLICK:"click"
    };

// Цветовые наборы по умолчанию для соответствующих платформ
var COLORSTYLES = {
    CS: {
        backgroundColor:0xF0F0F0,
        foregroundColor:0x000000,
        disabledBackgroundColor:0xF4F4F4,
        disabledForegroundColor:0x6D6D6D
    },
    CC: {
        backgroundColor:0x494949,
        foregroundColor:0xE0E0E0,
        disabledBackgroundColor:0x494949,
        disabledForegroundColor:0x8A8A8A
    }
};

/* Цвета для платформы CC
Для EditText:
        backgroundColor:0xA2A2A2,
        foregroundColor:0x000000,
        disabledBackgroundColor:0x888888,
        disabledForegroundColor:0x333333
Для ListBox:
        backgroundColor:0x494949,
        foregroundColor:0xE0E0E0,
        disabledBackgroundColor:0x494949,
        disabledForegroundColor:0x333333
*/

// цвет рабочей области документов:
var DOCVIEWCOLOR = {
    CS:0x808080, // 50% серого
    CC:0x202020  // почти чёрный
}

var DEFOPTIONS = {
    locale:'',             // язык интерфейса (по умолчанию '' - текущая локаль системы). Примеры: "ru" || "en" ...
    target:'',             // целевая платформа 'CS' || 'CC' || '' (Auto - определяется флагом CC_FLAG)
    autofocus:false,       // авто-переключение фокуса на добавляемый контейнер
    dialogtype:'dialog',   // тип окна по умолчанию для создаваемого документа (dialog || palette || window)
    appcolors:'',          // цветовой набор оформления главного окна по умолчанию
    doccolors:'',          // doccolors = appcolors 
    jsname:'full',         // способ наименования эл.управления Возможные значения 'user' - задаются настройками из jsnames:{}
                           // 'full' или 'small' - предустановленные способы наименования см. JSNAMES
    highlightColor:0xF0B8F0,   // соответствует прозрачно-розовому - [0.94, 0.72, 0.94, 0.5]
};
var w = new Window('window');

const _PSOLID   = w.graphics.PenType.SOLID_COLOR;   // Константа ScriptUI == 0
const _PTHEME   = w.graphics.PenType.THEME_COLOR;   // Константа ScriptUI == 1    
const _BSOLID   = w.graphics.BrushType.SOLID_COLOR; // Константа ScriptUI == 0
const _BTHEME   = w.graphics.BrushType.THEME_COLOR; // Константа ScriptUI == 1
const _REGULAR  = ScriptUI.FontStyle.REGULAR;       // == 0
const _BOLD     = ScriptUI.FontStyle.BOLD;          // == 1
const _ITALIC   = ScriptUI.FontStyle.ITALIC;        // == 2
const _BITALIC  = ScriptUI.FontStyle.BOLDITALIC;    // == 3

// Шрифт диалога по умолчанию
var _FONT = {
    family:(w.graphics.font.family === "Segoe UI" ? "Segoe Ui" : w.graphics.font.family),
    style:w.graphics.font.style,
    size:w.graphics.font.size
};

// Шрифты по умолчанию (Общие для Win & Mac)
var DEFFONTS = [
    'dialog',
    'Arial',
    'Calibri',
    'Courier',
    'Helvetica',    
    'Georgia',
    'Impact',
    'Tahoma',
    'Times',
    'Verdana'
];

// Сокращённые наименования объектов диалога в документах
var JSNAMES = {
    full: {
        Window:"myDialog",
        Panel:"pPanel",
        Group:"gGroup",
        TabbedPanel:"tPanel",
        Tab:"tTab",
        StaticText:"stText",
        EditText:"eText",
        Button:"btButton",
        IconButton:"ibtButton",
        Slider:"slSlider",
        Separator:"sp",
        Checkbox:"chBox",
        RadioButton:"rBox",
        ListBox:"lstBox",
        DropDownList:"ddList",
        TreeView:"treeView",
        Image:"imgImage",
        Scrollbar:"scrBar",
        Progressbar:"pBar"
    },
    small: {
        Window:"w",
        Panel:"p",
        Group:"g",
        TabbedPanel:"tp",
        Tab:"t",
        StaticText:"st",
        EditText:"et",
        Button:"bt",
        IconButton:"ibt",
        Slider:"sl",
        Separator:"sp",
        Checkbox:"ch",
        RadioButton:"rb",
        ListBox:"lb",
        DropDownList:"dd",
        TreeView:"tree",
        Image:"img",
        Scrollbar:"scr",
        Progressbar:"pb"
    }
};