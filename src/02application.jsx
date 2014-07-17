/**************************************************************************
 *  02application.jsx
 *  DESCRIPTION: BuilderApplication: Основной класс приложения 
 *  @@@BUILDINFO@@@ 02application.jsx 1.65 Tue Jul 15 2014 16:11:42 GMT+0300
 * 
 * NOTICE: 
 * 
/**************************************************************************
 * © Вячеслав aka SlavaBuck, 10.02.2014.  slava.boyko#hotmail.com
 */
// #includepath нужно настроить на папку с библиотеками
#includepath "../../Include/"
#include "MVC.DOM.jsx"
#include "SimpleUI.jsx"
#include "PNGLib.jsx"

function BuilderApplication (wtype) { // wtype = dialog || palette
    if (!(this instanceof BuilderApplication)) return new BuilderApplication(wtype);
    var app = this,
        wtype = (wtype) || "dialog";
    BuilderApplication.prototype.__super__.constructor.call(this, {
    name:"Dialog Builder",
    version:"1.65",
    caption:"1.65 Dialog Builder (build 0715, MVC v"+MVC.version+", MVC.DOM v"+MVC.DOM.version+", SimpleUI v"+SUI.version+")",
    view:wtype + "{spacing:2, margins:[5,5,5,5], orientation:'column', alignChildren:'top', properties:{resizeable: true, closeButton:true, maximizeButton:true }, \
                      pCaption:Panel { margins:[0,1,5,1], spacing:2,alignment:['fill','top'], orientation:'row'}, \
                      pMain:Panel { margins:[0,0,0,0], spacing:0, alignment:['fill','fill'], orientation:'row', \
                                           LeftPnl:Panel { margins:[0,0,0,0], spacing:2, alignment:['left','fill'], alignChildren:['Left','top'], orientation:'column' }, \
                                           MainPnl:Panel { preferredSize:[450,300], margins:[0,0,0,0], spacing:2, alignment:['fill','fill'], orientation:'column', properties:{borderStyle:'sunken'} }, \
                                           sp:"+SUI.Separator+"\
                                           RightPnl:Panel { margins:[0,0,0,0], spacing:2, alignment:['right','fill'], orientation:'column' } }, \
                      pBottom:Panel { margins:[0,2,0,4], spacing:0, alignment:['fill','bottom'], orientation:'column', properties:{borderStyle:'etched'}, \
                                              pTabs:Group { margins:[4,0,4,0], spacing:4, alignment:['fill','top'], orientation:'row', alignChildren:['fill','fill'] } }, \
                      pStatusBar:Group { margins:[4,4,4,0], spacing:4, alignment:['fill','bottom'], orientation:'row' } \
                 }"
    });
    app.vname = app.name + " v" + app.version;
    app.activeControl = null;   // Ссылка на модель текущий (добавляемый) элемент в контейнер документа
    app.enabledTabs = true;     // Флаг, разрешающий обновление панелей свойств (используется в doc.load())

    // Настройка главного окна:
    SUI.SeparatorInit(app.window.pMain.sp);
    var gfx = app.window.pMain.MainPnl.graphics;
    gfx.disabledBackgroundColor = gfx.backgroundColor = gfx.newBrush(0, [0.5, 0.5, 0.5, 1]); // цвет области документов - серый 50%    
    app._editors = new Collection();  // общий список всех въюшек свойств формируемых в app.buildTabs (для быстрого блокирования/разблокирования в app.updateTabs);
    app._ceditors = new Collection(); // отдельный список въюшек для редактирования свойств цвета
    app._ieditors = new Collection(); // отдельный список въюшек для отображающих имена для изображений
};

inherit (BuilderApplication, MVCApplication);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Инициализация интерфейса и моделей
BuilderApplication.prototype.Init = function() {
    // Настройка папок приложения
    this.appFolder = File.decode(File($.fileName).parent.absoluteURI +'/');
    this.resFolder = (this.appFolder.match(/Required/) ?  this.appFolder : this.appFolder + "Required/");
    $.localize = true;
    
    // Настройка локальных ссылок
    var app = this,
        w = app.window,
        controllers = app.controllers,
        models = app.models,
        views = app.views,
        title = app.version +" " + app.name + ": " + localize({ru:"Загрузка...", en:"Loading..."});
    app.pBar = SUI.ProgressBar(title);
    app.pBar.reset(title, 22);

    app.pBar.hit(localize({ ru:"Загрузка настроек...", en:"Loading settings..."}));
    app.processingOptions();

    app.pBar.hit(localize({ ru:"Загрузка ресурсов...", en:"Loading resources..."}));
    app.loadResources();    // app.LStr получает локализованные строки
    app.initJsNames();
    // hashControls содержит соответствие типов hashControls["tabbedpanel"] = "TabbedPanel", ...
    app.hashControls = {};
    each(app.uiControls, function(ctrl, key) { app.hashControls[key.toLowerCase()] = ctrl.label; });
    app.hashControls['dialog'] = app.hashControls['palette'] = app.hashControls['window'] = "Window";
    
    // Формирование представлений для главного окна и контейнера документов (docView)
    app.pBar.hit(localize(app.LStr.uiApp[36]));
    app.buildCaption(w.pCaption);               // id:"Caption"
    app.pBar.hit(localize(app.LStr.uiApp[37]));
    app.buildControlsBtns(w.pMain.LeftPnl, 2);  // id:"Controls"
    app.pBar.hit(localize(app.LStr.uiApp[38]));
    app.buildTreeView(w.pMain.RightPnl);        // id:"Tree"
    app.buildDocsView(w.pMain.MainPnl);         // id:"Documents" - Общий View-контейнер для всех документов
    app.pBar.hit(localize(app.LStr.uiApp[39]));
    app.buildTabs(w.pBottom.pTabs);             // id:"Tab"
    app.pBar.hit(localize(app.LStr.uiApp[40]));
    app.buildSettingsWindow();                  // Окно для управления настройками app.settingsWindow
    app.pBar.hit(localize(app.LStr.uiApp[41]));
    app.buldStatusBar(w.pStatusBar);            // id:"SBar"
    app.treeView = app.getViewByID("Tree");     // создан в buildDialogTree
    app.JsName = app.getViewByID("JsName");     // создан в buildDocsView 
    // Инициализация списков (цветовых наборов, шрифтов и картинок)
    app.initControls()
    
    // Завершение настройки
    app.pBar.hit(localize(app.LStr.uiApp[45]));
    
    // Регестрируем фабрику документов
    app.registerDocumentFactory(); // app.getViewByID("Documents")
    var docsView = app.documentsView.control; // инициализируется в app.documentsView()
    
    // Обеспечивает переключение указателя активного документа при клике на табе
    docsView.onChange = function() { 
        app.activeDocument = (this.selection ? app.getDocumentByName(this.selection.text) : null);
    };
    // Нужно для переключение поля JsName на свойство jsname активного документа при клике на уже активной вкладке (когда событие onChange не генерируется)
    docsView.addEventListener ('click', function(e) { 
        if (app.activeDocument && e.target === this) { // e.target.type == 'tabbedpanel'
            // переключаемся либо на объект документа, либо на активный объект в документе
            app.activeControl = (app.activeDocument.activeControl ? app.getModelByID(app.activeDocument.activeControl.id) : app.getModelByID(app.activeDocument.id)); 
        }
    }); 

    // Обеспечивает переинициализацию поля редактирования имени переменной и вкладок свойств
    app.watch ('activeControl', function(key, oldVal, newVal) {
        if (!newVal) { app.JsName.unbind(); app.JsName.control.enabled = false; } else {
            app.JsName.control.enabled = true;
            if (newVal.hasOwnProperty('document')) app.JsName.rebind(newVal, 'text', 'document.jsname'); else app.JsName.rebind(newVal, 'text', 'control.jsname'); 
        }
        app.updateTabs(newVal); // при null - всё отвяжеться
        return newVal;
    });

    // Обеспечивает переключение табов при смене активного документа
    app.watch ('activeDocument', function(key, oldVal, newVal) {
        if (!newVal) { app.activeControl = null; app.window.text = app.caption; } else {
            docsView.selection = newVal.window; // переключаемся на добавленный tab
            var doc = app.getModelByID(newVal.id);
            app.window.text = app.version + " " + app.name + " - " + (doc.document.name[0] == '*' ? doc.document.name.slice(1) : doc.document.name);
            if (newVal.activeControl)  app.activeControl = app.getModelByID(newVal.activeControl.id); else app.activeControl = doc;
        };
        app.treeView.refreshItems(newVal);
        return newVal;
    });

    // Обеспечивает  в реальном времени обновление текста в дереве при редактировании имени переменной в поле JsName
    app.JsName.control.addEventListener("keyup", function (kb) {
        app.treeView.control.activeItem.text = this.text;
    });
    app.pBar.close();
} // app.Init()

