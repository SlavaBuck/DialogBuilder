/**************************************************************************
*  05processingOptions.jsx
*  DESCRIPTION: 
*  @@@BUILDINFO@@@ 05processingOptions.jsx 1.20 Sun May 25 2014 19:22:51 GMT+0300
* 
* NOTICE: Работа с настройками приложения: чтение, сохранение, создание, приминение.
*       processingSettings() - 
*
*
/**************************************************************************
* © Вячеслав aka SlavaBuck, 27.03.2014.  slava.boyko#hotmail.com
*/

// ===================
// Первичная инициализация опций:
//      
BuilderApplication.prototype.processingOptions = function() { 
    var app = this;
    // попытка загрузки опций из файла
    app.loadedOptions = app.loadOptions();
    if (!app.loadedOptions) app.loadedOptions = {};
    // объединения обязательных настроек по умолчанию (константа DEFOPTIONS) с загруженными настройками (если таковае были загружены)
    app.options = merge(DEFOPTIONS, app.loadedOptions);
    // финальная инициализация всех полей опций
    app.prepareOptions();
    // общие операции по приминению опций, требуемые для корректной инициализации приложения
    app.applyOptions();
};

// ===================
// Приминение опций. Предполагается что объект опций корректно проинициализирован (выполнено app.preparingOptions() )
//      
BuilderApplication.prototype.applyOptions = function() {
    var app = this;
    // применяем язык интерфейса
    $.locale = app.options.locale;        
    // Применяем графическую тему
    var gfx = app.window.graphics,
        opt = app.options;

    gfx.foregroundColor = gfx.newPen(_PSOLID, toRGBA(opt.foregroundColor), 1);
    gfx.backgroundColor = gfx.newBrush(_BSOLID, toRGBA(opt.backgroundColor));    
    gfx.disabledForegroundColor = gfx.newPen(_PSOLID, toRGBA(opt.disabledForegroundColor), 1);
    gfx.disabledBackgroundColor = gfx.newBrush(_BSOLID, toRGBA(opt.disabledBackgroundColor));

    if (opt.font) gfx.font = ScriptUI.newFont(opt.font);
    opt.highlightColor = toRGBA(parseInt(parseColor(opt.highlightColor)), 0.5)
 };

// ===================
// Загрузка опций:
//      - возвращает null если файл опций не найден или сигнатура в найденном файле не имеет строки "<DBuilder options>", в противном случае возвращает объект опций
//         полученный с помощью eval(...)
//
BuilderApplication.prototype.loadOptions = function() { // 
    var f = new File(this.resFolder + "options.jsxinc"),
           _loadOptions = null,
           str = "";
    if (f.exists) {
        try { 
            f.open("r"); str = f.read(); f.close();
            if (str.match(/<DBuilder options>/)) _loadOptions = eval("("+str+")");  
        } catch(e) { log("loadOptions: " + e.description); return null; }
    } 
    return _loadOptions;
};

