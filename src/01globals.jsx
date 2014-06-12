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

var COLORSTYLES = {
    CS: {
        backgroundColor:0xF0F0F0,
        foregroundColor:0x000000,
        disabledBackgroundColor:0xF4F4F4,
        disabledForegroundColor:0x6D6D6D
    },
    CC: {
        backgroundColor:0xD6D6D6,
        foregroundColor:0x000000,
        disabledBackgroundColor:0xD9D9D9,   // проверить и исправить для CC!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        disabledForegroundColor:0x6D6D6D    // проверить и исправить для CC!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
};

var DEFOPTIONS = {
    locale:'',                      // '' - язык интерфейса по умолчанию '' - локаль системы (Примеры: "ru" || "en" ...)
    appcolors:'CS',            // doccolors = appcolors
    doccolors:'',
    jsname:'',                   // способ сокращённого наименования эл.управления Возможные значения '' - определяются в файле controls.jsxinc, 'user' - задаются настройками из
                                     // файла options.jsxinc, 'full' или 'small' - предустановленные способы наименования см. JSNAMES
    jsnames: {
        myDialog:'myDialog'
    },
    highlightColor:0xF0B8F0, // соответствует прозрачно-розовому - [0.94, 0.72, 0.94, 0.5],
    doc:{
        dialogtype:'dialog'  // тип окна по умолчанию для создаваемого документа (dialog || palette || window)
    }
};
var w = new Window('window');

const _PSOLID     = w.graphics.PenType.SOLID_COLOR;     // Константа ScriptUI == 0
const _PTHEME    = w.graphics.PenType.THEME_COLOR;     // Константа ScriptUI == 1    
const _BSOLID     = w.graphics.BrushType.SOLID_COLOR;    // Константа ScriptUI == 0
const _BTHEME    = w.graphics.BrushType.THEME_COLOR;    // Константа ScriptUI == 1
const _REGULAR  = ScriptUI.FontStyle.REGULAR;     // == 0
const _BOLD        = ScriptUI.FontStyle.BOLD;           // == 1
const _ITALIC      = ScriptUI.FontStyle.ITALIC;         // == 2
const _BITALIC    = ScriptUI.FontStyle.BOLDITALIC;  // == 3

// Элементы управления (помимо контэнеров), поддерживающие свойство backgroundColor
var BKGCONTROLS = { 'edittext':0, 'dropdownList':0, 'listbox':0, 'separator':0 }
// Все элементы управления, поддерживающие свойство backgroundColor
var ALLBKGCONTROLS = { 'panel':0, 'group':0, 'dialog':0, 'palette':0, 'edittext':0, 'dropdownList':0, 'listbox':0, 'window':0, 'tab':0, 'tabbedpanel':0, 'separator':0 }

// Шрифт диалога по умолчанию
var _FONT = {
    family:(w.graphics.font.family === "Segoe UI" ? "Segoe Ui" : w.graphics.font.family),
    style:w.graphics.font.style,
    size:w.graphics.font.size
};

// Шрифты по умолчанию
var DEFFONTS = [
    'dialog',
    'Arial',
    'Calibri',
    'Georgia',
    'Helvetica',
//    'Lucida Grande':0,
    'Tahoma',
    'Verdana'
]

// Сокращённые наименования объектов диалога в документах
var JSNAMES = {
    full: {
        myDialog:"myDialog",
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
        myDialog:"w",
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



