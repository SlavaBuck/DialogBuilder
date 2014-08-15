/**************************************************************************
 *  02application.jsx
 *  DESCRIPTION: BuilderApplication: Основной класс приложения 
 *  @@@BUILDINFO@@@ 02application.jsx 1.83 Sun Aug 03 2014 15:36:02 GMT+0300
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

$.localize = true;

function BuilderApplication (wtype) { // wtype = dialog || palette
    if (!(this instanceof BuilderApplication)) return new BuilderApplication(wtype);
    var app = this,
        wtype = (wtype) || "dialog";
    BuilderApplication.prototype.__super__.constructor.call(this, {
    name:"Dialog Builder",
    version:"1.83",
    caption:"1.83 Dialog Builder (build 0803, MVC v"+MVC.version+", MVC.DOM v"+MVC.DOM.version+", SimpleUI v"+SUI.version+")",
    view:wtype + "{spacing:2, margins:[5,5,5,5], orientation:'column', alignChildren:'top', properties:{resizeable: true, closeButton:true, maximizeButton:true }, \
                      pCaption:Panel { margins:[0,1,5,1], spacing:2,alignment:['fill','top'], orientation:'row'}, \
                      pMain:Panel { margins:[0,0,0,0], spacing:0, alignment:['fill','fill'], orientation:'row', \
                                           LeftPnl:Panel { margins:[0,0,0,0], spacing:2, alignment:['left','fill'], alignChildren:['Left','top'], orientation:'column' }, \
                                           MainPnl:Panel { preferredSize:[450,300], margins:[0,0,0,0], spacing:2, alignment:['fill','fill'], orientation:'column', properties:{borderStyle:'sunken'} }, \
                                           sp:"+SUI.Separator+", \
                                           RightPnl:Panel { margins:[0,0,0,0], spacing:2, alignment:['right','fill'], orientation:'column' } }, \
                      pBottom:Panel { margins:[0,2,0,4], spacing:0, alignment:['fill','bottom'], orientation:'column', properties:{borderStyle:'etched'}, \
                                              pTabs:Group { margins:[4,0,4,0], spacing:4, alignment:['fill','top'], orientation:'row', alignChildren:['fill','fill'] } }, \
                      pStatusBar:Group { margins:[4,4,4,0], spacing:4, alignment:['fill','bottom'], orientation:'row' } \
                 }"
    });
    app.vname = app.name + " v" + app.version;
    app.activeControl = null;   // Ссылка на модель текущий (добавляемый) элемент в контейнер документа
    app.enabledTabs = true;     // Флаг, разрешающий обновление панелей свойств (используется в doc.load())
    app._editors = new Collection();  // общий список всех въюшек свойств формируемых в app.buildTabs (для быстрого блокирования/разблокирования в app.updateTabs);
    app._ceditors = new Collection(); // отдельный список въюшек для редактирования свойств цвета
    app._ieditors = new Collection(); // отдельный список въюшек для отображающих имена для изображений
};

inherit (BuilderApplication, MVCApplication);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Инициализация интерфейса и моделей
BuilderApplication.prototype.Init = function() {
    var app = this;
    // Загрузка и инициализация ресурсов
    app.initResources();
    // Инициализация рабочих областей окна приложения
    app.initMainWindow();
    app.initClipBoard();
    app.initHotKeys();
    
    // Завершение настройки
    app.progressBar.hit(localize(app.LStr.uiApp[45]));
    // Регестрируем фабрику документов
    app.registerDocumentFactory();
    // Настойка рабочей области документов
    app.initDocumentsView();

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
            app.documentsView.control.selection = newVal.window; // переключаемся на добавленный tab
            var doc = app.getModelByID(newVal.id);
            app.window.text = app.version + " " + app.name + " - " + (doc.document.name[0] == '*' ? doc.document.name.slice(1) : doc.document.name);
            if (newVal.activeControl)  app.activeControl = app.getModelByID(newVal.activeControl.id); else app.activeControl = doc;
        };
        app.treeView.refreshItems(newVal);
        return newVal;
    });

    app.progressBar.close();
} // app.Init()


// ===================
// Инициализация клавиатурных сокращений:
BuilderApplication.prototype.initHotKeys = function() {
    var app = this;
    // Обработка нажатия клавиш (работает нормально только когда закрыт ESTK)
    app.window.addEventListener ("keydown", function(kb) {
        if (!kb.ctrlKey) return;
        var doc = app.activeDocument,
            keyName = kb.keyName;
        if (!doc && keyName != "O") return;
        // Ctrl + Shift + Key
        if (kb.shiftKey) switch (keyName) {
            case "S":   app.saveAsDocument();   break;
            case "E":   app.openInESTK();       break;
            default:    kb.preventDefault();
        // Ctrl + Key
        } else switch (keyName) {
            case "N":   app.addDocument(); app._enableButtons();         break;
            case "O":   if (app.openDocument()) app._enableButtons();    break; // возвращает activeDocument, если загрузка удачная
            case "W":   if (!app.closeDocument()) app._disableButtons(); break; // возвращает activeDocument, null - если всё закрыто.
            case "S":   app.saveDocument();     break;
            case "K":   app.showSettings();     break;
            case "X":   app.cut();              break;
            case "C":   app.copy();             break;
            case "V":   app.paste();            break;
            case "R":   app.evalDialog();       break;
            case "D":   app.showCode();         break;
            case "H":   app.about();            break;
            default:    kb.preventDefault();
        }
    });
};

// ===================
// Инициализация клавиатурных сокращений:
BuilderApplication.prototype.initDocumentsView = function() {
    var app = this,
        docsView = app.documentsView.control; // инициализируется в app.documentsView()

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
};

// ===================
// Инициализация буфера обмена:
BuilderApplication.prototype.initClipBoard = function() {
    app.clipBoard = {           // 
        model:null,             // Скопированный элемент, готовый к вставке
        code:null, 
        srcControl:null,
        set:function(model) { 
            if (model) {
                this.model = model; 
                this.evalcode = [];
                this.rcControl = model.getSourceString(this.evalcode).replace(/\r/mg, "\n");
                this.evalcode = this.evalcode.join("\r");
            } else this.clear();
        },
        clear:function() { this.model = this.evalcode = this.rcControl = null; },
        isEmpty:function() { return this.model === null; }
    };
};

// ===================
// Загрузка и последующая инициализация всех ресурсов:
BuilderApplication.prototype.initResources = function() {
    // Настройка локальных ссылок
    var app = this,
        title = app.version +" " + app.name + ": " + localize({ru:"Загрузка...", en:"Loading..."});
    // Настройка папок приложения
    app.appFolder = File.decode(File($.fileName).parent.absoluteURI +'/');
    app.resFolder = (app.appFolder.match(/Required/) ?  app.appFolder : app.appFolder + "Required/");
    // Инициализация прогрессБара
    app.progressBar = SUI.FloatingProgressBar(title);
    app.progressBar.reset(title, 22);
    app.progressBar.hit(localize({ ru:"Загрузка настроек...", en:"Loading settings..."}));
    // Загрузка и приминение настроек
    app.processingOptions();
    // Загрузка и инициализация ресурсов
    app.progressBar.hit(localize({ ru:"Загрузка ресурсов...", en:"Loading resources..."}));
    app.loadResources();
    app.initJsNames();
    
    app.hashControls = {};      // hashControls содержит соответствие типов hashControls["tabbedpanel"] = "TabbedPanel", ...
    app.hashUserControls = {};  // Коллекция пользовательских элементов с ресурсными строками
    each(app.uiControls, function(ctrl, key) {
        app.hashControls[key.toLowerCase()] = ctrl.label;
        if (ctrl.type.match(/User/)) app.hashUserControls[key.toLowerCase()] = SUI[ctrl.label];
    });
    app.hashControls['dialog'] = app.hashControls['palette'] = app.hashControls['window'] = "Window";
};

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

// ========================================================= 
BuilderApplication.prototype.CreateDocument = function() {
    var app = this,
        uiControls = app.uiControls,
        doc = new BuilderDocument(app);
    
    doc.window.addEventListener (CP.CLICK, function(e) {
        // Корректировка для составных пользовательских элементов:
        var target = (e.target.parent.isUnitBox) ? e.target.parent : e.target;
        // Переустановка doc.activeControl, doc.activeContainer и выделение элемента в дереве:
        doc.activeControl = doc.findController(target).model;
        if (e.target !== this) {
            if (SUI.isContainer(target) && !target.isUnitBox) {
                // doc.activeContainer меняется только по клику в документе или в дереве:
                doc.activeContainer = target; 
            } else {
                if (target !== doc.window) doc.activeContainer = target.parent; 
                    else doc.activeContainer = doc.window;
            }
            app.treeView.selectItem(doc.activeControl);
        }
    }, true);

    // Каждое переключение активного контрола документа также переключает активный контрол в приложении
    doc.watch ('activeControl', function(key, oldVal, newVal) {
        try {
        if (oldVal) app.unmarkControl(oldVal);
        if (newVal) app.markControl(newVal);
        doc.app.activeControl = (newVal) ? doc.app.getModelByID(newVal.id) : null;
        } catch(e) { trace(e) }
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
    // Меняем цвет кнопки в поле treeView:
    doc.watch ('_reload', function(key, oldVal, newVal) {
        if (newVal != oldVal) newVal ? app.grpReload.setRed() : app.grpReload.setGreen();
        return newVal;
    });

    return doc;
};

BuilderApplication.prototype.addDocument = function() {
    // Вызываем перекрытый родительский метод:
    var doc = BuilderApplication.prototype.__super__.addDocument.call(this);
    // Добавляем родительское окно в пустой документ:
    if (doc) doc.creatDialog();
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
    };
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
BuilderApplication.prototype.markControl = function(model) {
    var cBrush = this.options.highlightColor;
    model.view.control._marked_ = true;
    if (model.view.type == 'unitbox') return this.remarkUnitBox(model, cBrush);
    this.remarkControl(model, cBrush);
};

BuilderApplication.prototype.unmarkControl = function(model) {
    var cBrush = toRGBA(model.control.properties.graphics.backgroundColor);    
    model.view.control._marked_ = false;
    if (model.view.type == 'unitbox') return this.remarkUnitBox(model, cBrush);
    this.remarkControl(model, cBrush);
};

BuilderApplication.prototype.remarkControl = function(model, cBrush) {
    var control = model.view.control,
        gfx = control.graphics,
        type = model.view.type,
        userControls = {'separator':0, 'unitbox':0};
    if (type == 'listbox') return gfx.backgroundColor = gfx.newBrush(_BSOLID, [cBrush[0], cBrush[1], cBrush[2], 1]);
    if (SUI.isContainer(type) || type in userControls) return gfx.backgroundColor = gfx.newBrush(_BSOLID, cBrush);
    if (type == 'progressbar' || type == 'image') { control.enabled = !(control.enabled = !control.enabled); return; }
    control.notify ('onDraw');
};

BuilderApplication.prototype.remarkUnitBox = function(model, cBrush) {
    var control = model.view.control,
        gfx = control.graphics,
        et_gfx = control.edit.graphics;
    gfx.backgroundColor = et_gfx.backgroundColor = gfx.newBrush(_BSOLID, cBrush);
};

//////////
BuilderApplication.prototype.evalDialog = function(rc) {
    var app = this,
        rc = (rc)||this.activeDocument.getSourceString();
    if (!rc) return app.alert(localize(app.LStr.uiErr[3]) );
    try { log (eval(rc)); } catch(e) { app.alert(localize(app.LStr.uiErr[4])+':\r'+e.description); }
};

BuilderApplication.prototype.openInESTK = function(doc) {
    var doc = (doc)||this.activeDocument;
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
                                                    sp:"+SUI.Separator + ", \
                                                    grp:Group { alignment:['fill','bottom'],  \
                                                        btOk:Button { alignment:['right','bottom'], text:'Ok', helpTip:'"+localize({ ru:'Закрыть', en:'Close'})+"' } \
                                                   }               }");
    w.msg.text = msg;                                                   
    SUI.initSeparator(w.sp);
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
                                                    sp:"+SUI.Separator + ", \
                                                    grp:Group { alignment:['fill','bottom'],  \
                                                        btView:Button { alignment:['left','bottom'], text:'eval', helpTip:'"+localize({ ru:'Выполнить', en:'Run dialog'})+"' }, \
                                                        btOk:Button { alignment:['right','bottom'], text:'Ok', helpTip:'"+localize({ ru:'Закрыть', en:'Close'})+"' } \
                                                   }               }");
    SUI.initSeparator(w.sp);
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
};

// Функции копирования/вставки
BuilderApplication.prototype.cut = function(model) {
    var app = this,
        model = app.copy(model);
    if (model) {
        if (model.view.item == "Window") app.activeDocument.creatDialog(); else app.activeDocument.removeItem(model);
    }
};

BuilderApplication.prototype.copy = function(model) {
    var app = this,
        uiApp = app.LStr.uiApp;
    if (!model) {
        var model = app.activeControl ? (app.activeControl.hasOwnProperty("document") ? null : app.activeControl) : null;
        if (!model) return null;
    };
    app.clipBoard.set(model);
    app.btPaste.helpTip = localize(uiApp[52]) + "\r" + app.clipBoard.rcControl;
    return model;
};

// Вставка диалога происходит в отдельную панель если диалог назначения уже содержит элементы, либо происходит
// полное дублирование скопированного диалога. Обычные элементы (включая контейнеры) вставляются в активный
// контейнер диалога назначения.
BuilderApplication.prototype.paste = function() {
    if (this.clipBoard.isEmpty()) return;
    var app = this,
        doc = app.activeDocument,
        clipBoard = app.clipBoard;
    if (!doc) return;
    
    var model = clipBoard.model,
        rcControl = normalizeRcString(clipBoard.rcControl),
        evalcode = clipBoard.evalcode,
        jsname = model.control.jsname;
    
    if (model.view.item == "Window") {
        // Целое окно копируем либо в группу (если окно назначения пустое) либо в панель:
        rcControl = (doc.window.children[0].children.length == 0 ? "group { orientation:'column', " : "panel {") + 
                    rcControl.slice(rcControl.indexOf("{")+1);
    }
    app.unmarkControl(doc.activeControl);

    //генерация нового валидного jsname в контексте этого документа:
    var item = model.view.item;
    if (!doc._counters_.hasOwnProperty(item)) doc._counters_[item] = 0;      // Инициализация счётчика соответствующих элементов:
    var newjsname = app.uiControls[item].jsname + (doc._counters_[item]); // Генерация js-имени элемента (и приращение счётчика)    
    if (!app.uiControls.hasOwnProperty(item)) doc._counters_[item] += 1;
    
    var control = doc.activeContainer[newjsname] = doc.activeContainer.add(rcControl);
    doc.window.layout.layout(true);
    
    if (evalcode) {
        // Трансформируем ссылки старого окна в контекст нового окна
        var pattern = evalcode.match(new RegExp("^\\s?var.+= (.+)\\."+jsname, "m")),
            varstr = "";
        if (pattern) pattern = pattern[1]; else {
            pattern = "control";
            varstr = "var "+jsname+" = __control__."+jsname+"\r";
        }
        var replaceExp = new RegExp(" = "+pattern, "mg")
        evalcode = evalcode.replace(replaceExp," = __control__");
        evalcode = "var __control__ = control.parent;\r__control__." + 
                   jsname + " = __control__.children[__control__.children.length-1];\r" + varstr + evalcode;
    }
    doc.appendItems(jsname, control, rcControl, evalcode);

    // Выделяем вставленный контрол (если нужно - переключаем фркус)
    var model = doc.findController(control).model;
    // Кооректировка jsname в полученной модели:
    model.control.jsname = model.view.jsname = newjsname;
    // Выделение и корректирование узла в дереве (так как он был создан со старым значением jsname)
    app.treeView.selectItem(model).text = newjsname;
    doc.activeControl = model;
    doc.activeContainer = control.parent;
    // Кооректировка jsnameв полученной модели:
    model.control.jsname = model.view.jsname = app.treeView.control.activeItem.text = newjsname;
    
    if (SUI.isContainer(model.view.type)) {
        if (app.options.autofocus) {
            app.treeView.control.activeNode = app.treeView.control.activeItem;
            doc.activeContainer = model.view.control;
        } else {
            app.treeView.control.activeNode = app.treeView.control.activeItem.parent;
        }
    };
    
    doc.modified = true;
};

BuilderApplication.prototype._notImplemented = function() {
    var app = this;
    alert(localize(app.LStr.uiApp[35]), app.vname, false);
};