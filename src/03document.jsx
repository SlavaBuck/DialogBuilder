/**************************************************************************
*  03document.jsx
*  DESCRIPTION: BuilderDocument: Класс документа (представляет редактируемый диалог)
*  @@@BUILDINFO@@@ 03document.jsx 1.40 Thu Jun 05 2014 01:40:30 GMT+0300
* 
* NOTICE: 
* 
/**************************************************************************
* © Вячеслав aka SlavaBuck, 10.02.2014.  slava.boyko#hotmail.com
*/

function BuilderDocument(appRef) {
    if (!(this instanceof BuilderDocument)) return new BuilderDocument(appRef);
    // Вызов базового конструктора
    BuilderDocument.prototype.__super__.constructor.call(this, appRef, { view:"tab { margins:[0,0,0,0] }" });
    this.modified = true; // сигнализирует о несохранённых изминениях
};

inherit (BuilderDocument, MVCDocument);
// Фильтры окна открытия/сохранения документов
                                     
// Функции сохранения и открытия
BuilderDocument.prototype.load = function() {
    var doc = this,
           app = doc.app;
    //$.locale = doc.app.options.locale;        // язык интерфейса
    // К моменту вызова этого метода уже должны быть установлены свойства name и file в прототипном методе приложения loadDocument...
    if (!this.file.exists) return false;
    try {
        //....
        app.window.text = app.version + " " + app.name + " - " +doc.name; // убрать в дщкумент document load
        return true;
    } catch(e) { log(e.description); return false; }
};

    
BuilderDocument.prototype.save = function() {
    var doc = this,
        app = doc.app,
        LStr = app.LStr;
    //$.locale = doc.app.options.locale;        // язык интерфейса
    try {
        if (!doc.file || !doc.file.exists ) {
           var msg = localize(LStr.uiApp[24]) + (doc.name[0] == '*' ? doc.name.slice(1) : doc.name);
           doc.file = File.saveDialog(msg, app.filters); 
           if (!doc.file) return false;
           if (doc.file.exists) {
                if (! confirm(localize(LStr.uiErr[1]), true, doc.app.name) ) { doc.file = null; return doc.save(); } else {
                    var name = File.decode(doc.file.name);
                    // Ищем открытый файл с таким именем
                    if (doc.app.documents.getFirstByKeyValue('name', name) || doc.app.documents.getFirstByKeyValue('name', '*'+name)) {
                        if (confirm(localize(LStr.uiErr[2]), true, doc.app.name)) { doc.file = null; return doc.save(); } else { doc.file = null; return false; }
                    }
                }
           }
        }
        doc.name = File.decode(doc.file.name);
        app.window.text = app.version + " " + app.name + " - " +doc.name;
        doc.file.open("w");
        var str = localize({ ru:"// Файл создан с помощью ", en:"// File created with " }) + doc.app.name + " v"+doc.app.version + "\r\r";
        doc.file.write(str + doc.getSourceString());
        doc.file.close();
        doc.modified = false;
        return true;
    } catch(e) { log(e.description); return false; }
};

BuilderDocument.prototype.saveAs = function() {
    var doc = this,
        LStr = doc.app.LStr;    
    try {
        var msg = localize(LStr.uiApp[24]) + (doc.name[0] == '*' ? doc.name.slice(1) : doc.name);
        doc.file = File.saveDialog(msg, app.filters); 
        if (!doc.file) return false;
        if (doc.file.exists) {
            if (confirm(localize(LStr.uiErr[1]), true, doc.app.name) ) { 
              return doc.save(); //doc.file = null; 
            } else {
              doc.file = null; return false;
            }
        } else {
            doc.file.open("w"); doc.file.write("test"); doc.file.close();
        }
        return doc.save();
    } catch(e) { log(e.description); return false; }
};

