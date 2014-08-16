/**************************************************************************
 *  06uiModel.jsx
 *  DESCRIPTION: uiModel: Класс ui-модели (представляет данные элемента управления в диалоге)
 *  @@@BUILDINFO@@@ 06uiModel.jsx 1.80 Sat Aug 02 2014 21:24:10 GMT+0300
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
    // Нужно только для отладочной версии!
    //if (doc.getModelByID(this.id)) throw Error("Invalid model.id: "+this.id+" alredy present in doc.models collection");
    //if (doc.getViewByID(this.id)) throw Error("Invalid model.view.id: "+this.id+" alredy present in doc.views collection");
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
            // Костыль если код диалога не включает метод SUI.initWindow() - не включается библиотека SimpleUI
            code.initcode = "if (<this>.parent.orientation == 'column') { <this>.maximumSize[1] = 1; <this>.alignment = ['fill', 'top']; } else { <this>.maximumSize[0] = 1; <this>.alignment = ['left', 'fill']; };";
            break;
        case 'Window':
            //code.initcode = model.control.jsname +".show();"
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
        str = "";
    //if (model.label == "Separator") return model.jsname+":Panel { isSeparator:true }";
    str = model.jsname+":"+ label+" {";
    if (model.label == "Separator")    str = model.jsname+":Panel { isSeparator:true, ";
    else if (model.label == "UnitBox") str = model.jsname+":Group { isUnitBox:true, ";
    else if (model.label == "WebLink") str = model.jsname+":StaticText { isWebLink:true, ";

    var ptr = "properties:{" + _toSource(props.properties, control.properties, model.properties.properties, "prop"),
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

// ========================
// В отличии от toSourceString возвращает полную ScriptUI строку (включая код элементов внутри контейнеров)
uiModel.prototype.getSourceString = function(code) {
    var model = this,
        app = model.doc.app,
        tree = app.treeView.control,
        item = tree.findItem(model, 'model'),
        code = (code)||[];  // инициализирующий код элементов
    var str = (function _buildString(tr, node, code) {
        var str = tr + node.model.toSourceString();
        var codeStr = node.model.getCode();
        if (codeStr) code.push(codeStr);
        if (node.type == 'node') {
            str = str.slice(0, -1);
            if (str.charAt(str.length-1) != "{") str +=",";
            each(node.items, function(item) { str += "\r" + _buildString(tr+'\t', item, code)+"," });
        }
        if (str.charAt(str.length-1) != "{") str = str.slice(0, -1);
        return  str + "}";
    }('', item, code));
    // Заменяем <jsname:TypeOfControl {...}> на <typeofcontrol {...}>
    str = model.view.type + str.slice(str.indexOf(" {"));
    return str;
}

// ===========================
// Парсит ресурсную строку в формате <jsname>:Item { ..., properties:{ .... }} и обновляет собственные флаги обнаруженных в ней свойств
uiModel.prototype.updateProperties = function(prop_str) {
    try {
        var model_prop = this.properties,
            index = prop_str.indexOf("}");
        // Получаем из ресурсной строки валидный объект (содержащий объявленные для элемента свойства):
        if (index != -1) prop_str = prop_str.substring(0, index);
        prop_str = prop_str.slice(prop_str.indexOf("{")) + (new Array(prop_str.match(/[{]/g).length+1)).join("}");
        var pObj = eval("("+prop_str+")");
        // Обновление свойств properties:
        if (pObj.properties) {
            each(model_prop.properties, function(val, key, obj) { if (key in pObj.properties) obj[key] = true; });
        }
        // Обновление общих свойств:
        delete pObj.properties;
        delete pObj.graphics;
        each(model_prop, function(val, key, obj) { if (key in pObj) obj[key] = true; });
    } catch(e) { return false; }
    return true;
};

// ===========================
// Парсит програмный код на предмет наличия инициализации для графических свойств
uiModel.prototype.updateGraphics = function(evalcode) {
    var model = this,
        index = evalcode.indexOf("var gfx = "+this.control.jsname+".graphics;");
    if (index == -1) return;
    var evalcode = evalcode.slice(index + ("var gfx = "+this.control.jsname+".graphics;").length);
    evalcode = evalcode.slice(0, evalcode.indexOf("\n\n"));
    each(model.properties.graphics, function(val, key, obj) {
        if (evalcode.indexOf("gfx."+key+" = ") != -1) obj[key] = true;
    });
    return true;
};

// ===========================
// Методы отвечающие за генерацию кода элемента:
// строит строку вида "var <name> = <win>.<parent>.<parent>.<name>..."
uiModel.prototype.getVarString = function() {
    var model = this,
        tree = this.doc.app.treeView.control,
        item = tree.findItem(model, 'model'),
        names = [model.control.jsname];
    while (item.parent !== tree) { item = item.parent; names.push(item.text); }
    return "var " + names[0] + " = " + names.reverse().join(".");
};

// Строит строки инициализации графических свойств:
uiModel.prototype.getGfxString = function() {
    var model = this,
        props = model.properties.graphics,
        model_prop = model.control.properties.graphics,
        gfx = model.view.control.graphics,
        colors = ["var gfx = " + model.control.jsname +".graphics"],
        CPROPS = COLORSTYLES.CS;
    for (var p in props) if (CPROPS.hasOwnProperty(p) && props[p] === true) {
        if (p.match(/foreground/i)) colors.push( "gfx."+p+" = "+"gfx.newPen(gfx.PenType.SOLID_COLOR, "+toRGBA(model_prop[p]).toSource()+", 1)");
        else colors.push( "gfx."+p+" = "+"gfx.newBrush(gfx.BrushType.SOLID_COLOR, "+toRGBA(model_prop[p]).toSource()+")");
    }
    if (props.font === true) colors.push("gfx.font = ScriptUI.newFont(\""+model_prop.font+"\")");
    // Если свойства не отмечены - возвращаем пустую строку
    return colors.length == 1 ? "" : colors;
}
    
        

// ===========================
// Метод формирует и возвращает строку, содержащую JavaScript код для дополнительной инициализации элемента
uiModel.prototype.getCode = function() {
    var model = this,
        code = [];
    var gfxStr = model.getGfxString();
    if (gfxStr) code = code.concat(gfxStr);
    if (model.code.initcode) {
        if (!model.doc.presentUserControl) code.push(model.code.initcode.replace(/<this>/g, model.control.jsname));
    };
    if (model.view.item == "Window") return (code.length ? code.join(";\r")+";\r" : "");
    
    var retval = (code.length ? [model.getVarString()].concat(code).join(";\r")+";\r" : "");
    return retval;
}; // model.getCode()