// ===================
// Загрузка графических ресурсов, локализованных строк и метаданных объектов пользовательского графического интерфейса
BuilderApplication.prototype.loadResources = function() {
    var app = this,  msg = "",
        bodyOfScriptFile = "",
        // упреждающее определение ресурсной строки из locales.jsxinc
        LStr = { uiErr:[{ 
                ru:"Критичиская ошибка. Файл %1 не найден", 
                en:"Critical error. File %1 not found"
        }]};

    // Загрузка локализованных строк
    bodyOfScriptFile = _getBodyOfRequreFile("locales.jsxinc");
    try { app.LStr = eval(bodyOfScriptFile); } catch(e) { app.terminate(e, "loadResources: Critical error!"); }
    var msg = "loadResources: " + localize(LStr.uiErr[7]);
    
    // Загрузка пиктограмм 
    bodyOfScriptFile = _getBodyOfRequreFile("_resources.jsxinc");
    try { eval(bodyOfScriptFile); } catch(e) { app.terminate(e, msg); }
    app.resources = appresources;
    
    // Загрузка основных метаданных
    bodyOfScriptFile = _getBodyOfRequreFile("controls.jsxinc");
    try { eval(bodyOfScriptFile); } catch(e) { app.terminate(e, msg); }
    app.uiCategories = uiCategories;
    app.uiProperties = uiProperties;
    app.uiControls = uiControls;

    // пиктограммы для ускорения создания списков с цветами:
    app.resources._listIcons_ = { '_inFonts':[], '_inControls':[] };

    // вспомогательные функции:
    function _getBodyOfRequreFile(name) {
        var f = new File(app.resFolder + name),
            str = "";
        if (!f.exists) app.terminate(null, "loadResources: " + localize(LStr.uiErr[0], name));
        f.open("r"); str = f.read(); f.close();
        return str;
    };
};

// ===================
// Инициализация наименований объектов диалога (могут переопределяться в опциях)
//
BuilderApplication.prototype.initJsNames = function() {
    // Предполагается что опции и ресурсы уже загружены и корректно подготовлены
    var app = this,
        opt = app.options,
        shema = opt.jsname,
        controls = app.uiControls;
    if (JSNAMES.hasOwnProperty(shema)) {
        for (var p in controls) if (controls.hasOwnProperty(p)) controls[p].jsname = JSNAMES[shema][p];
    } else if (shema == "user" && opt.jsnames) {
        for (var p in opt.jsnames) if (controls.hasOwnProperty(p)) controls[p].jsname = opt.jsnames[p];
    };
};

// Строим заголовок
BuilderApplication.prototype.buildCaption = function(cont) {
    var app = this,
           //dir = app.resFolder + "/icons/",
           img = app.resources.images,
           uiApp = app.LStr.uiApp,
           stl = "toolbutton",
           g = cont.add("group { alignment:['fill', 'top'], spacing:0 }");
    // Кнопки в верхней панели:
    var btNew = g.add("iconbutton { label:'new', helpTip:'"+uiApp[6]+"', enabled:true, properties:{style:'"+stl+"', toggle:false }}");
        btNew.image =  img.btNew;
    var btOpen = g.add("iconbutton { label:'open', helpTip:'"+uiApp[7]+"', enabled:true, properties:{style:'"+stl+"', toggle:false }}");
        btOpen.image =  img.btOpen;
    var btSave = g.add("iconbutton { label:'save', helpTip:'"+uiApp[9]+"', enabled:false, properties:{style:'"+stl+"', toggle:false }}");
        btSave.image = img.btSave;
    var btSaveAs = g.add("iconbutton { label:'saveAs', helpTip:'"+uiApp[16]+"', enabled:false, properties:{style:'"+stl+"', toggle:false }}");
        btSaveAs.image = img.btSaveAs;
    var btClose = g.add("iconbutton { label:'close', helpTip:'"+uiApp[8]+"', enabled:false, properties:{style:'"+stl+"', toggle:false }}");
        btClose.image = img.btClose;
    var btSettings = g.add("iconbutton { label:'settings', helpTip:'"+uiApp[10]+"', enabled:true, properties:{style:'"+stl+"', toggle:false }}");
        btSettings.image = img.btSettings
    var sp = g.add(SUI.Separator);
        SUI.SeparatorInit(sp, 'line', 2);
    var btEval = g.add("iconbutton { label:'eval', helpTip:'"+uiApp[14]+"', enabled:false, properties:{style:'"+stl+"', toggle:false }}");
        btEval.image = img.btEval;
    var btCode = g.add("iconbutton { label:'code', helpTip:'"+uiApp[15]+"', enabled:false, properties:{style:'"+stl+"', toggle:false }}");
        btCode.image = img.btCode;
    var btOpenIn = g.add("iconbutton { label:'openIn', helpTip:'"+uiApp[17]+"', enabled:false, properties:{style:'"+stl+"', toggle:false }}");
        btOpenIn.image = img.btOpenIn;
        sp = g.add(SUI.Separator);
        SUI.SeparatorInit(sp, 'line', 2);
    var grp = g.add("group { margins:[2,0,2,0], spacing:1, alignment:['left', 'fill'], alignChildren:['left', 'center'], orientation:'column', \
                             st:StaticText { text:'"+uiApp[20]+"' }, g:Group { spacing:1 }}");
        grp.st.graphics.font = ScriptUI.newFont("dialog:8.5");
        
    app.btBOLD = grp.g.bBOLD = grp.g.add("iconbutton { label:"+_BOLD+", preferredSize:[23,23], properties:{style:'button', toggle:true }}"); // Кнопка управления BOLD
    app.btBOLD.image = img.bBOLD;
    app.btITALIC = grp.g.bITALIC = grp.g.add("iconbutton { label:"+_ITALIC+", preferredSize:[23,23], properties:{style:'button', toggle:true }}"); // Кнопка управления ITALIC
    app.btITALIC.image = img.bITALIC;
    app.fontStyle = new MVC.View("fontStyle", grp.g);
    app.views.add(app.fontStyle);
    sp = g.add(SUI.Separator);
    SUI.SeparatorInit(sp, 'line', 2);
        // Группа управления стилем шрифта
        grp = g.add("Group {  margins:[2,0,2,0], spacing:0, alignChildren:['left', 'center'], orientation:'column',   \
                        g1:Group { spacing:2, \
                            st:StaticText {text:'"+uiApp[21]+"', characters:6},  \
                            dd:DropDownList {preferredSize:['90', '18']},  \
                            et:EditText {preferredSize:['38', '18']}},  \
                        g2:Group { spacing:2, \
                            st:StaticText {text:'"+uiApp[22]+"', characters:6},  \
                            dd:DropDownList { preferredSize:['90', '18']}, \
                            bt:IconButton {helpTip:'"+uiApp[23]+"', preferredSize:[38,20], properties:{style:'button', toggle:false }}}}");
        grp.g1.et.graphics.font = ScriptUI.newFont("dialog-bold:11");
        grp.g1.st.graphics.font = grp.g2.st.graphics.font = ScriptUI.newFont("dialog:10");
        grp.g1.dd.graphics.font = ScriptUI.newFont("dialog-bold:9");
        grp.g2.dd.graphics.font = ScriptUI.newFont("dialog-bold:8.5");
    app.btClearFont = grp.g2.bt;
    app.btClearFont.image = img.bCancel;
    app.fontName = new MVC.View("fontName", grp.g1.dd); // View для управления именем шрифта текста
    app.views.add(app.fontName); app._editors.add(app.fontName);
    app.fontSize = new MVC.View("fontSize", grp.g1.et); // View для управления размером текста
    app.views.add(app.fontSize); app._editors.add(app.fontSize);    
    app.fontColor = new MVC.View("fontColor", grp.g2.dd); // View для управления цветом текста
    app.fontColor.control.__key = 'foregroundColor';
    app.views.add(app.fontColor); app._editors.add(app.fontColor); 
    app._ceditors.add(app.fontColor);

        sp = cont.add(SUI.Separator);
        SUI.SeparatorInit(sp, 'line', 2);
    var btInfo = cont.add("iconbutton { label:'about', helpTip:'"+uiApp[11]+"', preferredSize:[32, 32], alignment:['right', 'fill'], properties:{style:'"+stl+"', toggle:false }}");
        btInfo.image = img.btInfo;          

    // Обработка кликов по кнопкам-меню:
    cont.addEventListener("click", function (e) {
        var _enableButtons = function() { btClose.enabled = btSave.enabled = btSaveAs.enabled = btCode.enabled = btEval.enabled = btOpenIn.enabled = true; }
        var _disableButtons = function() { btClose.enabled = btSave.enabled = btSaveAs.enabled = btCode.enabled = btEval.enabled = btOpenIn.enabled = false; }
        if (e.target.type == 'iconbutton') {
            switch (e.target.label) {
                case "new":     app.addDocument(); _enableButtons();         break;
                case "open":    if (app.openDocument()) _enableButtons();    break; // возвращает activeDocument, если загрузка удачная
                case "close":   if (!app.closeDocument()) _disableButtons(); break; // возвращает activeDocument, null - если всё закрыто.
                case "openIn":  app.openInESTK();       break;
                case "save":    app.saveDocument();     break;
                case "saveAs":  app.saveAsDocument();   break;
                case "settings":app.showSettings();     break;
                case "eval":    app.evalDialog();       break;
                case "code":    app.showCode();         break;
                case "about":   app.about();            break;
                default:
            }
        }
    });  

    // Формирование объекта View
    return app.views.add(new MVC.View("Caption", cont));
};