// ===================
// Финальная обработка опций для инициализации всех необходимых полей:
//      - значения всех ключевых полей объекта опций проверяются на корректное значение и в случае необходимости инициализируются значениями по умолчанию,
//        либо значениями из предустановленного списка значений
//
BuilderApplication.prototype.prepareOptions = function() {
    var app = this,
           options = app.options;
    // ----------------------------------------
    // группа общих настроек приложения:
    if (!options.locale) options.locale = DEFOPTIONS.locale;     // Языковые настройки (по умолчанию = '' - системная локаль)    
    if (!options.appcolors || (options.appcolors != 'CS' && options.appcolors !='CC')) options.appcolors = DEFOPTIONS.appcolors;
    if (!options.doccolors || (options.doccolors != 'CS' && options.doccolors !='CC')) options.doccolors = options.appcolors;
    _setColors(options.appcolors, options);
    _setColors(options.doccolors, options.doc);
    // highlightColor инициализируется в формате RGBA
    if (!options.highlightColor) options.highlightColor = DEFOPTIONS.highlightColor; else {
        options.highlightColor = toRGBA(parseInt(parseColor(options.highlightColor)), 0.5);
    }
    if (!options.font) options.font = (DEFOPTIONS.font ? DEFOPTIONS.font : app.window.graphics.font.toString());   // Шрифт интерфейса
    // тип коротких имён 'small' || 'full' || 'user'
    if (!options.jsname) options.jsname = DEFOPTIONS.jsname;
    // коллекция коротких имён 'user' (может быть не полной)
    if (!options.jsnames) options.jsnames = {};
    // ----------------------------------------
    // группа настроек документа:
    if (!options.doc) options.doc = {};
    // шрифт документа по умолчанию
    if (!options.doc.font) options.doc.font = options.font;
    // пользовательские цвета
    if (!options.usercolors) options.usercolors = {};
    // пользовательские шрифты
    if (!options.userfonts) options.userfonts = [];
    
    // Вспомогательные функции
    function _setColors(schema, opt) { 
        // Применяем цветовые схемы (цвета backgroundColor, foregroundColor... для приложения и документа инициализируются в формате uint)
        for (var p in COLORSTYLES[schema]) if (COLORSTYLES[schema].hasOwnProperty(p)) {
            if (!opt[p]) opt[p] = COLORSTYLES[schema][p]; else opt[p] = parseInt(parseColor(opt[p]));
        } // for
    } // _setColors
};

// ===================
// Получения текстовой версии объекта, пригодной  для сохранения в текстовом файле в удобной для редактирования форме и воссоздания его с помощью вызова eval(...)
//
BuilderApplication.prototype.parseOptions = function(obj) {
    var app = this,
          obj = (obj)||{},
          str = obj.toSource().replace(/{/g,"{\r").replace(/}/g,"\r}").replace(/, /g,",\r");
    str = str.substring(1, str.length-1);
    str = "/\/\ <DBuilder options> "+app.name+" v"+app.version+" options file (don't delete this string!!!) \r" + str;
    // Форматируем для удобства чтения файла
    var s= "", tr="", arr = str.split("\r");
    for (var i=arr.length-1; i>=0; i--) {
        if (arr[i].indexOf("]") != -1) while (arr[i].indexOf("[") == -1) { arr[i-1] += " " + arr[i]; arr.splice(i, 1); i--; }
        if (arr[i].indexOf("{") != -1) tr = tr.substr(0, tr.length-1);
        arr[i] = tr + arr[i];
        if (arr[i].indexOf("}") != -1) tr += "\t";
        if (arr[i].indexOf("Color") != -1) {  // для foregroundColor, backgroundColor... переводим uint значения в шестнадцетиричный формат
            s = arr[i].split(":")[1];
            if (s[s.length-1] == ",") s = s.substr(0, s.length-1);
            if (!isNaN(parseInt(s))) arr[i] = arr[i].split(":")[0] + ":" + parseColor(s) + (s.length == arr[i].split(":")[1].length ? "" : ",");
        }
    }
    return arr.join("\r");
};

// ===================
// Сохраняет объект app.options в формате, возвращаемом функцией parseOptions();
//
BuilderApplication.prototype.saveOptions = function(options) {
    var app = this,
        f = new File(this.resFolder + "options.jsxinc"),
        options = (options)||app.options;
    try {
        f.open("w"); 
        f.write(app.parseOptions(options));
        f.close();
    } catch(e) { trace(e, "saveOptions"); }
};

