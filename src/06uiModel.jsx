/**************************************************************************
 *  06uiModel.jsx
 *  DESCRIPTION: uiModel: Класс ui-модели (представляет данные элемента управления в диалоге)
 *  @@@BUILDINFO@@@ 06uiModel.jsx 1.65 Tue Jul 15 2014 16:12:23 GMT+0300
 * 
 * NOTICE: 
 * 
/**************************************************************************
 * © Вячеслав aka SlavaBuck, 03.07.2014.  slava.boyko#hotmail.com
 */

// ===========================
// Создание базовой модели на основе данных о самом элементе:
function uiModel(view) {
    if (!(view instanceof uiView)) throw Error("Invalid MVCView pointer");
    var uiControl = view.doc.app.uiControls[view.item];
    // Вызов базового конструктора
    uiModel.prototype.__super__.constructor.call(this, {
        id:view.id,
        doc:view.doc,
        control:merge(uiControl),                                // отражает соостояние графического элемента и связывается с полями редактирования
        properties:merge(uiControl.properties),                  // содержит флаги к включения соответствующим свойствамв результатирующий документ(диалог)
        view:view,                                               // ссылка на ассоциированный MVCView
        code:{ varname:"", gfxname:"", initcode:"", initgfx:""}  // содержит код инициализации ui-элемента (формируется динамически)
    });
    //this.initDefaults();
    this.registerComponents();
    this.updateFromView();
    this.initControllers();
};

// Наследуемся напрямую от MVCModel
inherit (uiModel, MVCModel);

// Возможно не нужно....
uiModel.prototype.initDefaults = function() {
    var uiProperties = this.doc.app.uiProperties,
        model_prop = this.control.properties;
        _initDefaults = function(model_prop) {
            for (var p in model_prop) if (uiProperties.hasOwnProperty(p) && p != "properties" && p != "graphics")
                model_prop[p] = (uiProperties[p].value instanceof Array) ? new Array(uiProperties[p].value.length) : uiProperties[p].value;
        };
    _initDefaults(model_prop);
    _initDefaults(model_prop.properties);
    _initDefaults(model_prop.graphics);
};
// ===========================
// Регистрация и добавление модели и ассоциированного с ней представления в документ и приложение
uiModel.prototype.registerComponents = function() {
    var doc = this.doc,
        app = this.doc.app;
    if (doc.getModelByID(this.id)) throw Error("Invalid model.id: "+this.id+" alredy present in doc.models collection");
    if (doc.getViewByID(this.id)) throw Error("Invalid model.view.id: "+this.id+" alredy present in doc.views collection");
    this.control.jsname = this.view.jsname;
    //this.control.id = this.id;
    doc.views.add(this.view);
    doc.models.add(this);
    app.models.add(this);
    app.treeView.addItem(this);
};

// ===========================
// Обновление свойств модели данными из асоциированного представления
uiModel.prototype.updateFromView = function() {
    // выполняется только после ассоциации с MVCView (после инициализации указателя this.view)
    if (!this.view.control) throw Error("Invalid MVCView.control object");
    this._updGraphicsProperty();
    this._updCodeProperty();
    //this._updProperties();
};

// ===========================
// Обновляет данные модели о цвете и шрифте (в случае необходимости обновляются системные списки)
uiModel.prototype._updGraphicsProperty = function() {
    var app = this.doc.app,
        colorList = app.fontColor.control,
        model_prop = this.control.properties.graphics,
        gfx = this.view.control.graphics,
        CPROPS = COLORSTYLES.CS;
    // Блок обновления цветов
    for (var p in CPROPS) if (model_prop.hasOwnProperty(p)) {
        model_prop[p] = RGBAtoValue(gfx[p].color);
        if (!(model_prop[p] in colorList._colors)) app._addToAllColorLists(model_prop[p]); // добавляем цвет во все наборы, если его там небыло...
    };
    // Блок обновления шрифта
    if (model_prop.hasOwnProperty('font')) model_prop.font = gfx.font.toString();
    // TODO: Обновить список шрифтов (если требуется)
    
};