// ===================
// Строим дерево
BuilderApplication.prototype.buildTreeView = function(cont) {
    // Получаем локальные ссылки
    var app = this,
           //dir = app.resFolder + "/icons/",
           img = app.resources.images,
           LStr = app.LStr;
    // Дерево контролов
    var tree = app.addView({
        id:"Tree",
        parent:cont,
        view:"treeview { alignment:['fill','fill']}",
        Init:function() { this.preferredSize[0] = 140; },
        selectItem:function(model) { // model - объект model в области видимости Document (doc.activeControl)
            var tree = this.control;
            tree.activeItem = tree.findItem (model, 'model');
            tree.selectItem(tree.activeItem); 
            tree.activeNode = (tree.activeItem.type == 'node') ? tree.activeItem : tree.activeItem.parent;
        },
        refreshItems:function(doc) { // Обновление текущего представление данными диалога текущего документа
            // Функция полного обновления дерева элементов, вызывается при смене активного документа (передаётся через doc так как вызов проис-
            // ходит из обработчика watch и до конца выполнения данной функции указатель activeDocument указывает на старое значение и обновиться 
            // он только после выхода из данной функции);
            var tree = this.control;
            tree.activeNode = tree.activeItem = null;
            tree.removeAll();
            if (!doc || doc.window.children.length == 0) return;
            //delete tree['onChange']; // временно заглушаем! 
            (function _buildTree(node, doc, cont) {
                var model = doc.findController(cont).model,
                       item = node.add("node", model.control.jsname),
                       _item = null;
                item.model = model;
                for (var i=0; i<cont.children.length; i++) {
                    if (SUI.isContainer(cont.children[i]) && !cont.children[i].isSeparator) _buildTree(item, doc, cont.children[i]); else {
                        model = doc.findController(cont.children[i]).model;
                        _item = item.add("item", model.control.jsname);
                        _item.model = model;
                    }
                }
            }(tree, doc, doc.window.children[0]));
            // upd: Были проблемы с doc.activeControl!!!
            try {
            app.treeView.selectItem(doc.activeControl);
            if (tree.activeItem.type == "node") tree.activeNode = tree.activeItem; else tree.activeNode = tree.activeItem.parent;
            doc.activeContainer = tree.activeNode.model.view.control;
            } catch(e) { trace(e, "refreshItems:" ) }
        },
        addItem:function(item) { // Вызывается из doc.addItem()
            var tree = this.control, 
                type = (item.control.type == 'Container') ? "node" : "item";
            if (tree.activeNode == null) {
                tree.activeNode = tree.activeItem = tree.add( type, item.control.jsname );
            } else {
                tree.activeItem = tree.activeNode.add( type, item.control.jsname );
            }
            tree.activeItem.model = item;
            tree.selectItem(tree.activeItem);
            tree.active = true;
        },
        removeItem:function(item) {
            if (item && item.parent) item.parent.remove(item);
        },
        swapItems:function(direction) { // "Up" || "Down" Вызывается нажатием кнопок Up, Down 
            // функция будет производит перемещение активного элемента
            // ...
        },
        control:{
            activeItem:null, // Соответствует doc.activeControl
            activeNode:null, // Соответствует doc.activeContainer
            onChanging:false,
            onChange:false,
            selectItem:function (item) { // Выделение объекта ListItem в дереве с разворачиванием всей родительской цепочки ветвей, содержащих элемент
                var node = item;
                while (node.parent) { node.parent.expanded = true; node = node.parent; } // предварительно развернём все родительские группы
                this.selection = item;
            },
            findItem:function(item, prop) {
                // Функция поиска укзанных данных в дереве. Поиск производиться по всей глубине ветвей дерева. Возвращает первый обнаруженный 
                // объект ListItem (указатель на него) либо null если соответствие отсутствует.
                // item - любой объект данных, который требуется найти в дереве; prop - свойство объекта ListItem по которому будет происходить сравнение
                // с искомым аргументом item.
                var prop = (prop)||'text',
                      cursor = this.items[0], 
                      res = null;
                res = (function _find(item, cursor, prop) {
                    var res = null; 
                    if (cursor[prop] === item) return cursor;
                    for (var i=0; i<cursor.items.length; i++) {
                        if(cursor.items[i].type == 'node') res = _find(item, cursor.items[i], prop); else {
                            if (cursor.items[i][prop] === item) res = cursor.items[i];
                        }
                        if (res) break;
                    }
                    return res;
                })(item, cursor, prop); // _find
                return res;
            }
        }
    });
    // Группа с кнопками управления контролами (под деревом элементов)
    var g = cont.add("group { margins:[1,4,1,4], spacing:5, alignment:['fill','bottom'] }" ),
           st = "button", sz = [24,24],           
           bt = g.add("iconbutton", undefined, img.btDel, {style:st, toggle:false});
    bt.label = "Del"; bt.alignment = ['left','bottom']; bt.helpTip = LStr.uiApp[2]; bt.preferredSize = sz;
    bt = g.add("iconbutton", undefined, img.btUp, {style:st, toggle:false});
    bt.label = "Up"; bt.alignment = ['right','bottom']; bt.helpTip = LStr.uiApp[3]; bt.preferredSize = sz;
    bt = g.add("iconbutton", undefined, img.btDown, {style:st, toggle:false});
    bt.label = "Down"; bt.alignment = ['right','bottom']; bt.helpTip = LStr.uiApp[4]; bt.preferredSize = sz;
    // Обработка кликов по кнопкам:
    g.addEventListener ("click", function (e) {
        var doc = app.activeDocument;
        if (doc && e.target.type == 'iconbutton') {
            if (e.target.label == 'Del' && doc.activeControl && doc.activeControl.view.item != "Window") return doc.removeItem(doc.activeControl);
            if (e.target.label == 'Up') return doc.swapItem(doc.activeControl, 'Up');       // пока не реализовано
            if (e.target.label == 'Down') return doc.swapItem(doc.activeControl, 'Down');   // пока не реализовано
        }
    });
    tree.control.addEventListener ("click", function (e) { // onChange для дерева
        // При клике по дереву переустнавливаются все активные указатели как в самом дереве (this.activeNode & this.activeItem), так и в документе
        // (doc.activeContainer & doc.activeControl), что также приведёт к автоматической переустановке указателя приложения app.activeControl и
        // переустановки всех полей редактирования свойств.
        var sel = this.selection,
              doc = app.activeDocument;
         if (sel) {
            this.activeItem = sel;
            if (sel.model !== doc.activeControl) doc.activeControl = sel.model;
            if (doc.activeControl.control.type == "Container") this.activeNode = this.activeItem; else this.activeNode = this.activeItem.parent;
            doc.activeContainer = this.activeNode.model.view.control;
            if (e.detail == 2) app.showModelCode(this.activeItem.model);
            //if (e.detail == 2) this.activeItem.model.getCode();
        }              
    });

    return app.views.add(tree);
};

