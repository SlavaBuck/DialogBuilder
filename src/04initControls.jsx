/**************************************************************************
*  04initControls.jsx
*  DESCRIPTION: 
*  @@@BUILDINFO@@@ 04initControls.jsx 1.40 Thu Jun 05 2014 01:40:30 GMT+0300
* 
* NOTICE: 
*   initControls() - инициализация всех списков (цветовых наборов и шрифтов) для елементов управления в заголовке и в панели свойств
*       _initCaptionFontControls() - инициализация елементов управления в заголовке, управляющие шрифтом и его цветом
*       _initFontListView() - инициализация списков шрифтов 
*       _initColorListView() - инициализация списков цветов 
*       _addToColorList(value, name) - глобальное обновление всех выпадающих списков цветов новым элементом-значением
*   var 1.22
*       _initImageListView() - инициализация элементов управления свойством image
*       _initImageFields()   - инициализация dropdownlist для image
*   ver 1.40    
*       _initListButtons() - инициализация кнопок '...' для управления списками 
*       _EditArray()       - простое редактирование массивов (для списков)
*       _updateListView()  - обновление размеров списка после его редактирования 
*
/**************************************************************************
* © Вячеслав aka SlavaBuck, 10.03.2014.  slava.boyko#hotmail.com
*/

// ===================
// Инициализация списков (цветовых наборов и шрифтов)
BuilderApplication.prototype.initControls = function() {
    var app = this;
    app._initImageListView();
    app._initColorListView();
    app._initFontListView(app.fontName);
    app._initCaptionFontControls();
    app._initListButtons();
    // final
    app.fontColor.control.selection = app.fontColor.control.find(" Black");
    app.fontSize.control.text = _FONT.size;
};
// ===================
// инициализация кнопок в панели свойств
BuilderApplication.prototype._initListButtons = function() {
    var app = this,
        property = { "btList":"items", "btListCW":"columnWidths", "btListCT":"columnTitles" };
        

    app.btList.onClick = app.btListCW.onClick = app.btListCT.onClick = function() {
        var bname = this.bname,
            model = app.activeControl,
            prop = property[bname],
            arr = model.control.properties.properties[prop];
        try {
        if (!isArray(arr)) {
            arr = model.control.properties.properties[prop] = [];
        };
        if (prop == "columnWidths") {
            //TODO: заполнить размерами по умолчанию
        }
        var res = app._EditArray(arr);
        
        if (res && prop == "columnWidths") {
            each(arr, function(val, i, array) { array[i] = parseInt(val); })
        }
        if (res && !arr.length) {
            //this.parent.parent.children[this.parent.parent.children.length-1].notify("click");
            model.properties.properties[prop] = this.enabled = false;
        }
        if (res) app._updateListView(model, prop);
        } catch(e) { trace(e) }
    }
};
// Простое редактирование массивов
BuilderApplication.prototype._EditArray = function(orig_arr) {
    try{
    var app = this,
        arr = [];
    each(orig_arr, function(str) { arr.push(str); });
    
    var w = new Window("dialog {text:'Edit items - "+app.activeControl.control.label+" ("+app.activeControl.control.jsname+"):', \
        properties:{resizeable:true},  \
		g0:Group {alignment:['fill', 'fill'],  \
			lb0:ListBox {alignment:['fill', 'fill'], preferredSize:['180', '250']},  \
				g1:Group {spacing:5, orientation:'column', alignment:['right', 'fill'], alignChildren:['center', 'top'],  \
					btAdd:Button {text:'Add'},  \
					btRename:Button {text:'Edit...'},  \
					btRemove:Button {text:'Remove'},  \
					sp0:"+SUI.Separator+"  \
					btImport:Button {text:'Import...', helpTip:'"+localize(app.LStr.uiApp[42])+"'},  \
					sp1:"+SUI.Separator+"  \
					btUp:Button {text:'Up'},  \
					btDown:Button {text:'Down'},  \
						g2:Group {spacing:5, orientation:'column', alignment:['fill', 'bottom'],  \
							sp2:"+SUI.Separator+",  \
							btCancel:Button {text:'Cancel'},  \
							btOk:Button {text:'Ok'}}}}}");
    SUI.WindowInit(w);
    SUI.SeparatorInit(w.g0.g1.sp0, "line");
    SUI.SeparatorInit(w.g0.g1.sp1, "line");
    SUI.SeparatorInit(w.g0.g1.g2.sp2, "line");
    var list = w.g0.lb0;
    each(arr, function(str) { list.add("item", str); });
    if (arr.length) list.selection = 0;
    
    var btAdd = w.g0.g1.btAdd,
        btRemove = w.g0.g1.btRemove,
        btRename = w.g0.g1.btRename,
        btImport = w.g0.g1.btImport,
        btUp = w.g0.g1.btUp,
        btDown = w.g0.g1.btDown;
    
    btAdd.onClick = function() {
        var w = app.createEditDlg();
        if (w.show() == 1) {
            var txt = w.g0.et0.text;
            arr.push(txt); 
            list.add("item", txt);
            list.selection = list.items[list.items.length - 1];
        }
    };
    
    btRename.onClick = function() {
        if (!list.selection) return;
        var index = list.selection.index,
            w = app.createEditDlg(list.items[index].text);
        if (w.show() == 1) {
            var txt = w.g0.et0.text;
            arr[index] = txt; 
            list.items[index].text = txt; 
        }
    };

    btRemove.onClick = function() {
        if (!list.selection) return;
        var index = list.selection.index;
        arr.splice (index, 1);
        list.remove(list.selection);
        // восстанавливаем выделение
        if (index > list.items.length - 1) {
            if (list.items.length) list.selection = list.items[list.items.length - 1];
        } else {
            list.selection = list.items[index];
        }
    };
    
    btUp.onClick = function() {
        if (!list.selection) return;
        var index = list.selection.index;
        if (index) {
            var txt = list.items[index].text;
            list.items[index].text = arr[index] = list.items[index-1].text;
            list.items[index-1].text = arr[index-1] = txt;
            list.selection = list.items[index-1];
        }
    }

    btDown.onClick = function() {
        if (!list.selection) return;
        var index = list.selection.index;
        if (index < list.items.length - 1) {
            var txt = list.items[index].text;
            list.items[index].text = arr[index] = list.items[index+1].text;
            list.items[index+1].text = arr[index+1] = txt;
            list.selection = list.items[index+1];
        }
    }

    btImport.onClick = function() {
        var filter = ["All files:*.*","Text:*.txt"];
        var file = File.openDialog (app.version +" v"+app.name + " - " + localize(app.LStr.uiApp[34]), filter);
        if (!file) return;
        file.open("r");
        var strArray = file.read().split("\n");
        list.removeAll();
        arr.length = 0;
        each(strArray, function(val) { arr.push(val); list.add("item", val); });
    }
    //// Выход
    if (w.show() == 1) {
        orig_arr.length = 0;
        each(arr, function(str) { orig_arr.push(str); });
        return true;
    } else {
        return false;
    };
    ////
    
    } catch(e) { trace(e) }
};