// ===========================
uiModel.prototype._updCodeProperty = function() {
    var model = this,
        code = model.code;
    switch (model.view.item) {
        case 'Separator':
            // Пока до конца не решён вопрос с использованием библиотеки SimpleUI (как собственно и с её архитектурной) будем временно использовать
            // костыль с предварительным парсингом представлений из данной библиотеки и последующей специальной инициализацией.
            code.initcode = "if (<parent>.orientation == 'column') { <this>.maximumSize[1] = 1; <this>.alignment = ['fill', 'top']; } else { <this>.maximumSize[0] = 1; <this>.alignment = ['left', 'fill']; };";
            break;
        case 'Window':
            code.initcode = model.control.jsname +".show();"
            break;          
        default:
    };
};

// ===========================
// Обновление свойств модели знчениями свойств представления
uiModel.prototype._updProperties = function() {
    var model = this,
        model_prop = model.control.properties,
        view_prop = model.view.control;
    //if (model_prop.hasOwnProperty('text')) model_prop.text = view_prop.text;
};

// ===========================
// Формирование контролёров (синхронизация свойств в модели и представлении)
uiModel.prototype.initControllers = function() {
    var model = this,
        doc = this.doc,
        uiProperties = this.doc.app.uiProperties,
        model_bstr = "", view_bstr = "", 
        view_prop, model_prop, 
        val, defval, p, i, 
        propers = model.control.properties,
        CPROPS = COLORSTYLES.CS;
        
    // Связывание контролёрами всех свойств модели со свойствами графического элемента
    for (p in uiProperties) if (!(CPROPS.hasOwnProperty(p) || p == 'font')) { 
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
    try {
        // везде обновляем модель только в случае необходимости (отсутствия значения у самой модели)!
        val = uiProperties[p].value;    // Представляет объект типа пустую строку '' или массив (['',''] или ['','','','']) 
        defval = uiProperties[p].defvalue;
        try { if (view_prop[p] === undefined) view_prop[p] = (model_prop[p] !== false) ? model_prop[p] : ((defval !== undefined) ?  defval : val ); } catch(e) { e.description }; // Errors: shortcutKey, icon { log(p, e.description) }
        //try { if (!view_prop.hasOwnProperty(p)) view_prop[p] = ((defval !== undefined) ?  defval : val ); } catch(e) { log(e.description) };
        if (val instanceof Array) {    // свойство объекта массив! (alignment, alignChildren, bounds, size....)
            if (typeof view_prop[p] == 'string') {
                for (i = 0; i<val.length; i++) val[i] = view_prop[p];
                view_prop[p] = val;
            }
            model_prop[p] = new Array(val.length);
            for (i=0; i<val.length; i ++) {
                model_prop[p][i] = view_prop[p][i];
                this._modifyController(p, doc.addController({ binding:model_bstr+"."+i+":"+view_bstr+"."+i, bind:false })); // Переопределяем _updateView
            } // for
        } else { // свойство объекта - одно значение или объект
            //log(p)
            model_prop[p] = view_prop[p];
            this._modifyController(p, doc.addController({ binding:model_bstr+":"+view_bstr, bind:false })); // Переопределяем _updateView            
        } // else
    } catch(e) { trace(e, 'initControllers:', p) }           
    } // for (p in uiProperties)

};

// ===========================
// Переопределяем _updateView в контролёре:
// В зависимости от класса и типа свойства назначает специальные обработчики _updateView (обновляющие представление)
uiModel.prototype._modifyController = function (p, ctrl) {
    switch (this.doc.app.uiProperties[p].category) {
        case "Measurements":    if (p != "indent" || p != "justify") ctrl._updateView = _updViewMsts;   break;
        case "Alignment":       if (p != "orientation") ctrl._updateView =  _updViewAlign;              break;
        default:
    }
};