// =================== 
// Строим панель кнопок (Добавляем кнопки исходя из содержимого controls.jsxinc -> uiControls)
BuilderApplication.prototype.buildControlsBtns = function(cont, columns) {
    // Получаем локальные ссылки
    var app = this,
        uiControls = app.uiControls,
        img = app.resources.images,
        prop, i, j, max, jmax,
        ctrls_arr = [],          // Все элементы
        grps_arr = [],           // Группы по типам элементов
        columns = (columns)||2;  // Кол-во кнопок в строке, в левой панели кнопок
    // Формируем массивы контролов и групп
    for (prop in uiControls) {
        if (uiControls.hasOwnProperty(prop)) {
            ctrls_arr.push(prop);
            if (grps_arr.toString().indexOf(uiControls[prop].type) == -1) grps_arr.push(uiControls[prop].type);
        }
    }
    var btns = {};
    // Формируем хеш из групп с массивами входящих в них контролов btns.группа.[контролы]
    for (i=0, max=grps_arr.length; i<max; i++) {
        btns[grps_arr[i]] = [];
        for (prop in uiControls)
            if (uiControls.hasOwnProperty(prop) && uiControls[prop].type == grps_arr[i] && prop != 'Window') btns[grps_arr[i]].push(uiControls[prop]);
    }
    // Добавляем контролы в Панель с группировкой по группам
    var grpRes = "group {text:'', margins:[0,0,0,0], spacing:0, alignChildren:['Left','top'], orientation:'row' }",
        grp = null, sp = null, bt = null;
    for (prop in btns) {
        if (!btns.hasOwnProperty(prop)) continue;
        sp = cont.add(SUI.Separator); 
        SUI.SeparatorInit(sp, 'line', 5);
        SUI.SeparatorInit(sp.line, 'line', 2);sp.line.visible = true;
        // в пределах группы группируем по колонкам
        for (i in btns[prop]) {
            if (! (i%columns)) grp = cont.add(grpRes);
            bt = grp.add("iconbutton", undefined,  img[btns[prop][i].icon], {style: "button", toggle:false}); 
            bt.helpTip = btns[prop][i].description;
            bt.label = btns[prop][i].label; // метка кнопки соответствует названию элемента управления
        }
    }
    // Обработка кликов по контролам:
    cont.addEventListener ("click", function (e) {
        if (e.target.type == 'iconbutton' && app.activeDocument) app.activeDocument.addItem(e.target.label);
    });
    // Формирование объекта View
    return app.views.add(new MVC.View("Controls", cont));
};

