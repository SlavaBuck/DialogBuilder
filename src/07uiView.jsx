/**************************************************************************
 *  07uiView.jsx
 *  DESCRIPTION: uiView: Класс представления для класса ui-модели (представляет элемент управления в диалоге)
 *  @@@BUILDINFO@@@ 07uiView.jsx 1.80 Sat Aug 02 2014 21:23:53 GMT+0300
 * 
 * NOTICE: 
 * 
/**************************************************************************
 * © Вячеслав aka SlavaBuck, 03.07.2014.  slava.boyko#hotmail.com
 */

// ===========================
// Представление для модели элемента в диалоге
//  doc  - ссылка на документ
//  item - название элемента (Dialog, Palette, Separator) - соответствует значению uiControls.label
//  type - реальный тип элемента (panel, panel, panel) - всегда в нижнем регистре, соответствует реальному типу ScriptUI, может не совпадать с лабел
function uiView(doc, item, type) {
    if (!doc) throw Error("Invalid MVCDocument pointer");
    if (!doc._counters_.hasOwnProperty(item)) doc._counters_[item] = 0;      // Инициализация счётчика соответствующих элементов:
    var jsname = doc.app.uiControls[item].jsname + (doc._counters_[item]++); // Генерация js-имени элемента (и приращение счётчика)
    // Вызов базового конструктора
    uiView.prototype.__super__.constructor.call(this, { id:(doc.id + jsname), doc:doc, item:item, type:type, jsname:jsname });
};

// Наследуемся напрямую от MVCModel
inherit (uiView, MVCView);

// ===========================
// Создание нового представления
// Модель должна быть проинициализирована initEmpty(item, type, rcString)
uiView.prototype.createControl = function (parent, rcView) {
    this.control = parent.add(rcView);
    this.initControl();
    return this.registerHandlers(this.control, rcView); // Всё, что нужно выполнить над готовым элементом
};

// ===========================
// Инициализация обработчиков элемента управления (выполняется после его полной инициализации в диалоге)
uiView.prototype.registerHandlers = function(control, rcView, jsname) {
    this.view = rcView;
    if (jsname) this.jsname = jsname;
    if (this.control !== control) this.control = control;
    // Общие операции для нового и/или ранее добавленного в диалог элемента:
    var app = this.doc.app,
        uiControl = app.uiControls[this.item],
        gfx = control.graphics,
        c = app.options.highlightColor;
    // Настройка обработчика customDraw()
    gfx._markedColor = gfx.newBrush(_BSOLID, [c[0], c[1]/1.5, c[2], 0.5]);
    control._marked_ = false;   // сигнализирует о том, что элемент выбран и выделен
    control.onDraw = (uiControl.type == 'Container' || "listbox,separator".indexOf(this.type) != -1 ) ? undefined : uiView.customDraw;
    
    // Заглушка свойств
    if (!control.properties) control.properties = {};
    // Патчим свойство alignment
    if (!control.alignment && control.parent) control.alignment = control.parent.alignChildren;
    // Инициализируем цвета
//~     var gfx_prop = uiControl.properties.graphics,
//~         color_opt = app.options.doc,
//~         CPROPS = COLORSTYLES[app.options.doccolors];
//~     for (var p in CPROPS) if (gfx_prop.hasOwnProperty(p)) {
//~         if (!gfx[p]) 
//~         //gfx[p] = (p.match(/foreground/i) ? gfx.newPen(_PSOLID, toRGBA(color_opt[p]), 1) : gfx.newBrush(_BSOLID, toRGBA(color_opt[p])) );
//~     };
//~     // TODO: Инициализируем шрифт (патч чтобы преобразовать family из 'Segoe UI' в 'Segoe Ui');
//~     if (gfx_prop.hasOwnProperty('font')) {
//~         //if (gfx.font.family == 'Segoe UI') gfx.font = ScriptUI.newFont('Segoe Ui', gfx.font.style, gfx.font.size);
//~     };
    return this;
};

