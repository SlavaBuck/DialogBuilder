/**************************************************************************
*  04initControls.jsx
*  DESCRIPTION: 
*  @@@BUILDINFO@@@ 04initControls.jsx 1.22 Tue Jun 03 2014 02:24:46 GMT+0300
* 
* NOTICE: 
*   initControls() - инициализация всех списков (цветовых наборов и шрифтов) для елементов управления в заголовке и в панели свойств
*       _initCaptionFontControls() - инициализация елементов управления в заголовке, управляющие шрифтом и его цветом
*       _initFontListView() - инициализация списков шрифтов 
*       _initColorListView() - инициализация списков цветов 
*       _addToColorList(value, name) - глобальное обновление всех выпадающих списков цветов новым элементом-значением
*
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
    app.fontColor.control.selection = app.fontColor.control.find(" Black");
    app._initFontListView(app.fontName);
    app._initCaptionFontControls();
    app.fontSize.control.text = _FONT.size;
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
     for (var p in DEFFONTS) if (DEFFONTS.hasOwnProperty(p)) {
        try { item = ScriptUI.newFont(p); } catch(e) { continue; }
        family = (item.family == 'Segoe UI') ? "Segoe Ui" : item.family;
        control[family] = {};
        control[family].item = control.add("item", item.family + (item.substitute ? ('( '+item.substitute+' )') : ''));
        control[family].item.family = family;
        control[family].owner = 'system';
     }
     control.items[0].text = 'default [ ' + control.items[0].text + ' ]';
     control.selection = control[control.items[0].family].item;
};

// ===================
// инициализация списков цветов
BuilderApplication.prototype._initColorListView = function() {
    var app = this, sz = null, p = null, item = null, view = null, control = null,
           CLS = { 'CS backgroundColor':COLORSTYLES.CS.backgroundColor, 
                        'CC backgroundColor':COLORSTYLES.CC.backgroundColor, 
                        'CS disabledBackgroundColor':COLORSTYLES.CS.disabledBackgroundColor,
                        'CC disabledBackgroundColor':COLORSTYLES.CC.disabledBackgroundColor,
                        'disabledForegroundColor':COLORSTYLES.CS.disabledForegroundColor        };
    for (var i=0; i<app._ceditors.length; i++) {
        view = app._ceditors[i];
        control = view.control;
        //log("_initColorListView:", view.id, view.control.__key);
        sz = ( view.id == 'fontColor' ? [18, 12] : [24, 12] );       // размер цветного прямоугольника
        // Заполняем цветами по умолчанию
        for (p in CLS) if (CLS.hasOwnProperty(p)) {
            item = control.add("item", " "+p);
            item.value = CLS[p];
            item.image = makePng(sz, toRGB(item.value));
            control[CLS[p]] = {};   // формируем ассоциативный массив для быстрого(мгновенного) поиска цвета по его int-значению
            control[CLS[p]].item = item;
            control[CLS[p]].owner = 'system'; //  'system' || 'user' - для добавленных через трое точие
        };
        control.add("separator");
        for (p in COLORS) if (COLORS.hasOwnProperty(p)) {
            item = control.add("item", " "+p);
            item.value = COLORS[p];
            item.image = makePng(sz, toRGB(item.value));
            control[COLORS[p]] = {};   // формируем ассоциативный массив для быстрого(мгновенного) поиска цвета по его int-значению
            control[COLORS[p]].item = item;
            control[COLORS[p]].owner = 'system'; //  'system' || 'user' - для добавленных через трое точие
        };
        control.add("separator");
        item = control.add("item", ". . .");
        item.value = -1;
        
        view.unbind = _unbindColorField;
        view.rebind = _rebindColorField;
    } // for (var i=0; i<app._ceditors.length; i++)

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
        control.selection = control[val].item;
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
            control.selection = control[val].item;
        }        
    }; // _changeColorField
};

// ===================
// глобальное обновление всех выпадающих списков цветов новым элементом-значением
// value - Int, name - {string} - имя, если неопределено - формируется авт.
BuilderApplication.prototype._addToColorList = function(value, name) { 
    try {
        var name = (name)||null;
        if (name === null) {
            rgb = toRGB(value);
            name = " r="+rgb[0]+",g="+rgb[1]+",b="+rgb[2]+" ("+parseColor(value)+")";
        }
        var list, item, sz, 
               app = this;
        for (var i=0, controls=app._ceditors; i<controls.length; i++) {
            list = controls[i].control; 
            sz = (controls[i].id == 'fontColor') ? [18, 12] : [24, 12];
            item = list.items[list.items.length-1];
            item.text = name;
            item.value = value;
            item.image = makePng(sz, toRGB(value));
            list[value] = { item:item, owner:'user' };
            item = list.add("item", ". . .");
            item.value = -1;
        }
    } catch(e) { log('addcolor:', e.description) };
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