// =================== 
// Строим панель вкладок Properties
BuilderApplication.prototype.buildTabs = function(cont) {
    // Получаем локальные ссылки
    var app = this,
        uiCategories = this.uiCategories,
        uiProperties = this.uiProperties,
        uiControls = this.uiControls,
        controllers = this.controllers,
        models = this.models,
        views = this.views,
        Lstr = this.LStr.uiApp,
        CPROPS = COLORSTYLES.CS,
        // Кол-во и имена вкладок соответствуют списку категорий в uiCategories
        prop, tabs = [], maxlength, val, tval, i, j, n, max, t, p, g, text, view, lt, type, hstr, ctrl, ch;
    var chrs = 20, mstr = (new Array(chrs+1)).join("0"); // общая длинна в символах группы полей редактирования (и подстановочная строка той же длинны)
//~     var stBtn = ScriptUI.newImage(dir + "btClear16_RO.png", undefined, dir + "btClear16.png", dir + "btClear16.png"),
//~     st = "toolbutton", sz = [22, 22];                       // Кнопка "очистка" для группы полей редактирования
    var tb = cont.add("tabbedpanel"),
        gfx = tb.graphics,
        oxy = gfx.measureString(mstr),  // Длинна символа и высота символа в точках текущим шрифтом + поправка (пока расчёт только на моноширинные шрифты)
        oy = oxy[1] + 5,    // Поправка на dropdownlist-ы (edittext-ы уже на 5 тч.)
        ps = 175,               // общая ширина для группы ввода (без подписи и кнопки)
        counts = 0, scrl,
        hgt = 4*(5+oy),
        view = null;  // дежурный view для связывания полей ввода с model
    // =============== Добавляем табы по кол-ву категорий в модели (соответствует uiCategories)
    for (prop in uiCategories) if (uiCategories.hasOwnProperty(prop)) { 
        // hit при инициализации
        app.pBar.hit(localize(Lstr[39]) + uiCategories[prop].label);        
        // добавляем вкладку группы:
        t = tb.add("tab { text:'"+uiCategories[prop].label+"', helpTip:'"+uiCategories[prop].description+"', margins:[5,5,5,5], spacing:0, alignChildren:['Left','top'] }");
        g = t.add("group", [0, 5, 550, hgt]);
        extend (g, { margins:0, spacing:0, alignChildren:['left','top'], orientation:'row' } );  
        // упреждающий просмотр для определения самой длинной строки label в точках
        maxlength = counts = 0;  
        for (p in uiProperties) if (uiProperties.hasOwnProperty(p) && uiProperties[p].category == prop ) { maxlength = Math.max(maxlength, gfx.measureString(p)[0]); counts++ };       
        // ==== Добавляем в таб скроллируемую панель, если кол-во групп настройки больше 4 (counts*5) ======
        if (prop == "Image") {
            // Специальная обработка для Image: учитываем размер группы дополнительных настроек для скроллируемой панели:
            // 550, 110 - внешние видимые размеры панели;
            // 487, 226 - опытно определены для Additional settings panel
            // к размерам Additional settings panel прибавляем высоты одной стандартной группы image:
            scrl = SUI.addScrollablePanel(g, 0, 0, 550, 110, false, 226 + oy, 20); // oy - высота image:
            scrl.margins = [5,10,0,0];
        } else {
            if ((counts)*oy+counts*5 > hgt) {
                scrl = SUI.addScrollablePanel(g, 0, 0, 485, hgt+10, false, (counts+1)*oy+counts, 20);
                extend (scrl, { margins:0, spacing:0, alignChildren:['left','center'], orientation:'column' } ); 
            } else {
                scrl = g; scrl.orientation = 'column'; scrl.margins = [15,10,0,0];
            }
        }
        // ==== Заполняем табы ======
        for (p in uiProperties) if (uiProperties.hasOwnProperty(p) && uiProperties[p].category == prop ) {
            hstr =  uiProperties[p].description + "\n" + Lstr[0]+uiProperties[p].type + "\n" + Lstr[1] + uiProperties[p].defvalue;
            g = scrl.add("group");      // Общая группа редактирования свойства, включает подпись + группа полей ввода + чекбокс
            extend (g, { margins:0, spacing:5, alignChildren:['left','top'], orientation:'row', helpTip:hstr, label:p } );
            with (g.add("statictext { text:'"+p+":'}")) { preferredSize[0] = maxlength+5; helpTip = hstr };             // Подпись
            grp =  extend(g.add("group",[0, 0, ps, oy]), { margins:[0,0,0,0], spacing:5, alignChildren:['fill','fill'], orientation:'row' } ); // Общая группа для полей ввода
            ch = g.add("checkbox { helpTip:'"+localize(Lstr[5])+"', enabled:false }"); ch.label = p;     // Флажок "Определить";
            // Заполняем группу полями ввода:
            g = grp;
            val = uiProperties[p].value;   // Представляет объект из uiProperties.value типа '' или массив (['',''] или ['','','',''])
            tval = uiProperties[p].values; // Представляет объект из uiProperties.values типа undefined или массив предустановленных значений ['',''] или ['','','','']
            // Специальная обработка для вкладки Graphics:
            if (prop == "Graphics") {
                if (p == "font") {
                    view = this.addView({ id:p, parent:g, view:"edittext { properties:{ readonly:true } }", check:ch, control:{ helpTip:hstr, enabled:false } });
                    this._editors.add(view);
                    continue; // for (p in uiProperties)...
                } else if (CPROPS.hasOwnProperty(p)) {
                    view = this.addView({ id:p, parent:g, view:"dropdownlist", check:ch, control:{ __key:p, helpTip:hstr, enabled:false } });
                    this._editors.add(view);
                    this._ceditors.add(view);   // отдельная коллекция контролов для управления цветом
                    continue; // for (p in uiProperties)...
                }
            } // Другие графические свойства (opacity... обрабатываем стандартно:)
            // Парсинг типа значения из uiProperties[p].values и добавления соответствующих полей ввода (dropdownlist для предустановленных значений 
            // и edittext - для всех прочих). Для каждого поля ввода - создаём объекты представлений (по одному на каждое поле ввода в группе).           
            if ( tval instanceof Array) {  // Для всех свойств с предустановленными значениями добавляем dropdownlist-ы
                if ( val instanceof Array) { // свойство массив (двухмерный) и имеет предустановленные знчения
                    for (i=0, n=val.length; i<n; i ++) {
                        view = this.addView({ id:p+i, parent:g, view:"dropdownlist", check:ch, control:{ helpTip:hstr, enabled:false } });
                        view.control.add("item", ""); // Для возможности обнуления списка!
                        for (j=0, max=tval.length; j<max; j++) { view.control.add("item", tval[j]); }; // Добавляем все значения из uiProperties.values
                        view.control.selection = 0;
                        this._editors.add(view); // общий список всех контроллёров свойств (для быстрого блокирования/разблокирования)
                    } // for
                } else { // val не массив также имеет предустановленные знчения
                    view = this.addView({ id:p, parent:g, view:"dropdownlist", check:ch, control:{ helpTip:hstr, enabled:false } });
                    view.control.add("item", ""); // Для возможности обнуления списка!
                    for (j=0, max=tval.length; j<max; j++) { view.control.add("item", tval[j]); }; // Добавляем все значения из uiProperties.values
                    view.control.selection = 0;
                    this._editors.add(view); // общий список всех контроллёров свойств (для быстрого блокирования/разблокирования)
                } // else
            } else { // tval не массив (предустановленных значений нет)
                if (val instanceof Array) { // свойство - массив без предустановленных значений
                    for (i=0, max=val.length; i<max; i++) {
                        view = (p in {'bounds':0, 'frameLocation':0, 'image':0}) ? 
                                this.addView({ id:p+i, parent:g, view:"edittext { properties:{ readonly:true } }", check:ch, control:{ helpTip:hstr, enabled:false } }) :
                                this.addView({ id:p+i, parent:g, view:"edittext", check:ch, control:{ helpTip:hstr, enabled:false } });
                        this._editors.add(view);
                        if (p == 'image') this._ieditors.add(view); // отдельная коллекция контролов для отображения имён картинок
                    }
                    // дополнительно для image добавляем панель Additional settings (view:imageSettings)
                    if (p == 'image') {
                        g.size = [430, oy+2];
                        g.ddImage = g.add("dropdownlist {preferredSize:['140', 23], enabled:false}");
                        app._initImageFields(g.ddImage);
                        // app.btImage инициализирцется в _initImageListView();
                        app.btImage = g.btImage = g.add("button {text:'Image...', helpTip:'"+Lstr[34]+"', enabled:false }");
                        g.parent.parent.orientation = 'column';
                        view = app.buildImageSettings(g.parent.parent.add("group { preferredSize:[500,200] }")); // создание view:imageSettings
                        // получаем подгруппу с дополнительными полями настройки Image
                        view.control.text += ' (not implemented in this version)';
                        view.control.enabled = false;
                        //this._editors.add(view);
                    }
                } else { // свойство - значение без предустановленных значений
                    var viewEdit = "edittext { characters:18, properties:{ readonly:true } }",
                        btView = "button { text:'...', enabled:false, preferredSize:["+24+","+oy+"], alignment:'right', helpTip:'"+Lstr[27]+"' }";
                    if (p == 'items' ) {
                        view = this.addView({ id:p, parent:g, view:viewEdit, check:ch, control:{helpTip:hstr, enabled:false} });
                        app.btList = g.add(btView); 
                        app.btList.bname = 'btList';
                    } else if (p == 'columnWidths') {
                        view = this.addView({ id:p, parent:g, view:viewEdit, check:ch, control:{helpTip:hstr, enabled:false} });
                        app.btListCW = g.add(btView);
                        app.btListCW.bname = 'btListCW';                        
                    } else if (p == 'columnTitles') {
                        view = this.addView({ id:p, parent:g, view:viewEdit, check:ch, control:{helpTip:hstr, enabled:false} });
                        app.btListCT = g.add(btView);
                        app.btListCT.bname = 'btListCT';  
                    } else {
                        view = this.addView({ id:p, parent:g, view:"edittext", check:ch, control:{ helpTip:hstr, enabled:false } });
                    }
                    this._editors.add(view);
                }
            }
            //g.enabled = false; // По умолчанию все недоступно - будем включать в зависимости от добавляемого элемента
        } // for (p in uiCategories[prop])
    } // for (prop in uiCategories)  - Конец добавления табов
    p = app._getField('alignment0').control; p.remove('top'); p.remove('bottom');
    p = app._getField('alignment1').control; p.remove('left'); p.remove('right');
    p = app._getField('alignChildren0').control; p.remove('top'); p.remove('bottom');
    p = app._getField('alignChildren1').control; p.remove('left'); p.remove('right');    
    
    // Обработка чекбокса (установленный значок означает добавлять свойство в элемент при формировании диалога, снятый - игнорировать)
    tb.addEventListener ("click", function (e) {
            var model = app.activeControl;
            if (e.target.type == 'checkbox') { // && model && model.hasOwnProperty('control')) {
                var check = e.target, 
                       val = !check.value, // нужно, так как обработчик onClick вызывается до смены значения
                       label = check.label, // имя свойства управляемое данным чекбоксом (определяется на этапе добавления самого чекбокса)
                       //control = model.view.control,
                       control = model.control.properties,
                       prop = model.properties,
                       model_obj = model.control.properties;
            // Вносим метку в описательной части модели 
            if (!control.hasOwnProperty(label)) {
                if (!control.properties.hasOwnProperty(label)) {
                    if (!control.graphics.hasOwnProperty(label)) return; else { prop.graphics[label] = val; model_obj = model_obj.graphics; }
                } else { prop.properties[label] = val; model_obj = model_obj.properties; }
            } else { prop[label] = val; }
            // Красим текст в полях редактирования
            //for (var i=0, cont = check.parent.children[1].children, gfx = cont[i].graphics, S_CLR = gfx.PenType.SOLID_COLOR; i<cont.length; gfx = cont[i++].graphics) {
            for (var i=0, cont = check.parent.children[1].children, gfx = cont[i].graphics, S_CLR = gfx.PenType.SOLID_COLOR; i<cont.length; i++) {
                gfx = cont[i].graphics;
                gfx.foregroundColor = (val === true ? gfx.newPen(S_CLR, [0,0,0], 1) : gfx.newPen(S_CLR, toRGBA(app.options.disabledForegroundColor), 1));
                // При отжатом checkbox-е всё вырубается и наоборот:
                // TODO: пересмотреть перекрашивание в updateTabs...
                if ("button, dropdownlist".indexOf(cont[i].type) != -1) cont[i].enabled = val;
            }
        }
    });
    
    // Формирование объекта View
    return app.views.add(MVC.View("Tab", tb));
};