// ===========================
// Метод формирует и возвращает ресурсную ScriptUI-строку для данной ui-модели (свойства в строку попадают в зависимости от флагов из model.properties.properties)
uiModel.prototype.toSourceString = function(tr) {
    var app = this.doc.app,
        model = this.control,
        props = this.properties,
        control = this.view.control,
        label = (model.label == "Tab" ? "Panel" : model.label).replace(/Tabbed/, ""),
        str = ((tr)||'') + model.jsname+":"+ label+" {",
        ptr = "properties:{" + _toSource(props.properties, control.properties, model.properties.properties, "prop"),
        sstr = _toSource(props, control, model.properties, "main");
    if ( model.label == "TabbedPanel" || model.label == "Tab" ) str += "type:'"+model.label.toLowerCase()+"'"+(sstr.length == 0 ? "": ", ");
    if (sstr.length) str += sstr;
    if (ptr.length != 12) str += (sstr.length == 0 ? "": ", ") + ptr + "}";
    return str += "}";
    // -------------------------------------------
    // ----- локальная вспомогательная _toSource()
    function _toSource(prop_obj, control_obj, model_obj, model) {
        var uiProperties = app.uiProperties,
            str = '',
            val, val1;
        for (var p in prop_obj) if (prop_obj.hasOwnProperty(p) && p != 'properties' && p != 'graphics' && prop_obj[p] === true) {
            str += p + ":"
            //val = control_obj[p];
            val = model_obj[p];
            // специальная обработка для image
            if (p == 'image') { val = model_obj[p][0]; }
            // Решение проблемы с крилицей (Array.toSource() возвращает коды символов...)
            var type = uiProperties[p].type.toLowerCase();
            // ----------------------------------------------
            // ----- локальная вспомогательная _toSafeSource()
            var sstr = (function _toSafeSource(val, type) {
                var s = "";
                switch (typeof val) {
                    case 'boolean': 
                    case 'number': s = val+", "; break;
                    case 'string':
                        if (type == "Number") s = (val.indexOf(".") != -1 ? parseFloat(val) : parseInt(val))+", "; else {
                            s = "'"+val.replace(/"/g, "\\\"").replace(/'/g, "\\\\'")+"', "; 
                        }
                        break;
                    case 'object':
                        if (val instanceof Array) {
                            for (var i=0, max=val.length; i<max; i++ ) s += _toSafeSource(val[i], typeof val[i]);
                            break;
                        }
                        // break
                    default: 
                        s = val.toSource().replace(/'/g, "\\\\'").replace(/"/g, "'")+", ";
                }
                return s;
            }(val));
            sstr = sstr.slice(0, -2); // убираем последнюю запятую
            str += ((val instanceof Array) ? "["+sstr+"]" : sstr) + ", ";
        } // for
        return str.slice (0, -2); // убираем последнюю запятую 
    } // function _toSource()
}; // model.toSourceString()

// ===========================
// Метод формирует и возвращает строку, содержащую JavaScript код для дополнительной инициализации элемента
uiModel.prototype.getCode = function() {
    var doc = this.doc,
        model = this.control,
        props = this.properties,
        control = this.view.control,
        code = this.code,
        ctrl = control,
        dlg = doc.window.children[0],
        names = [],
        CPROPS = COLORSTYLES.CS;
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
        if (p in CPROPS) {
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
}; // model.getCode()

// ===========================
// Парсит ресурсную строку в формате <jsname>:{ ..., properties:{ .... }} и обновляет собственные флаги обнаруженных в ней свойств
uiModel.prototype.updateProperties = function(prop_str) {
    try {
    var model = this,
        index = prop_str.indexOf("}"),
        jsname = prop_str.split(":")[0];
    // Обновление jsname и связанного Объекта uiView:
    model.control.jsname = model.view.jsname = jsname;
    // Обновление свойств:
    if (index != -1) prop_str = prop_str.substring(0, index);

    prop_str += (new Array(prop_str.match(/[{]/g).length+1)).join("}");
    var pObj = eval("({"+prop_str+"})");

    // Обновление свойств properties:
    if (pObj[jsname].properties) {
        each(model.properties.properties, function(val, key, obj) { if (key in pObj[jsname].properties) obj[key] = true; });
    }
    // Обновление общих свойств:
    delete pObj[jsname].properties;
    delete pObj[jsname].graphics;
    each(model.properties, function(val, key, obj) { if (key in pObj[jsname]) obj[key] = true; });
    } catch(e) { return false; }
    return true;
};

// ===========================
// Парсит програмный код на предмет наличия инициализации для графических свойств
uiModel.prototype.updateGraphics = function(evalcode) {
    try {
    var model = this,
        index = evalcode.indexOf("var gfx = "+this.control.jsname+".graphics;");
    if (index == -1) return;
    var evalcode = evalcode.slice(index + ("var gfx = "+this.control.jsname+".graphics;").length);
    evalcode = evalcode.slice(0, evalcode.indexOf("\n\n"));
    each(model.properties.graphics, function(val, key, obj) {
        if (evalcode.indexOf("gfx."+key+" = ") != -1) obj[key] = true;
    });
    } catch(e) { return false; }
    return true;
};