// ===================
// Отображает окно для редактирования файла настроек (также отображает текущие проинициализированные настройки)
//
BuilderApplication.prototype.editOptions = function(doc) {
    var app = this,
           LStr = app.LStr;
           
    var size = [470, 320];
    var w = new Window ("dialog { text:'"+localize(LStr.uiApp[25])+"', spacing:5, margins:[5,5,5,5], spacing:5, properties:{resizeable:true }, \
                                                    txt:StaticText { text:'"+localize({ru:"Файл настроек:", en:"Settings file:"})+"', alignment:['left','top'] }, \
                                                    code:EditText { preferredSize:["+size[0]+","+size[1]+"], alignment:['fill','fill'], properties:{ multiline:true, scrolling:true } }, \
                                                    sp:"+SUI.Separator + " \
                                                    grp:Group { alignment:['fill','bottom'],  \
                                                        btView:Button { alignment:['left','bottom'], text:'view all', helpTip:'"+localize({ ru:'Показать все текущие настройки', en:'View current options'})+"' }, \
                                                        btSave:Button { alignment:['right','bottom'], text:'Save', helpTip:'"+localize({ ru:'Сохранить и применить', en:'Save and apply'})+"' }, \
                                                        btCanсel:Button { alignment:['right','bottom'], text:'Canсel', helpTip:'"+localize({ ru:'Отмена', en:'Canсel and close'})+"' } \
                                                   }               }");
    SUI.SeparatorInit(w.sp, 'line');
    w.code.text = app.parseOptions(app.loadedOptions);
    w.onResizing = w.onResize = function() { w.layout.resize(); }
    
    w.grp.btCanсel.onClick = function() { w.close(); }
    w.grp.btView.onClick = function() {
        // Окно отображения текущих настроек
        var size = [500, 380];
        var w = new Window ("dialog { text:'"+localize(LStr.uiApp[26])+"', spacing:5, margins:[5,5,5,5], spacing:5, properties:{resizeable:true }, \
                                                    txt:StaticText { text:'"+localize({ru:"Файл настроек:", en:"Settings file:"})+"', alignment:['left','top'] }, \
                                                    code:EditText { preferredSize:["+size[0]+","+size[1]+"], alignment:['fill','fill'], properties:{ multiline:true, scrolling:true, readonly:true } }, \
                                                    sp:"+SUI.Separator + " \
                                                    grp:Group { alignment:['fill','bottom'],  \
                                                        btOk:Button { alignment:['right','bottom'], text:'Close', helpTip:'"+localize({ ru:'Закрыть', en:'Close'})+"' } \
                                                   }               }");
       SUI.SeparatorInit(w.sp, 'line');
       w.code.text = app.parseOptions(app.options);
       w.onResizing = w.onResize = function() { w.layout.resize(); }
       w.grp.btOk.onClick = function() { w.close(); }
       w.show();
    }
    w.grp.btSave.onClick = function() { 
        var err = false;
        try { eval("("+w.code.text+")"); } catch(e) { err = e.description; }
        if (!err) {
            app.options = eval("("+w.code.text+")");
            app.saveOptions();
            app.processingOptions();
            app.initJsNames();
            w.close();
        } else {
            alert(err, ( (app.name || "Application") + localize({ ru:' Ошибка в настройках', en:' Error in settings' }) ), true); 
        }
    }
    w.show();
};

// ===================
// Отображает окно для редактирования файла настроек
//
BuilderApplication.prototype.showSettings = function() {
    this.settingsWindow.show();
};