BuilderApplication.prototype._notImplemented = function() {
    var app = this;
    alert(localize(app.LStr.uiApp[35]), app.version + " " + app.name, false);
}
// Вспомогательная функция для быстрого получения полей редактирования свойств
BuilderApplication.prototype._getField = function(id) {
    return this._editors.getFirstByKeyValue('id', id);
};
// =================== 
// строим родительский View документов
BuilderApplication.prototype.buildDocsView = function(cont) {
    var app = this,
        LStr = app.LStr;
    // Родительский View для документов основан на TabbedPanel, каждый Tab которого будет представлять родительский View самого документа
    app.views.add(new MVC.View("Documents", cont.add("tabbedpanel { alignment:['fill','fill'] }")));
    // Панелька содержащая подпись 'Имя элемента' и поле редактирования JsName
    var pPnl = cont.add("group { margins:[5,1,5,1], spacing:5, alignChildren:'left', alignment:['fill','bottom'], st:StaticText {text:'"+LStr.uiApp[12]+"'} }");
    var gfx = pPnl.graphics;
    gfx.backgroundColor = gfx.newBrush(_BSOLID, toRGBA(app.options.backgroundColor)); // [0.94, 0.94, 0.94, 1]
    gfx.disabledBackgroundColor = gfx.newBrush(_BSOLID, toRGBA(app.options.doc.disabledBackgroundColor));
    // Собственно само поле редактирования JsName
    app.addView({ id:"JsName", parent:pPnl, view:"edittext { enabled:false, alignment:['fill','bottom'] }" });//, Init:function() { this.enabled = false;}
    return app.views; // возвращаем родительский View документов
};
// =================== 
// строим панель для редактирования изображений
BuilderApplication.prototype.buildImageSettings = function(cont) {
    var app = this,
        LStr = app.LStr.uiApp,
        states = ['normal', 'disabled', 'pressed', 'rollower'],
        grpView = "group { stName:StaticText {text:'normal:', characters:8}," +
                            "etName:EditText {characters:20, properties:{readonly:true}}," +
                            "ddImage:DropDownList {preferredSize:['140', 23]}," +
                            "btImage:Button {text:'Image...'}," +
                            "ch:Checkbox { enabled:false }}";
    var parent = cont.add("panel { text:'"+localize(LStr[33])+"', alignChildren:['left', 'center'], orientation:'column', margins:[10, 15, 10, 5], spacing:1 }");
    // Группы для добавления картинок
    each(states, function(val, index, arr){
        var grp = parent.add(grpView);
        grp.stName.text = val + ":";
        app._initImageFields(grp.ddImage);
        // Добавляем управляющие вьюхи в коллекции
        var view = new MVC.View({id:val+"Image", control:grp.etName });
        app.views.add(view);
        app._editors.add(view);
        app._ieditors.add(view);
        
    });

    // Группа настроек опций включения
    var helpTip1 = localize(LStr[28]),
        helpTip2 = localize(LStr[29]),
        txtGrp = localize(LStr[30]),
        txtchToString = localize(LStr[31]),
        txtchFixSize = localize(LStr[32]);
    var grpViewOpt = "panel {text:'"+txtGrp+"', orientation:'row', alignment:['fill', 'center'], margins:[15, 10, 15, 5]," +
						"g0:Group {alignment:['left', 'center'], preferredSize:['100', '40']}," +
						"g1:Group {orientation:'column', alignChildren:['left', 'top'], spacing:5," +
							"ch0:Checkbox {text:'"+txtchToString+"', helpTip:'"+helpTip1+"'}," +
								"g3:Group {alignment:['fill', 'top'], alignChildren:['left', 'center'], spacing:5," +
									"ch1:Checkbox {text:'"+txtchFixSize+"', helpTip:'"+helpTip2+"'}," +
									"et0:EditText {characters:6} }}}";
    parent.imageSettings = parent.add(grpViewOpt);
    var view = new MVC.View("imageSettings", parent);
    app.views.add(view);
    // суммарный размер панели для 1.20 (build 0601) 487,199 px
    return view;
}

// =================== 
// Строим StatusBar
BuilderApplication.prototype.buldStatusBar = function(cont) {
    var app = this,
          LStr = app.LStr.uiApp;
    var g = cont.add("group { alignment:['fill','bottom'], spacing:5 }" );
    var st = g.add("statictext { text:'© Slava Boyko aka SlavaBuck | 2013-2014 | slava.boyko@hotmail.com', alignment:['left','center'] }");
    st.graphics.foregroundColor = st.graphics.newPen (st.graphics.PenType.SOLID_COLOR, [0, 0, 0.54509803921569, 1], 1); // DarkBlue
    var sp = cont.add(SUI.Separator);
           SUI.SeparatorInit(sp, 'line', 2);
    var btClose = cont.add("button { text:'"+LStr[18]+"', alignment:['right','center'] }");
    
    btClose.onClick = function() { app.window.close(); }
    // Формирование объекта View
    return this.views.add(new MVC.View("SBar", g));
};