// ===========================
// Отображаемся с учётом собственного свойства _marked_
uiView.customDraw = function(ds) {
    try {
    var gfx = this.graphics,
        type = this.type,
        x = this.size[0],
        y = this.size[1];
    gfx.drawOSControl();
    // аккуратное выделение:
    if (this._marked_) {
        if (type == 'button' || type == 'iconbutton') gfx.rectPath(2,2, x-4, y-4); else gfx.rectPath(0,0, x, y);
        gfx.fillPath(gfx._markedColor);
    }
    if (type == 'checkbox' || type == 'radiobutton') {
        y = (y - gfx.measureString(this.text)[1])/2; 
        gfx.drawString(this.text, gfx.foregroundColor, 16, (y < 0 ? 0 : y));
    }
    } catch(e) { trace(e, "customDraw:"); }
};

// ===========================
// Инициализация элемента управления, выполняется только для вновь создаваемых элементов по нажатию кнопки
uiView.prototype.initControl = function () {
    if (!this.control) return;
    try {
    var control = this.control,
        item = this.item,
        type = this.type,
        doc = this.doc,
        uiControl = doc.app.uiControls[item].properties,
        dlgs = "dialog,palette,window";
        
    // установка текста (выборочно)
    if (item == 'Window') this.jsname = this.jsname.slice(0, -1); else
        if (uiControl.hasOwnProperty('text') && type != "tabbedpanel") control.text = this.jsname;
    
    // Корректировка начальных размеров для групп и картинок
    if (type == 'group' || type == 'image') { if (!control.preferredSize[0] && !control.preferredSize[1]) control.preferredSize = [8, 15] }

    // Специальная обработка для Separator-ов
    if (control.isSeparator) SUI.initSeparator(control);

    // Обновляем размеры окна документа
    doc.window.layout.layout(true);
    
    // Корректировка размеров для TabbedPanel
    if (type == "tab") {
        var tp = control.parent,
            model_tp = doc.findController(tp).model;
        //if (!(model.properties.properties.size || model.properties.properties.preferredSize)) {
            var add_sz = (control.text ? 42 : Math.max(28 + gfx.measureString(control.text), 42)),
                ch = tp.children.length;
            if (ch > 1) tp.size[0] += add_sz; else {
                tp.size[0] = (ch == 1 ? Math.max(tp.size[0], add_sz+28) : Math.max(tp.size[0], add_sz + gfx.measureString(tp.children[1].text)) );
            }
            model_tp.control.properties.size[0] = model_tp.control.properties.bounds[2] = tp.size[0];
        //}
    }

    } catch(e) { trace(e, 'initControl: Init():') }
};

// ===========================
// Дополнительно вызывается при обновлении модели (Предназначена в основном для обновления размеров элемента, связанного с обновлением
// размера текста.
uiView.prototype.render = function(ctrl, newVal, oldVal, key) {
    // this указывает на элемент управления!!
    // Исключаем из обработки случаи, для которых были предусмотрены специальные обработчики:
    if (ctrl.special) return; // _updViewMsts и _updViewAlign повторно обрабатывать не нужно!
    if (ctrl.binding.indexOf(".image.") != -1) return; // исключаем работу для свойства image;
    try {
    var app = ctrl.app.app,
        uiProperties = app.uiProperties;
    } catch(e) { trace(e, 'customUpdate: problems with app & uiProperties', key, classof(ctrl)); }
    try {
        if (key == 'text' && this.hasOwnProperty('text') && !ctrl.model.properties.size) { 
            var control = this,
                gfx = control.graphics,
                oldSize = gfx.measureString(oldVal),
                textSize = gfx.measureString(newVal),
                x = control.size[0] + (textSize[0]-oldSize[0]), x = (x<0) ? 0 : x, 
                y = control.size[1] + (textSize[1]-oldSize[1]), y = (y<0) ? 0 : y;
            switch (control.type) {
                case 'button': x = (x<80 || textSize[0]< 52) ? 80 : textSize[0] + 28; break;
                // iconbutton ... нужно посчитать..
                // tabbedpanel... нужно посчитать..
                case 'tab': //x -= Math.max(0, 28 - textSize[0]); break;
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
    } catch(e) { trace(e, 'customUpdate:', key, classof(ctrl), prop); }
};