// ===================
// Создаёт окно и все вкладки для редактирования файла настроек
//
BuilderApplication.prototype.buildSettingsWindow = function() {
    var app = this,
        LStr = this.LStr,
        uiSet = this.LStr.uiSet,
        SettingsFields = this.LStr.uiSet[1];
    app.currentSettings = app.addModel({
        id:"currentSettings",
        options:merge(app.options),
        // Приводит все значения цветов к единому представлению - int
        normalizeColors:function() {
            var appopt = app.options,
                opt = this.options;
            opt.highlightColor = parseInt(parseColor(appopt.highlightColor));
            each(COLORSTYLES.CS, function(val, str) { opt[str] = parseInt(parseColor(appopt[str])) });
            each(COLORSTYLES.CS, function(val, str) { opt.doc[str] = parseInt(parseColor(appopt.doc[str])) });
        }
    });
    app.currentSettings.normalizeColors();
try {
    app.settingsWindow = new Window("palette { text:'"+localize(uiSet[0])+"', spacing:5, margins:[15, 10, 15, 10],\
		gMain:Group {  \
				gLeft:Group {alignment:['left', 'fill'], margins:[0, 6, 0, 0],  \
					lbSettings:ListBox {alignment:['fill', 'fill'], minimumSize:[180, '']}},  \
				gRight:Group {orientation:'stack', alignment:['fill', 'fill'], alignChildren:['fill', 'fill'] }}  \
		gStatus:Group {orientation:'column',  alignment:['fill', 'bottom'], spacing:5, \
				sp:"+SUI.Separator+",  \
				gBtns:Group { alignment:['fill', 'center'], spacing:5, \
					btDefaults:Button { text:'"+localize(LStr.uiApp[43])+"', preferredSize:[113, 23], alignment:['left', 'center']}, \
					sp:"+SUI.Separator+",  \
					btCancel:Button { text:'Cancel', alignment:['right', 'center'] }, \
					btApply:Button { text:'"+localize(LStr.uiApp[44])+"', alignment:['right', 'center'] }, \
					btOk:Button { text:'Ok', alignment:['right', 'center'] }, \
        }}}");
    var w = app.settingsWindow;
    // сокращения:
    SUI.SeparatorInit(w.gStatus.sp, "line");
    SUI.SeparatorInit(w.gStatus.gBtns.sp, "line");
    
    var gRight = w.gMain.gRight;
    // список настроек:
    var mlist = w.gMain.gLeft.lbSettings;
    each(SettingsFields, function(str) { mlist.add("item", localize(str)) });
    // вкладки настроек
    var pages = [
            w.pMain = build_pMain(gRight),
            w.pAppearance = build_pAppearance(gRight),
            w.pNames = build_pNames(gRight),
            w.pColors = build_pColors(gRight),
            w.pFonts = build_pFonts(gRight)
        ];
    each(pages, function(page) { page.enabled = page.visible = false; })
    mlist.selection = 0; 
    mlist.activePage = pages[0];
    pages[0].enabled = pages[0].visible = true;
    // переключение вкладок
    mlist.onChange = function() {
        var page = this.activePage,
            index = this.selection.index;
        // без этой проверки клик по пустой области списка тушит текущее окно но не открывает новое
        if (typeof index == 'number') {
            page.enabled = page.visible = false;
            page = this.activePage = pages[index];
            page.enabled = page.visible = true;
        }
    }
    //w.show();
    
    // --------------------
    // Настройка основных кнопок
    var btns = w.gStatus.gBtns,
        btDefaults = btns.btDefaults,
        btCancel = btns.btCancel,
        btApply = btns.btApply,
        btOk = btns.btOk,
        btSave = btns.btSave;
    
    btCancel.onClick = function() {
        var usercolors = app.options.usercolors,
            list = app.userColorList;
        w.hide();
        // восстанавливаем app.userColorList 
        list.removeAll();
        list._colors.length = 0;
        each(usercolors, function(val, key) {
            app._addToColorList(val, list, key, false, "user");
        });
    };
    
        
    btApply.onClick = function() {
        applyCurrentSettings();
    }
    
    btOk.onClick = function() {
        applyCurrentSettings();
        app.saveOptions(app.currentSettings.options);
        w.hide();
    };

    btDefaults.onClick = function() {
        log(app.parseOptions(app.currentSettings.options));
    };
    
    // --------------------
    // Методы для обновления элементов в окнах настройки
    w.onShow = function() {
        updateAllPanels();
    };
    return app.settingsWindow;
    ///////////
    // --------------------
    // функции обновления настроек
    function updateAllPanels() {
        var options = merge(app.options),
            applist = app.getViewByID("_settings_appcolors"),
            doclist = app.getViewByID("_settings_doccolors"),
            view_hColor = app.getViewByID("_settings_highlightColor"),
            control = view_hColor.control;
        delete applist.render;
        delete doclist.render;
        options.highlightColor = parseInt(parseColor(options.highlightColor));
        extend(app.currentSettings.options, options);
        app.currentSettings.normalizeColors();
        _updateColorsField();
        
        applist.render = doclist.render = _customRender;
        // Не работает автобновление?!!!!
        view_hColor.rebind(app.currentSettings, "selection.value", "options.highlightColor");
        control.selection = control._colors[options.highlightColor].item;
        ///////
        // механизм обновление CS/CC списков
        function _customRender() {
            if (!(this.selection && this.selection.text)) return;
            var opt = (this.label == "appcolors" ? app.currentSettings.options : app.currentSettings.options.doc);
            each(COLORSTYLES[this.selection.text], function(val, key) { opt[key] = val; });
            _updateColorsField();
        };
    
        function _updateColorsField() {
            each(app.settingColorFields, function(control) { control._syncValue(); });
        };
    };
    
    function applyCurrentSettings() {
        var usercolors = app.currentSettings.options.usercolors,
            view_hColor = app.getViewByID("_settings_highlightColor"),
            control = view_hColor.control;
        // Синхронизация usercolors
        each(usercolors, function(val) { app._removeFromAllColorLists(val); });
        app.options.usercolors = {};
        extend(app.options, app.currentSettings.options);
        each(usercolors, function(val, key) { app._addToAllColorLists(val, key, "user"); });
        app.initJsNames();
        app.applyOptions();
        // Не работает автобновление?!!!!
        view_hColor.rebind(app.currentSettings, "selection.value", "options.highlightColor");
        control.selection = control._colors[app.currentSettings.options.highlightColor].item;
        ///////
    };
} catch(e) { trace(e) };    


    
    //////////
    // --------------------
    // Строим панель pMain
    function build_pMain(cont) {
        var panel = cont.add("panel {text:'"+localize(SettingsFields[0])+":', alignment:['fill', 'fill'], alignChildren:['fill', 'top'], spacing:5,  \
								g0:Group {  \
									st0:StaticText {text:'"+localize(uiSet[2])+":', alignment:['left', 'center'], characters:22},  \
									dd0:DropDownList {alignment:['fill', 'center'] }},  \
								g1:Group {  \
									st1:StaticText {text:'"+localize(uiSet[3])+":', alignment:['left', 'center'], characters:22},  \
									dd1:DropDownList {alignment:['fill', 'center'], properties:{items:['dialog', 'palette', 'window']}}},  \
								sp0:"+SUI.Separator+",  \
								g2:Group {alignment:['left', 'top'],  \
									ch0:Checkbox {alignment:['left', 'top']},  \
                                        g3:Group {  \
                                            st2:StaticText {text:'"+localize(uiSet[4])+"', preferredSize:['300', '55'], properties:{multiline:true}}}}  \
								sp1:"+SUI.Separator+",  \
								g3:Group { st:StaticText {text:'"+localize(uiSet[10])+":', alignment:['left', 'center'], characters:22},  \
									dd:DropDownList {alignment:['fill', 'center']}}, \
								sp2:"+SUI.Separator+",  \
            }");
        SUI.SeparatorInit(panel.sp0, "line");
        SUI.SeparatorInit(panel.sp1, "line");
        SUI.SeparatorInit(panel.sp2, "line");
        var langList = MVC.View({ id:"_settings_langList", control:panel.g0.dd0 }),
            dlgTypeList = MVC.View({ id:"_settings_dlgTypeList", control:panel.g1.dd1 }),
            chAutoFocus = MVC.View({ id:"_settings_chAutoFocus", control:panel.g2.ch0 }),
            ddhighlightColor = MVC.View({ id:"_settings_highlightColor", control:panel.g3.dd });
        var list = langList.control,
            index = 0;
        each(UILANGUAGES, function(obj, i) {
            var item = list.add("item", obj.text);
            item.value = obj.value;
            if (app.currentSettings.options.locale == obj.value) index = i;
        });
        list.selection = list.items[index];
        app.views.add(langList);
        app.views.add(dlgTypeList);
        app.views.add(chAutoFocus);
        app.views.add(ddhighlightColor);
        app.addController({ binding:"currentSettings.options.highlightColor:_settings_highlightColor.selection.value", bind:false });
        app.addController({ binding:"currentSettings.options.locale:_settings_langList.selection.value", bind:false });
        app.addController({ binding:"currentSettings.options.dialogtype:_settings_dlgTypeList.selection.text", bind:false });
        var ctrl = app.addController({ binding:"currentSettings.options.autofocus:_settings_chAutoFocus.value", bind:false });

        chAutoFocus.control.onClick = function() { ctrl._updateModel() }
        panel.label = "pMain";
        return panel;

    } // build_pMain();
    
    // --------------------
    // Строим панель pAppearance // цвета и шрифты
    function build_pAppearance(cont) {
        var mainPanel = cont.add("panel {text:'"+localize(SettingsFields[1])+":', alignment:['fill', 'fill'], alignChildren:['fill', 'top']}");
        //mainPanel.margins = [0,15,0,10];
        app.settingColorFields = new Collection();
        
        mainPanel.pProg = build_pSettings(mainPanel, localize(uiSet[5]), app.currentSettings.options, "appcolors");
        mainPanel.pDoc = build_pSettings(mainPanel, localize(uiSet[6]), app.currentSettings.options.doc, "doccolors");
        mainPanel.label = "pAppearance";
        return mainPanel;
        // строится блок нстроек 
        function build_pSettings(cont, caption, options, owner_str) {
            var grp = "group { st:StaticText {alignment:['left', 'center'], characters:22},  \
                               dd:DropDownList {preferredSize:['180', 23]}}";
            var hTips = ["foregroundColor", "backgroundColor", "disabledForegroundColor", "disabledBackgroundColor"];
            var Lstr = LStr.uiSet[7]; // Массив строк
            var panel = cont.add("panel { text:'"+caption+"'}");
            panel.grp = panel.add("group {orientation:'column', alignment:['fill', 'fill'], spacing:2}");
            panel.grp.std = panel.grp.add(grp);
            panel.grp.std.st.text = localize(Lstr[0]);
            panel.grp.std.dd.label = owner_str;
            panel.grp.std.dd.options = options;
            // Добавляем наименования предустановленных текстовых наборов (CS, CC)
            each(COLORSTYLES, function(str, key) { panel.grp.std.dd.add("item", key) });
            //
            app.views.add({ id:"_settings_"+owner_str, control:panel.grp.std.dd });
            app.addController({ binding:"currentSettings.options."+owner_str+":_settings_"+owner_str+".selection.text", bind:false })
            
            var sp = panel.grp.add(SUI.Separator);
            SUI.SeparatorInit(sp, "line");
            var count = 0;
            each(hTips, function(str) {
                var gGrp = panel.grp["p"+str] = panel.grp.add(grp);
                gGrp.st.text = localize(Lstr[++count])+":";
                gGrp.helpTip = gGrp.st.helpTip = gGrp.dd.helpTip = str + localize(uiSet[9]);
                gGrp.dd.label = owner_str;
                gGrp.dd._key = str;
                gGrp.dd._syncValue = _syncValue;
                gGrp.dd.onChange = function() { this._syncValue(this.selection.value) }
                app.settingColorFields.add(gGrp.dd);
            });
            function _syncValue(value) {
                var opt = (this.label == "appcolors" ? app.currentSettings.options : app.currentSettings.options.doc);
                if (typeof value !== 'undefined') opt[this._key] = value; else value = opt[this._key];
                this.selection = this._colors[value].item;
            }
            return panel;
        } // build_pSettings()
    } // build_pAppearance()

    // --------------------
    // Строим панель pNames
    function build_pNames(cont) {
        var panel = cont.add("panel {text:'"+localize(SettingsFields[2])+":', alignment:['fill', 'fill'], alignChildren:['fill', 'top']}");
        var jsnames = panel.jsnames = panel.add("group {alignment:['fill', 'top'], orientation:'column' , alignChildren:['fill', 'top'], spacing:2, \
                                        g0:Group { \
                                            st:StaticText {text:'"+localize(uiSet[8])+":', alignment:['left', 'center'], characters:22},  \
                                            dd:DropDownList {alignment:['fill', 'center'], preferredSize:[90, 23], properties:{items:['small', 'full', 'user']}},  \
                                        }}");
        app.views.add({ 
            id:"_settings_jsname", 
            control:jsnames.g0.dd,
            render:function() {
                _initgNamesFields(this.selection.text);
            }
        });
        app.addController({ binding:"currentSettings.options.jsname:_settings_jsname.selection.text" });
        
        var sp = jsnames.add(SUI.Separator);
        SUI.SeparatorInit(sp, "line");
        var grp = "group { st:StaticText {alignment:['left', 'center'], characters:19},  \
                           et:EditText {alignment:['fill', 'top']}}";
        jsnames.gNames = jsnames.add("group {alignment:['fill', 'top'], orientation:'column' , alignChildren:['fill', 'top'], spacing:0, margins:[20,0,0,0]}");
        //заполняем надписями
        app.gNamesFields = new Collection();
        var counts = 0, blocks = [5, 15, 18], n = 0;
        each(app.uiControls, function(obj){
            var g = jsnames.gNames.add(grp);
            g.et.label = (obj.label == "dialog" ? "Window" : obj.label);
            g.st.text = g.et.label+":";// + (new Array(19 - obj.label.length)).join(".");
            g.et.onChanging = _onChangingJsNameField;
            g.et.onChange = _onChangeJsNameField;
            app.gNamesFields.add(g.et);
            counts++;
            if (counts == blocks[n]) {
                var sp = jsnames.gNames.add(SUI.Separator);
                SUI.SeparatorInit(sp, "line");
                n++;
            };
        });
        
        function _onChangingJsNameField() {
            var gfx = this.graphics,
                SOLID_COLOR = gfx.PenType.SOLID_COLOR,
                jsnames = app.currentSettings.options.jsnames,
                label = this.label;
            
            if (!this.text) { 
                this.text = JSNAMES["full"][label];
                delete jsnames[label];
            } else {
                jsnames[label] = this.text;
            }
            gfx.foregroundColor = gfx.newPen(SOLID_COLOR, (jsnames[label] ? cBlack : cGray), 1);
        };
        
        function _onChangeJsNameField() {
            var gfx = this.graphics,
                SOLID_COLOR = gfx.PenType.SOLID_COLOR,
                jsnames = app.currentSettings.options.jsnames,
                label = this.label;
            gfx.foregroundColor = gfx.newPen(SOLID_COLOR, (jsnames[label] ? cBlack : cGray), 1);
        }
        // инициализируем поля с сокращениями (если сокращение не задано - используется значение из JSNAMES["full"]);
        function _initgNamesFields(txt) { // 'small' || 'full' || 'user'
            var active = (txt == 'user'),
                uiControls = app.uiControls,
                jsnames = app.currentSettings.options.jsnames;
            each(app.gNamesFields, function(obj) {
                obj.enabled = active;
                obj.text = (active ? (jsnames[obj.label])||JSNAMES["full"][obj.label] : JSNAMES[txt][obj.label]);
                obj.notify("onChange");
            });
        };
        _initgNamesFields(jsnames.g0.dd.selection.text);
        
        panel.label = "pNames";
        return panel;
    } // build_pNames()

    // --------------------
    // Строим панель pNames
    function build_pColors(cont) {
        var panel = cont.add("panel {text:'"+localize(SettingsFields[3])+":', alignment:['fill', 'fill'], alignChildren:['fill', 'top'],\
            g0:Group {alignment:['fill', 'fill'],  \
                lb0:ListBox {alignment:['fill', 'fill'], preferredSize:[180, 250]},  \
                    g1:Group {spacing:5, orientation:'column', alignment:['right', 'fill'], alignChildren:['center', 'top'],  \
                        btAdd:Button {text:'Add'},  \
                        btRename:Button {text:'Edit...'},  \
                        btRemove:Button {text:'Remove'} \
            }}}");
        var list = panel.g0.lb0,
            btAdd = panel.g0.g1.btAdd,
            btRename = panel.g0.g1.btRename,
            btRemove = panel.g0.g1.btRemove;
        app.userColorList = list;
        
        btRemove.onClick = function() {
            if (!list.selection) return;
            var value = list.selection.value,
                name = list.selection.text.slice(1);
            list.removeValue(value);
            delete app.currentSettings.options.usercolors[name];
        };
    
        btRename.onClick = function() {
            if (!list.selection) return;
            var value = list.selection.value,
                name = list.selection.text.slice(1),
                w = app.createEditDlg(name);
            if (w.show() == 1 && w.g0.et0.text) {
                list.removeValue(value);
                delete app.currentSettings.options.usercolors[name];
                name = w.g0.et0.text;
                app._addToColorList(value, list, name, false, "user");
                app.currentSettings.options.usercolors[name] = value;
                list.selection = list.items[list.items.length-1];
            }
        };
        
        btAdd.onClick = function _addColor() {
            var control = app.getViewByID("fontColor").control,
                value = $.colorPicker();
            if (value == -1) return false;
            if (value in control._colors) {
                var item = control._colors[value].item,
                    msg = localize(app.LStr.uiSet[11], item.text, parseColor(item.value)),
                    title = app.version + " " + app.name + " - " + localize(app.LStr.uiSet[12]);
                if (confirm (msg, false, title)) { return _addColor(); } else { return false };
            }
            var rgb = toRGB(value),
                name = "r="+rgb[0]+",g="+rgb[1]+",b="+rgb[2]+" ("+parseColor(value)+")",
                w = app.createEditDlg(name);
            if (w.show() == 1 && w.g0.et0.text) {
                name = w.g0.et0.text;
            }
            app._addToColorList(value, list, name, false, "user");
            app.currentSettings.options.usercolors[name] = value;
            list.selection = list.items[list.items.length-1];
        };
    
        panel.label = "pColors";
        return panel;
    }
    // --------------------
    // Строим панель pFonts
    function build_pFonts(cont) {
        var panel = cont.add("panel {text:'"+localize(SettingsFields[4])+":', alignment:['fill', 'fill'], alignChildren:['fill', 'top'],\
            g0:Group {alignment:['fill', 'fill'],  \
                lb0:ListBox {alignment:['fill', 'fill'], preferredSize:[180, 250]},  \
                    g1:Group {spacing:5, orientation:'column', alignment:['right', 'fill'], alignChildren:['center', 'top'],  \
                        btAdd:Button {text:'Add'},  \
                        btRename:Button {text:'Edit...'},  \
                        btRemove:Button {text:'Remove'} \
            }}}");
        var list = panel.g0.lb0,
            btAdd = panel.g0.g1.btAdd,
            btRename = panel.g0.g1.btRename,
            btRemove = panel.g0.g1.btRemove;
        app.userFontList = list;
        
        panel.label = "pFonts";
        return panel;
    }
}; // showSettings