// =================== 
// Строим окно About
BuilderApplication.prototype.about = function() {
    var app = this,
           img = app.resources.images;
    //var w = new Window ("palette { preferredSize:[640,480], alignChildren:'stack', margins:0, properties:{ borderless: true } }"); //, properties:{ borderless: true } }");
    var sz1 = [80, 300],                // картинка
           sz2 = [370, sz1[1]-140];   // текст с описанием
    var w = new Window ("dialog { margins:0, properties:{ borderless: true }, \
                                           pPnl:Panel { margins:[0,0,1,1], orientation:'row', \
                                                gImg:Group { preferredSize:["+sz1[0]+","+sz1[1]+"], \
                                                    gPic:Group { preferredSize:["+(sz1[0]-36)+","+68+"], margins:[0,6,0,6], spacing:1, alignment:['center', 'top'], alignChildren:['center', 'bottom'], orientation:'column' } }, \
                                                gMain:Group { margins:10, spacing:10, orientation:'column', \
                                                    gCaption:Group { orientation:'row', margins:[0,0,0,0], spacing:4, alignment:['fill', 'fill'], alignChildren:['left','bottom'] }, \
                                                    sp1:"+SUI.Separator + " \
                                                    about:Group { margins:0, spacing:2, orientation:'column' },\
                                                    sp2:"+SUI.Separator + " \
                                                    btOk:Button { alignment:['right','bottom'], text:'Ok' } \
                                                } } }");
       var lic = { 
           // Creative Commons Attribution-NonCommercial-ShareAlike 3.0 - http://creativecommons.org/licenses/by-nc-sa/3.0/
           ru:"РАЗРЕШЕНО СВОБОДНОЕ ИСПОЛЬЗОВАНИЕ ПРОИЗВЕДЕНИЯ, ПРИ УСЛОВИИ УКАЗАНИЯ ЕГО АВТОРА, НО ТОЛЬКО В НЕКОММЕРЧЕСКИХ ЦЕЛЯХ. ТАКЖЕ ВСЕ ПРОИЗВОДНЫЕ ПРОИЗВЕДЕНИЯ, ДОЛЖНЫ РАСПРОСТРАНЯТЬСЯ ПОД ЛИЦЕНЗИЕЙ CC BY-NC-SA.", 
           en:"THE WORK (AS DEFINED BELOW) IS PROVIDED UNDER THE TERMS OF THIS CREATIVE COMMONS PUBLIC LICENSE (''CCPL'' OR ''LICENSE''). THE WORK IS PROTECTED BY COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS AUTHORIZED UNDER THIS LICENSE OR COPYRIGHT LAW IS PROHIBITED." 
       };
       var cpt =  " (© SlavaBuck, 2013-2014)\r";
       var libs =  MVC.name+ " v" + MVC.version + cpt +
                        MVC.DOM.name + " v" +MVC.DOM.version + cpt +
                        Collection.libname + " v" + Collection.libversion + cpt +
                        SUI.name + " v" +SUI.version + cpt +
                        PNGLib.name +" v"+PNGLib.version+" (© SlavaBuck, 2013-2014 - based on Marc Autret's and David Jones works)\r\r";
       var tittle = "Dialog Builder ver "+ app.version + " (ScriptUI 6.1.8)\r";
       var msg = { 
                    ru: tittle +
                        "Конструктор диалоговых окон для Adobe ESTK СS...\r\r" +
                        "Лицензионное соглашение Creative Commons:\rCC Attribution Non-Commercial ShareAlike (CC BY-NC-SA).\r\r" + 
                        lic.ru + "\rhttp://creativecommons.org/licenses/by-nc-sa/3.0/)" +
                        "\r\rБиблиотеки:\r" + libs + "© Slava Boyko aka SlavaBuck | 2013-2014 | slava.boyko@hotmail.com",
                    en: tittle +
                        "Designer of dialog boxes for Adobe ESTK CS...\r\r" + 
                        "Creative Commons License agriment:\rCC Attribution Non-Commercial ShareAlike (CC BY-NC-SA).\r\r" + 
                        lic.en + "\rhttp://creativecommons.org/licenses/by-nc-sa/3.0/" +
                        "\r\rLibraries used:\r" + libs + "© Slava Boyko aka SlavaBuck | 2013-2014 | slava.boyko@hotmail.com"
    };
    //w.pPnl.img.add("image",undefined, dir + "About2.png");
    //w.pPnl.gImg.image = img.pAbout;
    var gfx = w.pPnl.gImg.graphics;
    gfx.backgroundColor =  gfx.newBrush(_BSOLID, [0.3843, 0.2039, 0.2235, 1]);
    gfx = w.pPnl.gImg.gPic.graphics;
    gfx.backgroundColor =  gfx.newBrush(_BSOLID, [1, 0, 0, 1]);
    var txt0 = w.pPnl.gImg.gPic.add("statictext { alignment:['center','top'] text:'S c r i p t U I'}");
    var txt1 = w.pPnl.gImg.gPic.add("statictext { text:'Dialog'}");
    var txt2 = w.pPnl.gImg.gPic.add("statictext { text:'Builder'}");
    txt0.graphics.font = ScriptUI.newFont ("Arial", "Bold", 7);
    txt1.graphics.font = ScriptUI.newFont ("Verdana", "Bold", 10);
    txt2.graphics.font = ScriptUI.newFont ("Verdana", "Bold", 9.5);
    txt0.graphics.foregroundColor = txt1.graphics.foregroundColor = txt2.graphics.foregroundColor = txt2.graphics.newPen (_PSOLID, [1, 1, 1, 1], 1);
    // Текст справа
    txt1 = w.pPnl.gMain.gCaption.add("statictext { text:'"+app.name+"'}");
    txt2 = w.pPnl.gMain.gCaption.add("statictext { text:'v"+app.version+"', alignment:['left','top']}");
    txt1.graphics.font = ScriptUI.newFont ("Helvetica", "Bold", 20);
    txt2.graphics.font = ScriptUI.newFont ("Verdana", "Bold", 14); 
    txt2.graphics.foregroundColor = txt2.graphics.newPen (_PSOLID, [0.4392, 0.5019, 0.5647, 1], 1); //  SlateGray // DimGray[0.4117, 0.4117, 0.4117, 1]
    w.pPnl.gMain.btOk.onClick = function() { w.close(); }
    var c = 0.1,
    txt = w.pPnl.gMain.about.add("statictext { preferredSize:["+sz2[0]+","+sz2[1]+"], properties:{ multiline:true, scrolling:true } }");
    txt.text = localize(msg); 
    txt.graphics.foregroundColor = w.graphics.newPen (_PSOLID, [c,c,c,1], 1);
    
    txt = w.pPnl.gMain.about.add("statictext { alignment:['left','bottom'] }");
    txt.text = "slavabuck.wordpress.com";
    SUI.addWebLink(txt, "http://slavabuck.wordpress.com/");
    SUI.SeparatorInit(w.pPnl.gMain.sp1,'line');
    SUI.SeparatorInit(w.pPnl.gMain.sp2,'line');
    
    w.show();
};
// ========================================================= 
BuilderApplication.prototype.CreateDocument = function() {
    var app = this,
          uiControls = app.uiControls,
          doc = new BuilderDocument(app);
    // doc.activeContainer меняется только по клику в документе или в дереве:
    doc.window.addEventListener ('click', function(e) {
        doc.activeControl = doc.findController(e.target).model;
        if (e.target !== this) {
            if (SUI.isContainer(e.target)) {
                doc.activeContainer = e.target; 
            } else {
                if (e.target !== doc.window) doc.activeContainer = e.target.parent; 
                    else doc.activeContainer = doc.window;
            }
            app.treeView.selectItem(doc.activeControl);
        }
    }, true);

    // Каждое переключение активного контрола документа также переключает активный контрол в приложении
    doc.watch ('activeControl', function(key, oldVal, newVal) {
        if (oldVal) app.unmarkControl(oldVal);
        if (newVal) app.markControl(newVal);
        doc.app.activeControl = (newVal) ? doc.app.getModelByID(newVal.id) : null;
        return newVal;
    });
    // Добавляем звёздочку в таб документа при его модификации // звёздочка убивается автоматом в doc.save()
    doc.watch ('modified', function(key, oldVal, newVal) {
        if (newVal) {
            if (doc.name[0] != "*") doc.name = "*" + doc.name;
        } else {
            if (doc.name[0] == "*") doc.name = doc.name.slice(1);
        }
        return newVal;
    });
    
    return doc;
};

BuilderApplication.prototype.addDocument = function() {
    // Вызываем перекрытый родительский метод:
    var doc = BuilderApplication.prototype.__super__.addDocument.call(this);
    // Добавляем родительское окно в пустой документ:
    if (doc) doc.creatDialog(doc.app.options.dialogtype + " { preferredSize:[80, 20], alignment:['left','top'] }");
    doc.modified = false;
    return doc;
};

// Быстрое отвязывание всех контролов
BuilderApplication.prototype.disableAllTabs = function() {
    var editors = this._editors;
    app._updateFontField(null);
    for (var i=0, max=editors.length; i<max; i++) {
        editors[i].unbind();
        editors[i].control.enabled = false;
        if (editors[i].hasOwnProperty('check')) editors[i].check.enabled = false;
    }
};