// Создания простого окна редактирования строчного элемента (str) 
BuilderApplication.prototype.createEditDlg = function(str) {
    var str = (str)||"",
        w = new Window("dialog {text:'Edit item', spacing:5, properties:{resizeable:true},  \
        g0:Group {alignment:['fill', 'top'],  \
            img0:Image {alignment:['left', 'center']},  \
            et0:EditText {alignment:['fill', 'center'], characters:40}},  \
        sp0:"+SUI.Separator+"  \
        g1:Group {alignment:['right', 'top'],  \
            bt0:Button {text:'Cancel'},  \
            bt1:Button {text:'Ok'}}}");
    w.g0.img0.image = app.resources.images._PConsole_R;
    w.g0.et0.text = str;
    SUI.WindowInit(w);
    SUI.SeparatorInit(w.sp0, "line");
    w.onShow = function() { 
        w.g0.minimumSize = w.g0.size; 
        w.g0.et0.active = true;
    };
    return w;
}

// Обновление внешнего вида списка 
BuilderApplication.prototype._updateListView = function(model, what) {
    var app = this,
        control = model.view.control,
        model_prop = model.control.properties;
    try {
    if (what == "items") {
        control.removeAll();
        each(model_prop.properties.items, function(str) { control.add("item", str); });
    }
    
    //// Хитрожопый способ определить возможный размер
    if (!(model.properties.preferredSize || model.properties.size)) {
        var sz = [],
            w = new Window("palette { visible:false, " + model.toSourceString().replace(/\\\'/g, "\"") + "}");
        w.onShow = function() { sz = this.children[0].size };
        w.show();
        w.close();
        control.size[0] = sz[0];
        control.size[1] = sz[1];
        ////
        app.activeDocument.window.layout.layout(true);
        app._getField('size0').control.text = model_prop.size[0] = control.size[0];
        app._getField('size1').control.text = model_prop.size[1] = control.size[1];
        app._getField('bounds2').control.text = model_prop.bounds[2] = control.bounds[2];
        app._getField('bounds3').control.text = model_prop.bounds[3] = control.bounds[3];
        
    }

    app.updateTabs(model);
    } catch(e) { trace(e) }
};
// ===================
// инициализация елемента управления image
BuilderApplication.prototype._initImageListView = function() {
    var app = this,
        view = app.getViewByID("image0");
    
    app.btImage.onClick = function() {
        var filter = ["All files:*.*","All supported:*.JPEG;*.GIF;*.TIFF;*.PNG;*.IDRC;*.PICT"];
        var file = File.openDialog (app.version +" v"+app.name + " - " + localize(app.LStr.uiApp[34]), filter);
        if (!file) return;
        var img;
        try { 
            img = ScriptUI.newImage(file);
        } catch(e) { img = null }
        
        // TODO: Сделать определения для списков в view:imageSettings
        var index = 0;
        var name = File.decode(file.absoluteURI);
        
        _updateImageView(app.activeControl, img, index, name);
        app.updateTabs(app.activeControl);
    }

    view.unbind = function() {
        var control = this.control,
            ddImage = control.parent.ddImage;
        delete ddImage.onChange;
        delete control.onChange; 
        
        ddImage.selection = null;
        control.text = "";
        
        ddImage.model = null;
        control.enabled = ddImage.enabled = false;
    };

    view.rebind = function(newVal) {
        var model = (newVal)||null,
            control = this.control,
            ddImage = control.parent.ddImage;
        if (!(model && model.control.properties.hasOwnProperty('image'))) return this.unbind();
        // TODO: Сделать определения для списков в view:imageSettings
        var index = 0;
        //control.text = (model.view.control.image && model.view.control.image.name ? model.view.control.image.name : "undefined");
        control.text = (model.control.properties.image[index])||"undefined";
        
        var pict = control.text == "undefined" ? "\u00A0\u00A0undefined" :
                   "\u00A0" + ( (control.text.indexOf(".") == -1) ? control.text :
                                 File.decode(File(control.text).absoluteURI).split("/").slice(-1)[0].split(".").slice(0, -1).join("."));
        ddImage.selection = ddImage.find(pict);
        
        ddImage.model = model;
        ddImage.onChange = _changeImageList;
        
        control.helpTip = "image: " + control.text;
        ddImage.enabled = true;
    };
    
    // Обработчики списков
    function _changeImageList() {
        if (!this.model) return;
        var model = this.model,
            pict = this.selection.text.replace(/^\s+/, ""), // избаляемся от лишних пробелов
            img = (pict == "undefined" ? null : getImage(pict));

        var etEdit = this.parent.children[0];
        etEdit.text = pict;
        etEdit.helpTip = "image: " + etEdit.text;
        // TODO: Сделать определения для списков в view:imageSettings
        var index = 0;
        _updateImageView(model, img, index, pict);
    };
    
    function _updateImageView (model, newimg, index, name) {
    try {
        if (!model) return;
        var control = model.view.control,
            model_prop = model.control.properties,
            img = (newimg ? newimg : getImage("#Undefined")),
            imgname = (name)||File.decode(img.pathname);
        
        model_prop.image[index] = imgname;
        control.onDraw = undefined;
        control.image = img;
        // Если размер зафиксированный - не меняем!
        if (!(model.properties.preferredSize || model.properties.size)) {
            if (imgname != "undefined") {
                control.size = (control.type == 'image' ? img.size : [img.size[0]+12, img.size[1]+12]);
            } else {
                control.size = model.control.defaults.size;
            }
            app.activeDocument.window.layout.layout(true);
            app._getField('size0').control.text = model_prop.size[0] = control.size[0];
            app._getField('size1').control.text = model_prop.size[1] = control.size[1];
            app._getField('bounds2').control.text = model_prop.bounds[2] = control.bounds[2];
            app._getField('bounds3').control.text = model_prop.bounds[3] = control.bounds[3];
        }
    } catch(e) { trace (e) }
    };
}
// ===================
// инициализация елементов управления в заголовке, управляющие шрифтом и его цветом
BuilderApplication.prototype._initCaptionFontControls = function() {
    var app = this;
    // Сброс настроек шрифта в значение по умолчанию
    app.btClearFont.onClick = function() {
        var model = app.activeControl;
        if (! (model && model.control)) return;
        var control = model.view.control,
               gfx =control.graphics,
               sz2, sz1 = gfx.measureString(control.text),
               font = gfx.font,
               model_prop = model.control.properties,
               color_opt = app.options.doc;
        gfx.font = ScriptUI.newFont(_FONT.family, _FONT.style, _FONT.size);                        // Шрифт по умолчанию
        gfx.foregroundColor = gfx.newPen(_PSOLID, toRGBA(color_opt.foregroundColor), 1);  // Цвет по умолчанию
        gfx.disabledForegroundColor = gfx.newPen(_PSOLID, toRGBA(color_opt.disabledForegroundColor), 1);
        model_prop.graphics.font = gfx.font.toString();
        //model_prop.graphics.font.replace(/Segoe UI/, "Segoe Ui");
        model_prop.graphics.foregroundColor = color_opt.foregroundColor;
        model_prop.graphics.disabledForegroundColor = color_opt.disabledForegroundColor;
        sz2 = gfx.measureString(control.text);
        model_prop.size[0] += (sz2[0] - sz1[0]);
        model_prop.size[1] += (sz2[1] - sz1[1]);
        app.updateTabs(model);
    };
    
    // Размеры шрифта
     app.fontSize.unbind = function() {
        delete this.control.onChange;
        this.control.enabled = false;
    };
    
    app.fontSize.rebind = function(newVal) {
        var model = (newVal)||null,
               control = this.control;
        if (!(model && model.control && model.control.properties.hasOwnProperty('text'))) return this.unbind();
        control.model = model;
        control.enabled = true;
        //this._updateView(model.view.control.graphics.font.size);
        control.text = model.view.control.graphics.font.size;
        control.onChange = function() {
            var gfx = this.graphics,
                   value = parseFloat(this.text.replace(/,/g,"."));
            if (isNaN(value)) return gfx.foregroundColor = gfx.newPen(_PSOLID, toRGBA(COLORS.Red), 1);
            gfx.foregroundColor = gfx.newPen(_PSOLID, toRGBA(app.options.foregroundColor), 1);
            var control =  this.model.view.control,
               gfx =control.graphics,
               sz2, sz1 = gfx.measureString(control.text),
               font = gfx.font,
               model_prop = this.model.control.properties;
            gfx.font = ScriptUI.newFont(font.family, font.style, value);
            model_prop.graphics.font = gfx.font.toString();
            this.text = gfx.font.size;
            //this.textselection = '';
            sz2 = gfx.measureString(control.text);
            model_prop.size[0] += (sz2[0] - sz1[0]);
            model_prop.size[1] += (sz2[1] - sz1[1]);
            app._getField('size0').control.text = model_prop.size[0];
            app._getField('size1').control.text = model_prop.size[1];
            app._updateFontField(this.model);
        }
    };

    // Специальная обработка (в обход стандартным механизмам MVC) для представления сo списками цветов
    app.fontColor.unbind = function() {
        this.control.enabled = app.btClearFont.enabled = false;
    };
    // Специальная обработка (в обход стандартным механизмам MVC) для представления сo списком шрифтов
    app.fontName.rebind = function(newVal) {
        var model = (newVal)||null,
               control = this.control;
        if (!(model && model.control && model.control.properties.hasOwnProperty('text'))) return this.unbind();
        control.model = model;
        control.enabled = app.btClearFont.enabled = true;
        // this._updateView(model.view.control.graphics.font.family);
        var fName = model.view.control.graphics.font.family;
        control.selection = (control.hasOwnProperty(fName)) ? control[fName].item : null;
        control.onChange = function() {
            if (!this.model) return;
            var control =  this.model.view.control,
                   gfx =control.graphics,
                   sz2, sz1 = gfx.measureString(control.text),
                   font = gfx.font,
                   model_prop = this.model.control.properties;
            gfx.font = ScriptUI.newFont(this.selection.family, font.style, font.size);
            model_prop.graphics.font = gfx.font.toString();
            sz2 = gfx.measureString(control.text);
            model_prop.size[0] += (sz2[0] - sz1[0]);
            model_prop.size[1] += (sz2[1] - sz1[1]);
            app._getField('size0').control.text = model_prop.size[0];
            app._getField('size1').control.text = model_prop.size[1];
            app._updateFontField(this.model);
        }
    };

    app.fontName.unbind = function() {
        delete this.control.onChange;
        this.control.model = null;
        this.control.enabled = app.btClearFont.enabled = false;
    };

    // Специальная обработка (в обход стандартным механизмам MVC) для представления с кнопками стиля (BOLD && ITALIC)
    app.fontStyle.rebind = function(newVal) { // View.prototype.rebind(model, view_key, model_key)
        var bBOLD = this.control.bBOLD,
              bITALIC = this.control.bITALIC,
              model = (newVal)||null;
        if (!(model && model.control && model.control.properties.hasOwnProperty('text'))) return this.unbind();
        bBOLD.model = bITALIC.model = model;
        bBOLD.enabled = bITALIC.enabled = true;
        this._updateView(model.view.control.graphics.font.style);
        return newVal;
    };
    app.fontStyle.unbind = function() { // View.prototype.rebind(model, view_key, model_key)
        var bBOLD = this.control.bBOLD,
              bITALIC = this.control.bITALIC;
        bBOLD.model = bITALIC.model = null;
        bBOLD.value = bITALIC.value = 0;
        bBOLD.enabled = bITALIC.enabled = false;
    };
    app.fontStyle._updateView = function(newVal) { // ScriptUIFont.style (BOLD || ITALIC || BOLDITALIC || REGULAR)
        if (newVal === null) return this.unbind();
        var style = { '':0, 'Bold':1, 'Italic':2, 'BoldItalic':3 }[newVal];
        this.control.bBOLD.value = ~~!!(style & _BOLD);
        this.control.bITALIC.value = ~~!!(style & _ITALIC);
        return newVal;
    };
    // Обработка кликов по кнопкам-стиля:
    app.btBOLD.onClick = app.btITALIC.onClick = function() {
        if (!this.model) return;
        var control =  this.model.view.control,
               gfx =control.graphics,
               dx = gfx.measureString(control.text)[0],
               font = gfx.font,
               style = { '':0, 'Bold':1, 'Italic':2, 'BoldItalic':3 }[font.style],
               model_prop = this.model.control.properties;
        style = (style & this.label) ?  ( ~~(style - this.label) ) : (style | this.label);
        gfx.font = ScriptUI.newFont(font.family, style, font.size);
        model_prop.graphics.font = gfx.font.toString();
        model_prop.size[0] += (gfx.measureString(control.text)[0] - dx);
        app._getField('size0').control.text = model_prop.size[0];
        app._updateFontField(this.model);
    };
};

// ===================
// инициализация списков шрифтов 
BuilderApplication.prototype._initFontListView = function(view) {
    var app = this,
        control = view.control,
        item, family;
    each(DEFFONTS, function(font) {
        app._addToFontList(control, font, "system"); 
    });
    each(app.options.userfonts, function(font) { 
        app._addToFontList(control, font, "user");
        app._addToFontList(app.userFontList, font, "user");
    })
    // ручками переименуем дефолтный шрифт...
    control.items[0].text = 'default [ ' + control.items[0].text + ' ]';
    // .. и переустановим на него control
    control.selection = control[control.items[0].family].item;
};
// ===================
// добавление пользовательских шрифтов в список
// control - елемент ListBox со списком шрифтов, font - имя шрифта
BuilderApplication.prototype._addToFontList = function(control, font, owner) {
    var app = this,
        owner = (owner)||'system',
        item, family;
    // проверка на корректность шрифта
    try { item = ScriptUI.newFont(font); } catch(e) { return false; }
    family = (item.family == 'Segoe UI') ? "Segoe Ui" : item.family;
    // добавляем только отсутствующие шрифты
    if (control.hasOwnProperty(family)) return false;
    control[family] = {};
    control[family].item = control.add("item", item.family + (item.substitute ? ('( '+item.substitute+' )') : ''));
    control[family].item.family = family;
    control[family].owner = owner;
    return true;
}

// ===================
// инициализация списков цветов
BuilderApplication.prototype._initColorListView = function() {
    var app = this, sz = null, p = null, item = null, view = null, control = null,
        CLS = { 'CS backgroundColor':COLORSTYLES.CS.backgroundColor,
                'CC backgroundColor':COLORSTYLES.CC.backgroundColor,
                'CS disabledBackgroundColor':COLORSTYLES.CS.disabledBackgroundColor,
                'CC disabledBackgroundColor':COLORSTYLES.CC.disabledBackgroundColor,
                'disabledForegroundColor':COLORSTYLES.CS.disabledForegroundColor        
              };
    // инициализация всех списков цветами из стандартного набора CS/CC
    each(CLS, function(str, key, obj) {
        app._addToAllColorLists(obj[key], key, "system");
    });
    app._addToAllColorLists(0, "separator");
    // инициализация всех списков цветами из общего стандартного набора COLORS
    each(COLORS, function(str, key, obj) {
        app._addToAllColorLists(obj[key], key, "system");
    });
    app._addToAllColorLists(0, "separator");
    // пополнение options.usercolors цветами из настроек (если требуется)
    var color = parseInt(parseColor(app.options.highlightColor)),
        control = app.getViewByID("fontColor").control;
        
    if (!control.hasOwnProperty(color)) app.options.usercolors["system highlightColor"] = color;
    each(COLORSTYLES.CS, function(val, key) {
        color = parseInt(parseColor(app.options[key]));  // если что-то новое в app.options
        if (!(color in control._colors)) app.options.usercolors["user "+key+" (app)"] = color;
        color = parseInt(parseColor(app.options.doc[key]));  // если что-то новое в app.options.doc
        if (!(color in control._colors)) app.options.usercolors["user "+key+" (doc)"] = color;
    })
    // инициализация всех списков цветами из пользовательского набора options.usercolors
    each(app.options.usercolors, function(str, key, obj) {
        app._addToAllColorLists(obj[key], key, "user");
    });

    each(app._ceditors, function(view) {
        view.unbind = _unbindColorField;
        view.rebind = _rebindColorField;
    }) // for (var i=0; i<app._ceditors.length; i++)
    
    function _unbindColorField() {
        delete this.control.onChange;
        if (this.id != 'fontColor') this.control.selection = null;
        this.control.enabled = false;
    };
    
    function _rebindColorField(newVal) {
        var model = (newVal)||null;
        if (!model) return this.unbind();
        var control = this.control,
               val = model.control.properties.graphics[control.__key]; // (control.__key = foregroundColor || backgroundColor || ....) устанавливается при создании данного View
        control.model = model;
        control.enabled = true;
        delete control.onChange;
        //if (control.hasOwnProperty(val)) control.selection = control[val].item;
        control.selection = control._colors[val].item;
        control.onChange = _changeColorField;
    };
    
    function _changeColorField() {
        if (! this.model) return;
        var model_prop = this.model.control.properties.graphics,
               gfx = this.model.view.control.graphics,
               val = this.selection.value,
               key = this.__key;
        model_prop[key] = val;
        gfx[key] = (key.match(/foreground/i) ? gfx.newPen(_PSOLID, toRGBA(val), 1) : gfx.newBrush(_BSOLID, toRGBA(val)) );
        if (key == 'foregroundColor') {
            var control = app.fontColor.control
            if (this === control) control = app._ceditors.getFirstByKeyValue("id", 'foregroundColor').control;
            control.selection = control._colors[val].item;
        }        
    }; // _changeColorField
};

BuilderApplication.prototype._addToColorList = function(value, control, name, toFontColor, owner) {
    if (!control) return false;
    var list, item, sz, 
        app = this,
        value = parseInt(parseColor(value)),
        rgb = toRGB(value),
        name = (name)||(" r="+rgb[0]+",g="+rgb[1]+",b="+rgb[2]+" ("+parseColor(value)+")"),
        owner = (owner)||"user";
    if (name == "separator") {
        control.add("separator");
        return true;
    }
    // берём любой список и прверяем - есть ли там такой цвет:
    if (control._colors && (value in control._colors)) return false;

    sz = (toFontColor ? [18, 12] : [24, 12]);       // размер цветного прямоугольника
    item = control.add("item", " "+name);
    item.value = value;
    item.image = makePng(sz, rgb);
    item.owner = owner;
    // формируем ассоциативный массив для быстрого(мгновенного) поиска цвета по его int-значению
    if (!control._colors) control._colors = [];
    control._colors[value] = { item:item, owner:item.owner };
    // Удаляет из списка значение (используется в настройках)
    control.removeValue = function(val) {
        if (val in this._colors) {
            this.remove(this._colors[val].item);
            //this._colors.splice(indexOf(this._colors, val), 1);
            delete this._colors[val];
        };
    }
    return true;
}
// ===================
// глобальное обновление всех выпадающих списков цветов новым элементом-значением
// value - Int, name - {string} - имя, если неопределено - формируется авт., owner - откуда пришёл
BuilderApplication.prototype._addToAllColorLists = function(value, name, owner) {
    var app = this,
        owner = (owner)||"user";
    // Инициализация элементов управления в Tabs и Caption
    each(app._ceditors, function(view) {
        app._addToColorList(value, view.control, name, view.id == 'fontColor', owner); 
    });
    // Инициализация элементов управления в Settings
    // app.settingColorFields:{Collection of DropDownList} - создаётся в buildSettingsWindow()->build_pAppearance();
    each(app.settingColorFields, function(control) {
        app._addToColorList(value, control, name, false, owner);
    });
    // Пополнение списка для настройки подсветки в Settings.pMain
    var control = app.getViewByID("_settings_highlightColor").control;
    app._addToColorList(value, control, name, false, owner);
    // Дополнительная инициализация списка пользовательских цветов в настройках
    // app.userColorList:{ListBox} - создаётся в buildSettingsWindow()->build_pColors();
    if (owner == "user" && name != "separator") {
        app._addToColorList(value, app.userColorList, name, false, owner);
    }
};
// Удаление значения цвета из всех списков (используется в настройках)
BuilderApplication.prototype._removeFromAllColorLists = function(value) {
    if (isNaN(value)) return;
    // Удаление из Tabs и Caption
    each(app._ceditors, function(view) { view.control.removeValue(value) });
    // Удаление из элементов управления в Settings
    each(app.settingColorFields, function(control) { control.removeValue(value) });
    // Удаление из настройки pMain - highlightColor
    var view = app.getViewByID("_settings_highlightColor");
    view.unbind();
    view.control.removeValue(value);
    // Удаление из специальной вкладки Settings.pColors
    // app.userColorList.removeValue(value);
};
// ===================
// инициализация списков стандартных (ESTK) картинок
BuilderApplication.prototype._initImageFields = function(ddList) {
    // Пустое значение undefined (актуально для multistate images)
    with (ddList.add("item", '\u00A0\u00A0undefined')) {
        image = getImage(ICONS.UNDEFINED);
    }
    // всё остальное (кроме predefined multistate)
    for (var prop in ICONS) if (ICONS.hasOwnProperty(prop) && !(ICONS[prop] instanceof Array)) {
        with (ddList.add("item", '\u00A0'+ICONS[prop])) {
            image = getImage(ICONS[prop]);
        }
    }
    ddList.selection = ddList.items[0];
}