// Основные методы документа:
// Добавление элемента в диалог
BuilderDocument.prototype.addItem = function (item) {
    if(!item) return null;
    var doc = this,
           app = doc.app,
           uiCategories = app.uiCategories,
           uiProperties = app.uiProperties,
           uiControls = app.uiControls;
   doc.modified = true;
   var CPROPS = COLORSTYLES.CS;
   // Добываем type добавляемого ScriptUI объекта в нижнем регистре!
    var type, x1, x2, x = Math.min(x1 = item.indexOf(' '), x2 =item.indexOf('{'));
    if (x == -1) {
        if (x1 == -1) {
            if (x2 == -1) type = item.toLowerCase(); else type = item.substr(0, x2).toLowerCase();
        } else type = item.substr(0, x1).toLowerCase();
    } else type = item.substr(0, x).toLowerCase();
    var contrl = ((type == 'dialog' || type == 'palette') ? 'panel' : type)  + item.slice(type.length);
    var item = (type == 'dialog' || type == 'palette') ? 'Window' : item.substr(0, type.length);

    // Определяем контейнер для добавляемого контрола
    if (!doc.activeContainer) doc.activeContainer = doc.window;  // только при первом вызове
    if (type == 'tab' && doc.activeContainer.type != 'tabbedpanel') return; // танцы с tabbedpanel
    if (doc.activeContainer.type == 'tabbedpanel' && type != 'tab') return; //doc.activeContainer = doc.findController(doc.activeControl).view.control;
    if (! doc._counters_.hasOwnProperty(item)) doc._counters_[item] = 0;
    // Данная модель представляет данные самого элемента управления
    /*
            Пока до конца не решён вопрос с использованием библиотеки SimpleUI (как собственно и с её архитектурной) будем временно использовать
            костыль с предварительным парсингом представлений из данной библиотеки и последующей специальной инициализацией.
       */
    if (type == 'separator') { contrl = SUI.Separator; }
    var ctrl = merge(uiControls[item]);
    ctrl.jsname = uiControls[item].jsname + (doc._counters_[item]++);
    ctrl.id = doc.id + ctrl.jsname;
    // Данная модель представляет данные самого элемента управления
    var model = doc.addModel({ 
        id:ctrl.id, 
        control:ctrl,                                                     // отражает соостояние графического элемента и связывается с полями редактирования
        properties:merge(uiControls[item].properties), // содержит флаги к соответствующим свойствам, которые определяют добавление свойства в результатирующий документ(диалог)
        code:{ varname:"", gfxname:"", initcode:"", initgfx:""},     // содержит код инициализации ui-элемента (формируется динамически)
        view:null,                                                       // view - вспомогательный указатель на соответсвующее реальное представление
        // Метод формирует и возвращает ресурсную ScriptUI-строку для данной ui-модели (свойства в строку попадают в зависимости от флагов из model.properties.properties)
        toSourceString:function(tr) {
            var model = this.control,
                  props = this.properties,
                  control = this.view.control,
                  str = ((tr)||'') + model.jsname+":"+model.label + " {",
                  ptr = "properties:{" + _toSource(props.properties, control.properties, model.properties.properties, "prop"),
                  sstr = _toSource(props, control, model.properties, "main");
            if (sstr.length) str += sstr;
            if (ptr.length != 12) str += (sstr.length == 0 ? "": ", ") + ptr + "}";
            return str += "}";
            function _toSource(prop_obj, control_obj, model_obj, model) {
                var str = '',
                    val, val1;
                for (var p in prop_obj) if (prop_obj.hasOwnProperty(p) && p != 'properties' && p != 'graphics' && prop_obj[p] === true) {
                    try {
                        str += p + ":"
                        //val = control_obj[p];
                        val = model_obj[p];
                        // специальная обработка для image
                        if (p == 'image') { val = model_obj[p][0]; }
                        switch (typeof val) {
                            case 'boolean': 
                            case 'number': str += val+", "; break;
                            case 'string':
                                if (app.uiProperties[p].type == "Number") str += (val.indexOf(".") != -1 ? parseFloat(val) : parseInt(val))+", "; else {
                                    val = val.replace(/"/g, "\\\"").replace(/'/g, "\\\\'");
                                    str += "'"+val+"', "; 
                                }
                                break;
                            default: str += model_obj[p].toSource().replace(/'/g, "\\\\'").replace(/"/g, "'")+", "; // str += val.toSource().replace(/"/g, "'")+", "; //
                        }
                    } catch(e) { log(model_obj.toSource()); trace(e, p); }
                } // for
                return str.slice (0, -2); // убираем последнюю запятую
            } // function _toSource()
        }, // model._toSourceString()
         // Метод формирует и возвращает строку, содержащую JavaScript код для дополнительной инициализации элемента
        getCode:function() {
            var model = this.control,
                   props = this.properties,
                   control = this.view.control,
                   code = this.code;
           var ctrl = control,
                  dlg = doc.window.children[0],
                  names = [];
           // Для начала найдём главное родительское окно (у него свойства parent всегда = null
           if (ctrl === dlg) code.varname = model.jsname; else {
               while ( ctrl !== dlg) { 
                   names.push(doc.findController(ctrl).model.control.jsname);
                   ctrl =  ctrl.parent; 
               };
               code.varname =  "var " + model.jsname + " = " + doc.findController(dlg).model.control.jsname + "." +names.reverse().join(".");
           }
           code.gfxname = "var gfx = " + model.jsname +".graphics";
           var font = "", colors = [], strs = [];
           for (var p in props.graphics) if (props.graphics.hasOwnProperty(p) && props.graphics[p]) {
               if ( p in CPROPS) {
                    if (p.match(/foreground/i)) colors.push( "gfx."+p+" = "+"gfx.newPen(gfx.PenType.SOLID_COLOR, "+toRGBA(model.properties.graphics[p]).toSource()+", 1)");
                    else colors.push( "gfx."+p+" = "+"gfx.newBrush(gfx.BrushType.SOLID_COLOR, "+toRGBA(model.properties.graphics[p]).toSource()+")");
               } else if ( p == "font" ) { 
                   font = "gfx.font = ScriptUI.newFont(\""+model.properties.graphics.font+"\")"; 
               } else {
                   strs.push("gfx."+[p]+" = " + model.properties.graphics[p]);
               }
           }
           var gfxstr = [];
           if (font || colors.length || strs.length) {
               gfxstr.push(code.gfxname);
               if (font) gfxstr.push(font);
               if (colors.length) for (var i=0; i<colors.length; i++) gfxstr.push(colors[i]);
               if (strs.length) for (var i=0; i<strs.length; i++) gfxstr.push(strs[i]);
           }; 
           var retval = (control === dlg ? "" : code.varname + ";\r" );
           // формируем общую строку кода инициализации:
           if (gfxstr.length) code.initgfx = retval += gfxstr.join(";\r")+";\r"; else code.initgfx = "";
           if (code.initcode) retval += code.initcode + "\r";
           // временное решение для сепараторов:
           if (control.isSeparator) {
               var parent = doc.findController(control.parent).model;
               parent.getCode();
               parent = (parent.code.varname.indexOf("=") ? parent.code.varname.slice(parent.code.varname.indexOf("=")+1) : parent.code.varname);
               if (parent[0] == " ") parent = parent.slice(1);
               retval = retval.replace(/<parent>/, parent).replace(/<this>/g, model.jsname);
           };
           // временное решение для dialog:
           code.initresizing = (props.properties.resizeable ? model.jsname + ".onResizing = " + model.jsname + ".onResize = function() { this.layout.resize () };\r" : "");
           
           return (code.initcode || gfxstr.length) ? retval : "";
        }
    }); 
    
    // *** Блок обновления данных модели *** //   
    var  list = app._ceditors.getFirstByKeyValue('id', "fontColor").control, 
           model_prop = model.control.properties.graphics,
           color_opt = app.options.doc;
    for (var p in model_prop) if (model_prop.hasOwnProperty(p) && CPROPS.hasOwnProperty(p)) {
        if (model_prop[p] === false) model_prop[p] = color_opt[p];
        if (!list.hasOwnProperty(model_prop[p])) app._addToColorList(model_prop[p]); // добавляем цвет в набор, если его там небыло...
    }
    if (model_prop.hasOwnProperty('font') &&  !model_prop.font) model_prop.font = color_opt.font;
    
    // *** *** //

    //log(item, (model.control.type == 'Container' || (type in bkgctrl)));
    model.view = doc.addView({ 
        id:model.id, 
        parent:doc.activeContainer,
        view:contrl,
        render:customUpdate,
        Init:function(){
            try {
                var self = this,
                    type = this.type,
                    gfx = this.graphics,
                    model_prop = model.control.properties.graphics; // пробрасываем локально
                // *** Блок обновления данных элемента данными модели *** //
                for (var p in model_prop) if (model_prop.hasOwnProperty(p) && CPROPS.hasOwnProperty(p)) {
                    gfx[p] = (p.match(/foreground/i) ? gfx.newPen(_PSOLID, toRGBA(model_prop[p]), 1) : gfx.newBrush(_BSOLID, toRGBA(model_prop[p])) );
                }
                if (model_prop.hasOwnProperty('font') && model_prop.font) gfx.font = ScriptUI.newFont(model_prop.font);

                if (type == 'listbox' || type == 'dropdownlist' ) {
                    model.control.properties.properties.items = ["Some Text 1", "Some Text 2"];
                    each(model.control.properties.properties.items, function(str) { self.add("item", str) });
                }
                if (type == 'group' || type == 'image') { if (!this.preferredSize[0] && !this.preferredSize[1]) this.preferredSize = [8, 15] }
                //if (type != 'tabbedpanel' && type != 'iconbutton' && this.hasOwnProperty('text')) this.text = model.control.jsname;
                // Специальная обработка для Separator-ов
                if (this.isSeparator) SUI.SeparatorInit(this, 'line');
                // Обязательно патчим свойство alignment
                if (!this.alignment && this.parent) { this.alignment = this.parent.alignChildren }
                // *** *** //
                var c = app.options.highlightColor;
                //gfx._marked = gfx.newBrush(_BSOLID, app.options.highlightColor);
                gfx._marked = gfx.newBrush(_BSOLID, [c[0], c[1]/1.5, c[2], 0.5]);
                //gfx._unmarked = gfx.newBrush(_BSOLID, [c[0], c[1]/1.5, c[2], 0]);
                //if (model.control.type == 'Container') gfx.foregroundColor =  gfx.newPen(_PSOLID, [0,0,0,1], 1); 

                // Обновляем размеры окна документа
                doc.window.layout.layout(true);
            } catch(e) { log('addView: Init():', e.description) }
        },
        control: { 
            _marked_:true, // сигнализирует о том, что элемент выбран и выделен
            text: (uiControls[item].properties.hasOwnProperty('text') && type != 'tabbedpanel') ? model.control.jsname : "",
            //onDraw:customDraw
            onDraw:(model.control.type == 'Container' || "listbox,separator".indexOf(type) != -1 ) ? undefined : customDraw
        }
    });
    /*
            Пока до конца не решён вопрос с использованием библиотеки SimpleUI (как собственно и с её архитектурной) будем временно использовать
            костыль с предварительным парсингом представлений из данной библиотеки и последующей специальной инициализацией.
       */
    if (type == 'separator') { 
        model.code.initcode += "if (<parent>.orientation == 'column') { <this>.maximumSize[1] = 1; <this>.alignment = ['fill', 'top']; } else { <this>.maximumSize[0] = 1; <this>.alignment = ['left', 'fill']; };";
    }
    
    if (model.control.properties.hasOwnProperty('text')) model.control.properties.text = model.view.control.text;
    // Теперь необходимо связать все свойства модели с соответствующими свойствами представления (это позволит в реальном времени 
    // изменять значения свойств модели и её графическое состояние). Свойства цвета и шрифта требуют специальной обработки:
    //
    // Связывание контролёрами всех свойств модели со свойствами графического элемента
    // _modifyController в зависимости от класса и типа свойства назначает специальные обработчики _updateView (обновляющие представление)
    // для соответствующих контролёров:
    // - обработчик _updViewMsts (размер и положение объекта)                 - в связи с необходимостью дополнительного обхода связанных свойств
    // - обработчик _updViewAlign (выравнивания объекта в контеёнере) - из за каличного поведения некоторых свойств в ScripUI - alignment и т.п.)
    if (!model.view.control.properties) model.view.control.properties = {};
    var model_bstr = "", view_bstr = "", 
           view_prop, val, defval, p, i, 
          propers = model.control.properties;  
    for (p in uiProperties) if (!(CPROPS.hasOwnProperty(p) || p == 'font')) { 
try {         
        if (propers.hasOwnProperty(p)) {
                model_bstr = model.id + ".control.properties." +p; view_bstr = model.id + "."+p;
                model_prop = model.control.properties; view_prop = model.view.control;
            } else if (propers.properties.hasOwnProperty(p)) { 
                model_bstr =  model.id + ".control.properties.properties."+p; view_bstr = model.id + ".properties."+p; 
                model_prop = model.control.properties.properties; view_prop = model.view.control.properties; 
            } else if (propers.graphics.hasOwnProperty(p)) { 
                model_bstr =  model.id + ".control.properties.graphics."+p; view_bstr = model.id + ".graphics."+p; 
                model_prop = model.control.properties.graphics; view_prop = model.view.control.graphics; 
        } else continue; // for (p in uiProperties)

        // везде обновляем модель только в случае необходимости (отсутствия значения у самой модели)!
        val = uiProperties[p].value;   // Представляет объект из uiProperties.value типа '' или массив (['',''] или ['','','','']) 
        defval = uiProperties[p].defvalue;
        try { if (view_prop[p] === undefined) view_prop[p] = (model_prop[p] !== false) ? model_prop[p] : ((defval !== undefined) ?  defval : val ); } catch(e) { e.description }; // Errors: shortcutKey, icon { log(p, e.description) }
        if (val instanceof Array) {    // свойство объекта массив! (alignment, alignChildren, bounds, size....)
            if (typeof view_prop[p] == 'string') {
                for (i = 0; i<val.length; i++) val[i] = view_prop[p];
                view_prop[p] = val;
            }
            if (!model_prop[p]) model_prop[p] = new Array(val.length);
            for (i=0; i<val.length; i ++) {
                if (model_prop[p][i] !== view_prop[p][i]) model_prop[p][i] = view_prop[p][i];
                _modifyController(p, doc.addController({ binding:model_bstr+"."+i+":"+view_bstr+"."+i, bind:false })); // Переопределяем _updateView
            } // for
        } else { // свойство объекта - одно значение или объект
             if (!model_prop[p]) model_prop[p] = view_prop[p];
             _modifyController(p, doc.addController({ binding:model_bstr+":"+view_bstr, bind:false })); // Переопределяем _updateView            
        } // else
} catch(e) { log('rebind:', p, e.description) }           
    } // for (p in uiProperties)

    app.models.add(model);
    doc.activeControl = model;
    // Добавляемся в список Tree
    app.treeView.addItem(doc.activeControl);

    return model;
    // ------------------------------------------------------------------------------------------------------------------------------------
    // Данные функции добавлены сюда для ускорения доступа к ним из представления модели 
    // ------------------------------------------------------------------------------------------------------------------------------------
    // Отображаемся с учётом собственного свойства _marked_
    function customDraw(ds) {
        var gfx = this.graphics,
               x = this.size[0],
               y = this.size[1];
        gfx.drawOSControl();
        // аккуратное выделение:
        if (this._marked_) {
            if (this.type == 'button' || this.type == 'iconbutton') gfx.rectPath(2,2, x-4, y-4); else gfx.rectPath(0,0, x, y);
            gfx.fillPath(gfx._marked);
        }
        if (this.type == 'checkbox' || this.type == 'radiobutton') {
            y = (y - gfx.measureString(this.text)[1])/2; 
            gfx.drawString(this.text, gfx.foregroundColor, 16, (y < 0 ? 0 : y));
        }
    };
    // Дополнительно вызывается при обновлении модели (Предназначена в основном для обновления ращмеров элемента, связанного с обновлением
    // размера текста.
    function customUpdate(ctrl, newVal, oldVal, key) {
        // this указывает на элемент управления!!
        // Исключаем из обработки случаи, для которых были предусмотрены специальные обработчики:
        if (ctrl.special) return; // _updViewMsts и _updViewAlign повторно обрабатывать не нужно!
        if (ctrl.binding.indexOf(".image.") != -1) return; // исключаем работу для свойства image;
        try {
            //log('customUpdate', key, ctrl.binding, '\r', oldVal, newVal);
            if (key == 'text' && this.hasOwnProperty('text') && !ctrl.model.properties.size) { 
                var ctrls = ctrl.model._controllers,
                      model_obj = ctrl.model.control.properties,
                      control = this,
                      gfx = control.graphics,
                      oldSize = gfx.measureString(oldVal),
                      textSize = gfx.measureString(newVal), //, gfx.font, this.size[0]),
                      x = control.size[0] + (textSize[0]-oldSize[0]), x = (x<0) ? 0 : x, 
                      y = control.size[1] + (textSize[1]-oldSize[1]), y = (y<0) ? 0 : y;
                switch (control.type) {
                    case 'button': x = (x<80 || textSize[0]< 52) ? 80 : textSize[0] + 28; break;
                    // iconbutton ... нужно посчитать..
                    default:
                }
                app._getField('size0').control.text = ctrl.model.control.properties.size[0] = x;
            } else {
                var prop = ctrl.binding.split(':')[0].split('.'),
                      prop = (parseInt(prop[prop.length -1]) ? prop[prop.length - 2] : prop[prop.length - 1]);
                if (uiProperties[prop].type == "Boolean") {
                    if (newVal == '') newVal = (uiProperties[prop].defvalue) || false;
                    ctrl.model_obj[prop] = ctrl.view_obj[prop] = (newVal == 'true') ? true : false;
                }
                ctrl.app.window.layout.layout(true); 
                ctrl.app.window.layout.resize();
            }
        } catch(e) { log('customUpdate:', e.description + "\r", key, prop); }
    };

    // ------------------------------------------------------------------------------------------------------------------------------------
    // Данные функции заменяют стандартный механизм _updateView из библиотеки MVC 
    // Оказалось, что определённые свойства ScriptUI объектов - динамические (происходит нечто подобное смены адреса (например для свойства alignment) 
    // после присвоения ему нового значения). В связи с этим такие свойства нужно обновлять "в-ручном" режиме, для них нужны отдельные обновлялки.
    function _modifyController(p, ctrl) {  // Переопределяем _updateView
        switch (uiProperties[p].category) {
            case "Measurements":    if (p != "indent" || p != "justify") ctrl._updateView = _updViewMsts;   break;
            case "Alignment":       if (p != "orientation") ctrl._updateView =  _updViewAlign;              break;
            //case "Image":           if (p != "orientation") ctrl._updateView =  _updViewAlign;              break;
            default:
        }
    };

    // Специальная обработка для свойств размера
    function _updViewMsts(newVal, oldVal, key) {
        // this указывает на объект контролёра. watch не работает. (данные модели требуют обновления вручную)
        // this.model_obj уже имеет новое значение, инициализированное в диспатчере
        this.special = true; // Ставим метку в котроллёре, чтобы повторно не отрабатывать в customUpdate: 
        var model_obj = this.model_obj,
               model_pro = this.model.control.properties,
               control = this.view.control,
               w = this.app.window,
               prop = this.binding.split(':')[0].split('.');
               prop = (key == 'characters') ? key : prop[prop.length -2];
        switch (prop) {
            case 'characters':
                control.characters = newVal;
                if (!app._getField('size0').check.value) {
                    var sz = control.graphics.measureString((new Array(parseInt(newVal)+1)).join("X"));
                    sz[0] += this.model.control.defaults.size[0];
                    switch (control.type) { // Нужно проверить с разными размерами шрифтов!!!
                        case 'checkbox':
                        case 'radiobutton':  
                        case 'statictext':      break;
                        case 'edittext':         sz[0] -= 10; sz[1] += 6;break;
                        default:                 
                    }
                    app._getField('size0').control.text = model_pro.size[0] = sz[0];
                    app._getField('size1').control.text = model_pro.size[1] = sz[1];
                }
                break;
            case 'size':
                control.preferredSize[key] = control.size[key] = model_obj[key];
                w.layout.layout(true); w.layout.resize();
                key = parseInt(key)+2;
                app._getField('bounds'+key).control.text = control.bounds[key];
                //app._getField('preferredSize'+key).control.text = control.preferredSize[key];
                break;
            case 'preferredSize':
                control.preferredSize[key] = model_obj[key];
                w.layout.layout(true); w.layout.resize();
                if (!app._getField('size0').check.value) { 
                    control.size[key] = control.preferredSize[key];
                    w.layout.layout(true); w.layout.resize();
                    app._getField('size'+key).control.text = control.size[key];
                }
                key = parseInt(key)+2;
                app._getField('bounds'+key).control.text = control.bounds[key];
                break;
            case 'minimumSize': control.minimumSize[key] = model_obj[key]; break; 
            case 'maximumSize': control.maximumSize[key] = model_obj[key]; break;
            case 'bounds': control.bounds[key] = model_obj[key]; break;
            case 'location':
                control.location[key] = model_obj[key];
                w.layout.layout(true); w.layout.resize();
                model_pro.bounds[key] = control.bounds[key];
                app._getField('bounds'+key).control.text = control.bounds[key];
                break;
            default:
                log("_updViewMsts: "+prop+" - unrecognized key '"+key+"', newVal =", newVal);
        }
    };

    // Специальная обработка для свойств выравнивания
    function _updViewAlign(newVal, oldVal, key) {
        // this указывает на объект контролёра. watch не работает. (данные модели требуют обновления вручную)
        // this.model_obj уже имеет новое значение, инициализированное в диспатчере
         this.special = true; // Ставим метку в котроллёре, чтобы повторно не отрабатывать в customUpdate: 
    try {
        var model_obj = this.model_obj,
               model_pro = this.model.control.properties,
               control = this.view.control,
               w = this.app.window,
               prop = this.binding.split(':')[0].split('.'),
               prop = (key == 'spacing' || key == 'indent' || key == 'justify' ) ? key : prop[prop.length -2];
        switch (prop) {
            case 'margins':
            case 'alignChildren':
                control[prop][key] = model_obj[key];
                w.layout.layout(true); w.layout.resize();
                break;
            case 'alignment': // Обновлять нужно массив целиком!!! control[prop][key] = newVal или control[prop][key] - model_obj[key] не работает!!!
                control[prop] = ((key == '0') ? [newVal, model_obj[1]] : [model_obj[0], newVal]);
                if (newVal == '' && !app._getField('location0').check.value && control.parent) {
                        control[prop] = ((key == '0') ? [control.parent.alignChildren[0], control[prop][1]] : [control[prop][0], control.parent.alignChildren[1]]);
                }
                if (oldVal == 'fill' && newVal != 'fill') { // Восстанавливаем размер по предыдущему значению размера в модели!
                    control.size[0] = model_pro.size[0];
                    control.size[1] = model_pro.size[1];
                } 
                w.layout.layout(true); w.layout.resize();
                break;
            case 'spacing':
            case 'indent':
            case 'justify':
                control[prop] = newVal;
                w.layout.layout(true); w.layout.resize();
                break;
             default:
                 log("_updViewAlign: "+prop+" - unrecognized key '"+key+"', newVal =", newVal);
            }
            // Теперь нужно обновить данные location и bounds в моделях всех детей, а также скорректировать свои собственные модели включая size и bounds
            // скорректируем размер
            // Корректируем выравнивание детей
            var i, j, max, jmax, items, ctrls, val;
            if (prop == 'alignChildren') {
               for (i=0, items = app.treeView.control.activeItem.items, max = items.length; i<max; i++) {
                    if (items[i].model.properties.alignment) continue;
                    items[i].model.control.properties.alignment[key] = newVal;
                }
            } else if (prop == 'margins' || prop == 'spacing') {
               for (i=0, items = app.treeView.control.activeItem.items, max = items.length; i<max; i++) {
                    if (items[i].model.properties.location) continue;
                    items[i].model.control.properties.location[0] = items[i].model.view.control.location[0];
                    items[i].model.control.properties.location[1] = items[i].model.view.control.location[1];
                }
            }

            // Корректируем собственные данные 
            app._getField('location0').control.text = model_pro.location[0] = control.location[0]; // Bounds исправится автоматом
            app._getField('location1').control.text = model_pro.location[1] = control.location[1];                 
            if (prop == 'margins' || prop == 'spacing') {  // Доработать!!! 
                if (!app._getField('size0').check.value) { // Доработать!!! Изменять и восстанавливать размер после смены margins
                    app._getField('size0').control.text = model_pro.size[0] = control.size[0];
                    app._getField('size1').control.text = model_pro.size[1] = control.size[1];
                 } else {
                    app._getField('size0').control.text =  app._getField('preferredSize0').control.text = control.preferredSize[0] = control.size[0] = model_pro.preferredSize[0] = model_pro.size[0];
                    app._getField('size1').control.text =  app._getField('preferredSize1').control.text = control.preferredSize[1] = control.size[1] = model_pro.preferredSize[1] = model_pro.size[1];
                    w.layout.layout(true); w.layout.resize();
                }
                app._getField('bounds2').control.text = model_pro.bounds[2] = control.bounds[2];
                app._getField('bounds3').control.text = model_pro.bounds[3] = control.bounds[3];
            } // if (prop == 'margins' || prop == 'spacing')
        } catch(e) { log("_updViewAlign:", e.description, prop + '['+key+'] =', newVal, ", model_obj =", model_obj+ ", newVal =", newVal ) }
    };

};

// Документ - удаление контрола (активного)
BuilderDocument.prototype.removeItem = function(model) {
    var doc = this,
           tree = doc.app.treeView,
           model = (model)||tree.control.activeItem.model,
           control = (model === null) ? null : model.view.control;
    if (!control) { log("control == null, такого быть не должно!!!"); return null; }
    if (model === doc.models[0]) { log("Нельзя удалить, как вариант - закрываем документ"); return null; }
    doc.modified = true;
    doc.activeControl = null; 
    // Запоминаем текущий элемент и его индекс в родительском контейнере
    var oldItem = tree.control.activeItem;
    for (var index=0, children=control.parent.children; index<children.length; index++) if ( children[index] === control) break;
    try {
    // Определяем следующий активный контрол и контэйнер, переключаемся на него в дереве, а затем и в диалоге
    if (tree.control.activeItem === tree.control.activeNode) {
        tree.control.activeItem = tree.control.activeNode = tree.control.activeNode.parent;
    } else {
        if (index == 0) {
            if (children.length == 1) tree.control.activeItem = tree.control.activeNode; else tree.control.activeItem = tree.control.activeNode.items[1];
        } else {
            if (index + 1 < children.length) index += 1; else index -= 1;
            tree.control.activeItem = tree.control.activeNode.items[index];
        }
    }
    // Удаляем из диалога
    (function _removeItems(doc, node) {
        if (node && node.model) {
            if (node.type == 'node') {
                for (var i=0, items = node.items, max = items.length; i<max; i++) try {
                    if (items[i].type == 'node') _removeItems(doc, items[i]); else { doc.app.removeModel(items[i].model.id); doc.removeMVC(items[i].model); }
                } catch(e) { continue; }; // for
            }
            doc.app.removeModel(node.model.id);
            doc.removeMVC(node.model);
        }
    }(doc, oldItem));
    tree.removeItem(oldItem);                // Удаляем элемент(ы) из дерева
    doc.window.layout.layout(true);
    // устанавливаем активные указатели:
    tree.control.selectItem(tree.control.activeItem); 
    doc.activeControl = tree.control.activeItem.model;
    doc.activeContainer = tree.control.activeNode.model.view.control;
    } catch(e) { _debug(e) }
    return doc.activeControl;
};

BuilderDocument.prototype.getSourceString = function() {
    var tree = this.app.treeView.control,
           dlg = tree.items[0].model,
           str = '', code = [];
    str = (function _buildString(str, tr, node, code) {
        var str = node.model.toSourceString(tr).slice(0, -1)+", \r\t"+tr;
        var str1 = node.model.getCode();
        if (str1) code.push(str1);
        for (var i=0; i<node.items.length; i++) {
            if (node.items[i].type == 'node') {
                str += _buildString(str, tr+"\t", node.items[i], code).slice(0, -2) + "}, \r"+tr+"\t"; 
            } else {
                str += node.items[i].model.toSourceString(tr)+", \r"+tr+"\t";
                str1 = node.items[i].model.getCode();
                if (str1) code.push(str1);
            }
        }
        return str.slice(0, -4) + "}\r";
    }('', '', tree.items[0], code));
    str = "var "+ tree.items[0].model.control.jsname + " = new Window(\""+ str.slice(str.indexOf(":")+1, -1) +"\");";
    str = str.replace(/{,/g,"{").replace(/\r}, /g,"},").replace(/, }/g,",}").replace(/,}/g,"}").replace(/\r/g," \\\r");
    str = str.replace(/:Separator {}/g, ":Panel { isSeparator:true }"); // временное решение для сепараторов
    code.splice(0, 1);
    // fix Замена имени окна на правильное в нижней скриптовой строке "<window>.show()"
    // TODO: перенести в обработчик смены jsName:
    var initcode = dlg.code.initcode.replace(/\w+\.show\(/, dlg.control.jsname + ".show(");
    str += (dlg.code.initgfx ?  "\r" + dlg.code.initgfx : "") + "\r" + code.join("\r") +"\r" + dlg.code.initresizing + initcode;
    //str += "\r"+ tree.items[0].model.control.jsname + ".show();";
    return str;
};

BuilderDocument.prototype.swapItem = function(model, direct) {
    // direct = Up || Down
};