BuilderApplication.prototype.updateTabs = function(newVal) {
    var app = this;
    if (!app.enabledTabs) return;
    app.disableAllTabs();   // Быстрая блокировка всех контролов - нужные потом последовательно разблокируем
    if (!newVal || newVal.hasOwnProperty('document')) return;
    var view_obj = newVal.view.control,
          cGray = view_obj.graphics.newPen(_PSOLID, toRGBA(app.options.disabledForegroundColor), 1),
          cBlack = view_obj.graphics.newPen(_PSOLID, [0, 0, 0], 1);
    // ========= Обходим свойства модели для контрола newVal, разблокируем и перепривязываем нужные модели и представления (по алгоритму из buildTabs)
    _updateTabs(newVal, newVal.control.properties, newVal.properties, 'control.properties.', view_obj);
    _updateTabs (newVal, newVal.control.properties.properties, newVal.properties.properties, 'control.properties.properties.', view_obj.properties);
    _updateTabs (newVal, newVal.control.properties.graphics, newVal.properties.graphics, 'control.properties.graphics.', view_obj.graphics);
    
    return;
    // ========= Конец updateTabs() ========= //
    function _updateTabs(newVal, control, flags, str, view_obj) { // str = control.properties. || control.properties.properties. || control.properties.graphics.
        var val, p, i, view, ch,
              CPROPS = COLORSTYLES.CS;
try {
        for (p in control) if (control.hasOwnProperty(p) && p != 'properties' && p != 'graphics') {
            // Специальная обработка для font (поля в заголовке и в табах)
            if (p == "font") {
                app.fontStyle.rebind(newVal);
                app.fontName.rebind(newVal);
                app.fontSize.rebind(newVal);
                view = app._editors.getFirstByKeyValue('id', p);
                view.control.enabled = view.check.enabled = true; view.check.value = flags[p];
                view.control.graphics.foregroundColor = (view.check.value ? cBlack : cGray);
                app._updateFontField(newVal);
                continue;
            }
            // Специальная обработка для обновления colors (поля в заголовке и в табах)
            if (CPROPS.hasOwnProperty(p)) {
                view = app._ceditors.getFirstByKeyValue('id', p); 
                view.control.enabled = view.check.enabled = true; view.check.value = flags[p];
                view.control.graphics.foregroundColor = (view.check.value ? cBlack : cGray);
                view.rebind(newVal);
                if (p == "foregroundColor") app._ceditors.getFirstByKeyValue('id', "fontColor").rebind(newVal);
                if (!newVal.control.properties.hasOwnProperty("text")) app._ceditors.getFirstByKeyValue('id', "fontColor").unbind(); //control.enabled = false;
                continue;
            }
            // Стандартная обработка для всех остальных...
            val = app.uiProperties[p].value;
            if (typeof val == 'object') {
                for (i=0; i<control[p].length; i++) {
                    view = app._editors.getFirstByKeyValue('id', p+i); 
                    view.control.enabled = view.check.enabled = true; view.check.value = flags[p];
                    view.control.graphics.foregroundColor = (view.check.value ? cBlack : cGray);
                    if (view.control.hasOwnProperty('selection')) view.rebind(newVal, 'selection.text', str+p+'.'+i); else view.rebind(newVal, 'text', str+p+'.'+i);
                } // for ()
            } else { // control[p] not Array
                view = app._editors.getFirstByKeyValue('id', p);
                view.control.enabled = view.check.enabled = true; view.check.value = flags[p];
                view.control.graphics.foregroundColor = (view.check.value ? cBlack : cGray );
                if (view.control.hasOwnProperty('selection')) view.rebind(newVal, 'selection.text', str+p); else view.rebind(newVal, 'text', str+p);
            }
        } // for (p in control)
 } catch(e) { trace(e, 'updateTabs: p =', p) }
    }; // function _updateTabs
};

BuilderApplication.prototype._updateFontField = function(newVal) {
    if (!(newVal && newVal.control && newVal.control.properties.hasOwnProperty('text'))) return app._getField("font").control.text = "";
    app._getField("font").control.text = newVal.view.control.graphics.font.toString();
};
// Функции выделения doc.activeControl:
BuilderApplication.prototype.unmarkControl = function(model) {
    try {
    var control = model.view.control,
        gfx = control.graphics,
        cBrush =  toRGBA(model.control.properties.graphics.backgroundColor),
        type = model.view.type;
    if (type == 'listbox') return gfx.backgroundColor = gfx.newBrush(_BSOLID, [1, 1, 1, 1]);
    if (SUI.isContainer(type) ||  type == 'separator') return gfx.backgroundColor = gfx.newBrush(_BSOLID, cBrush);
    if (type == 'progressbar' || type == 'image') { control.enabled = !control.enabled; control.enabled = !control.enabled; return; }
    control._marked_ = false;
    control.notify ('onDraw');
    } catch(e) { trace(e) }
};

BuilderApplication.prototype.markControl = function(model) {
    try {
    var control = model.view.control,
        gfx = control.graphics,
        cBrush = this.options.highlightColor,
        type = model.view.type;
    if (type == 'listbox') return gfx.backgroundColor = gfx.newBrush(_BSOLID, [cBrush[0], cBrush[1], cBrush[2], 1]);
    if (SUI.isContainer(type) || type == 'separator') return gfx.backgroundColor = gfx.newBrush(_BSOLID, cBrush);
    if (type == 'progressbar' || type == 'image') { cont.enabled = !control.enabled; control.enabled = !control.enabled; return; }
    control._marked_ = true;
    control.notify ('onDraw');
    } catch(e) { trace(e) }
};

BuilderApplication.prototype.evalDialog = function(rc) {
    var app = this,
        rc = (rc)||this.activeDocument.getSourceString();
    if (!rc) return app.alert(localize(app.LStr.uiErr[3]) );
    try { log (eval(rc)); } catch(e) { app.alert(localize(app.LStr.uiErr[4])+':\r'+e.description); }
};

BuilderApplication.prototype.openInESTK = function(doc) {
    var doc = (doc)||this.app.activeDocument;
    try {
        if (doc && doc.save()) return doc.file.execute(); else return false;
    } catch(e) { trace(e); return false; }
};

BuilderApplication.prototype.alert = function(msg, caption) {
    var app = this;
    var caption = (caption)||app.name +": "+localize(app.LStr.uiErr[7]);
    var size = [370, 260];
    var w = new Window ("dialog { text:'"+caption+"', spacing:5, margins:[5,5,5,5], spacing:5, properties:{resizeable:true }, \
                                                    msg:StaticText { preferredSize:["+size[0]+","+size[1]+"], alignment:['fill','fill'], properties:{ multiline:true, scrolling:true } }, \
                                                    sp:"+SUI.Separator + " \
                                                    grp:Group { alignment:['fill','bottom'],  \
                                                        btOk:Button { alignment:['right','bottom'], text:'Ok', helpTip:'"+localize({ ru:'Закрыть', en:'Close'})+"' } \
                                                   }               }");
    w.msg.text = msg;                                                   
    SUI.SeparatorInit(w.sp, 'line');
    w.onResizing = w.onResize = function() { w.layout.resize(); }
    w.show();
};

BuilderApplication.prototype.showModelCode = function(model) {
    if(!model) return;
    //log(model.control.toSource() +"\r----\r" + model.view.control.toSource());
    //log(model.toSourceString()+"\r"+model.getCode());
    //log(model.getSourceString());
};

BuilderApplication.prototype.showCode = function(doc) {
    var app = this,
           LStr = app.LStr,
           doc = (doc)||app.activeDocument;
    if (!doc) return;
    var size = [470, 320];
    var w = new Window ("dialog { text:'"+localize(LStr.uiApp[14])+"', spacing:5, margins:[5,5,5,5], spacing:5, properties:{resizeable:true }, \
                                                    txt:StaticText { text:'"+localize({ru:"Код диалога:", en:"Code of Dialog:"})+"', alignment:['left','top'] }, \
                                                    code:EditText { preferredSize:["+size[0]+","+size[1]+"], alignment:['fill','fill'], properties:{ multiline:true, scrolling:true, readonly:false } }, \
                                                    sp:"+SUI.Separator + " \
                                                    grp:Group { alignment:['fill','bottom'],  \
                                                        btView:Button { alignment:['left','bottom'], text:'eval', helpTip:'"+localize({ ru:'Выполнить', en:'Run dialog'})+"' }, \
                                                        btOk:Button { alignment:['right','bottom'], text:'Ok', helpTip:'"+localize({ ru:'Закрыть', en:'Close'})+"' } \
                                                   }               }");
    SUI.SeparatorInit(w.sp, 'line');
    w.code.text = doc.getSourceString();
    w.grp.btOk.onClick = function() { w.close(); }
    w.grp.btView.onClick = function() { app.evalDialog(w.code.text) }
    w.onResizing = w.onResize = function() { w.layout.resize(); }

    w.show();
};

BuilderApplication.prototype.onExit = function() {
    var app = this, 
        notsaved = false;
    for (var i=0, docs =app.documents; i<docs.length; i++) notsaved = docs[i].modified;
    if (notsaved && confirm(localize(app.LStr.uiApp[19]), false, this.name))  app.saveAllDocument();
};

BuilderApplication.prototype.terminate = function(err, msg) {
    var app = this,
        msg = (msg)||"Critical error. Application is terminated",
        txt = (err instanceof Error ? trace(err, msg) : msg);
    alert(txt, app.vname, true); 
    if (app.window && app.window.visible) app.window.close();
    throw Error(msg);
};

BuilderApplication.prototype.closeDocument = function() {
    var app = this,
        doc = app.activeDocument;
    if (doc.modified && confirm(localize(app.LStr.uiApp[48]), true, app.name)) doc.save();
    return BuilderApplication.prototype.__super__.closeDocument.call(this);
}