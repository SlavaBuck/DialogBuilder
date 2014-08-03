/**************************************************************************
 *  03document.jsx
 *  DESCRIPTION: BuilderDocument: Класс документа (представляет редактируемый диалог)
 *  @@@BUILDINFO@@@ 03document.jsx 1.82 Sun Aug 03 2014 14:52:20 GMT+0300
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
    this.modified = false;              // сигнализирует о несохранённых изминениях
    this.activeControl = null;          // указатель на активную uiModel
    this.activeContainer = this.window; // указатель на текущий контейнер для добавления моделей (ScriptUI-объект);
    this._reload = false;                // устанавливается в doc.swapItems() - сигнализирует о необходимости перезагрузки документа!
};

// Наследуемся напрямую от MVCDocument
inherit (BuilderDocument, MVCDocument);
                                     
// Функции сохранения и открытия
BuilderDocument.prototype.save = function(file) {
    var doc = this,
        app = doc.app,
        LStr = app.LStr;
    if (file) doc.file = file;
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
    try {
        doc.file.open("w");
        var str = localize(LStr.uiApp[46]) + doc.app.name + " v"+doc.app.version + "\r\r";
        doc.file.write(str + doc.getSourceString());
        doc.file.close();
    } catch(e) { trace(e); return false; }
    doc.modified = false;
    return true;
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
    } catch(e) { trace(e); return false; }
};

// Основные методы документа:
// Добавление элемента в диалог
BuilderDocument.prototype.addItem = function (rcString) {
    if(!rcString) return null;
    var doc = this,
        app = doc.app,
        uiControls = app.uiControls,
        CPROPS = COLORSTYLES.CS,
        dlgs = "dialog,palette,window";
    // Добываем type добавляемого ScriptUI объекта в нижнем регистре!
    var type = rcString.match(/^\w+/)[0].toLowerCase();
    var item = app.hashControls[type];
    
    // танцы с добавлением tabbedpanel и tab:
    if (!item) return;
    if (type == 'tab' && doc.activeContainer.type != 'tabbedpanel') return;
    if (doc.activeContainer.type == 'tabbedpanel' && type != 'tab') return;

    if (doc.activeControl) app.unmarkControl(doc.activeControl);
    
    var rcString = (type == 'separator' ? SUI.Separator.toString() : (item == "Window" ? 'panel' : type) + rcString.slice(type.length));
    
    try {
        var model = new uiModel(new uiView(doc, item, type).createControl(doc.activeContainer, rcString));
    } catch(e) { trace(e); return null; }

    // если установлен autofocus и добавлен контейнер - переустанавливаем фокус на него:
    if (app.options.autofocus && SUI.isContainer(item)) {
        app.treeView.control.activeNode = app.treeView.control.activeItem;
        doc.activeContainer = model.view.control;
    };

    if (!doc.modified) doc.modified = true;
    return doc.activeControl = model;
};

// Документ - удаление контрола (активного)
BuilderDocument.prototype.removeItem = function(model) {
    var doc = this,
        app = this.app,
        tree = doc.app.treeView,
        model = (model)||tree.control.activeItem.model,
        control = (model === null) ? null : model.view.control;

    if (!doc.modified) doc.modified = true;
    doc.activeControl = null;
    // Запоминаем текущий элемент и его индекс в родительском контейнере
    var oldItem = tree.control.activeItem;
    for (var index=0, children=control.parent.children; index<children.length; index++) if ( children[index] === control) break;
    // Определяем следующий активный контрол и контэйнер, переключаемся на него в дереве, а затем и в диалоге
    if (tree.control.activeItem === tree.control.activeNode) {
        tree.control.activeItem = tree.control.activeNode = tree.control.activeNode.parent;
    } else {
        if (index == 0) {
            if (children.length == 1) tree.control.activeItem = tree.control.activeNode; 
                else tree.control.activeItem = tree.control.activeNode.items[1];
        } else {
            if (index + 1 < children.length) index += 1; else index -= 1;
            tree.control.activeItem = tree.control.activeNode.items[index];
        }
    }
    // Удаляемся из диалога
    // v1.61 значительно ускорено удаление контейнеров: 
    // doc.removeMVC(), вызывавший множественное удаление представлений в контейнерах заменён на раздельное
    // удаление моделей и контролёров. Представление удаляется только однажды (после выполнения _removeItems)
    (function _removeItems(doc, node) {
        if (node.type == 'node') each(node.items, function(item) { _removeItems(doc, item);  });
        doc.views.splice(doc.views.indexOf(node.model.view), 1);
        doc.removeModel(node.model);
        doc.app.models.removeByValue(node.model);
    }(doc, oldItem));
    // Удаляем само представление и соответствующие элемент(ы) из дерева 
    oldItem.model.view.remove();
    tree.removeItem(oldItem);
    doc.window.layout.layout(true);
    // устанавливаем активные указатели:
    if (model.view.item != "Window") {
        tree.control.selectItem(tree.control.activeItem);
        doc.activeControl = tree.control.activeItem.model;
        doc.activeContainer = tree.control.activeNode.model.view.control;
    } else {
        doc.activeControl = null;
        doc.activeContainer = doc.window;
    };
    return doc.activeControl;
};

BuilderDocument.prototype.getSourceString = function() {
    var code = [],
        winModel = this.app.treeView.control.items[0].model,
        winName = winModel.control.jsname,
        str = winModel.getSourceString(code);
    // Добавляем косые вконце строк
    str = "var " + winName + " = new Window (\"" + str.replace(/\r/mg, " \\\r") + "\");\r";
    // Специальная обработка для Window
    if (winModel.properties.properties.resizeable) code.push(winName + ".onResizing = " + winName+ ".onResize = function() { this.layout.resize () };");
    code.push(winName + ".show();");
    
    return str + code.join("\r");
};

// Обеспечивается корректная очистка коллекций моделей в родительском приложении:
BuilderDocument.prototype.removeModel = function(model) {
    var app = this.app;
    app.models.splice(app.models.getFirstIndexByKeyValue("id", model.id), 1);
    return this.__super__.removeModel.call(this, model);
};

BuilderDocument.prototype.swapItems = function(index1, index2) {
    // Обмен местами элементов index1(выделенный индекс), index2(куда ставить)
    var doc = this,
        app = this.app,
        tree = app.treeView.control,
        parent = tree.activeItem.parent;
        
    if (index2 < 0 || index2 == parent.items.length) { tree.active = true; return; }
    
    // Перемещение по дереву
    if (parent.items[index1].type == "item") { // Первый элемент "item":
        if (parent.items[index2].type == "item") {
            // Второй элемент "item":
            app.treeView.swapItems(parent, index1, index2);
        } else {
            // Второй элемент "node":
            if (index2 < index1) { // move Up
                var item = parent.add("item", parent.items[index1].text, index2);
                item.model = parent.items[index1+1].model;
                item.expanded = parent.items[index1+1].expanded;
                parent.remove(parent.items[index1+1]);
            } else {               // move Down
                var item = parent.add("item", parent.items[index1].text, index2+1);
                item.model = parent.items[index1].model;
                item.expanded = parent.items[index1].expanded;
                parent.remove(parent.items[index1]);
            }
        } 
    } else { // Первый элемент "node":
        if (parent.items[index2].type == "item") {
            // Второй элемент "item":
            if (index1 < 0 || index1 == parent.items.length) { tree.active = true; return; }
            tree.activeItem = parent.items[index2];
            this.swapItems(index2, index1);
            tree.selectItem(tree.activeItem = parent.items[index2]);
            return;
        } else {
            // Оба элемента "node":
            if (index2 < index1) {  // move Up
                var item = parent.add("node", parent.items[index2].text, index1+1);
                app.treeView.copyBranch(parent.items[index2], item);
                parent.remove(parent.items[index2]);
                parent.items[index1].expanded = parent.items[index2].expanded = true;
            } else {                // move Down
                if (index1 < 0 || index1 == parent.items.length) { tree.active = true; return; }
                tree.activeItem = parent.items[index2];
                this.swapItems(index2, index1);
                tree.selectItem(tree.activeItem = parent.items[index2]);
                return;
            }
        }
    }
    tree.selectItem(tree.activeItem = parent.items[index2]);
    
    // Перемещаем элементы в контейнере:
    var control1 = parent.items[index1].model.view.control,
        control2 = parent.items[index2].model.view.control,
        dim = ~~(control1.parent.orientation == "column"),  // ориентация
        sp = control1.parent.spacing;  // реальный отступ межу элементами
    if (index1 < index2) {
        control1.location[dim] = control2.location[dim];
        control2.location[dim] += control1.size[dim] + sp;
    } else {
        control2.location[dim] = control1.location[dim];
        control1.location[dim] += control2.size[dim] + sp;
    }

    doc._reload = true; // поменяем цвет кнопки на красный
    if (!doc.modified) doc.modified = true;
};

// Установка родительского диалога в документе
BuilderDocument.prototype.creatDialog = function(rcWin) {
    var doc = this,
        model = null,
        tree = doc.app.treeView.control;
    tree.activeNode = tree.activeItem = null;
    if (doc.dialogControl) {
        tree.activeItem = tree.items[0];
        doc.removeItem(doc.dialogControl);
    }
    if (!(model = doc.addItem((rcWin)||doc.app.options.dialogtype+" { preferredSize:[80, 20], alignment:['left','top'] }" ))) return null;
    doc.activeContainer = model.view.control;
    doc.activeContainer.alignment = ['left','top'];
    // Инициализируем цвета:
    var gfx_prop = model.control.properties.graphics,
        gfx = doc.activeContainer.graphics;
    each(COLORSTYLES[doc.app.options.doccolors], function(val, key){
        gfx_prop[key] = val;
        gfx[key] = key.match(/foreground/i) ? gfx.newPen(_PSOLID, toRGBA(val), 1) : gfx.newBrush(_BSOLID, toRGBA(val));
    });
    // Инициализируем шрифт: ...
    //if (gfx.font.family == 'Segoe UI') gfx.font = ScriptUI.newFont('Segoe Ui', gfx.font.style, gfx.font.size);
    
    app.markControl(model);
    return doc.dialogControl = model;
};

// Загрузка документа (выполняется после его создания):
BuilderDocument.prototype.load = function() {
    // документ был создан только-что с помощью addDocument() (см. MVC.DOM: MVCApplication.loadDocument())
    var doc = this,
        app = this.app,
        file = doc.file,
        body = "";
    file.open("r"); body = file.read(); file.close();
    
    // Вычленяем ресурсную строку, представляющую диалог целиком
    body = body.replace(/new Window\s[(]/, "new Window(");
    var rcWin = body.slice(body.indexOf("new Window(")+12, body.indexOf('");')).replace(/\\/g, "");

    // переустанавливаем родительское окно
    if (!doc.creatDialog(rcWin)) {
        // "Неудачная попытка открытия документа"
        app.alert(localize(app.LStr.uiErr[7])+"\r\r"+rcWin, app.name +" v"+app.version, false);
        return doc.modified = false; // Чтобы избежать тупого запроса на сохранение
    };
    
    app.unmarkControl(doc.dialogControl);
    var control = doc.dialogControl.view.control,   // Контейнер окна/диалога (со всеми элементами)
        dlgName = body.match(/var\s(\S+)\s*=\s*new Window\(/)[1],
        evalcode = "var " + dlgName + " = control;\r" + body.slice(body.indexOf('");')+3);
    // убираем строки с инициализацией и открытием окна:
    evalcode = evalcode.slice(0, evalcode.indexOf(dlgName+".show"));
    evalcode = evalcode.slice(0, evalcode.indexOf(dlgName+".onResizing"));

    // Убиваем всё лишнее из ресурсной строки
    rcWin = normalizeRcString(rcWin);

    //Формируем модели и представления для всех в control
    doc.appendItems(dlgName, control, rcWin, evalcode);
    
    app.treeView.selectItem(doc.activeControl = doc.dialogControl);
    doc.modified = false;
    return true;
};

// doc - рабочий документ (куда вставляются элементы)
// control - ссылка на ScriptUI элемент (для которого будут строиться модели и представления)
// rcControl - полная ресурсная строка добавляемого элемента (включая jsname:<Item> {...})
// evalcode - код выполняемый для элемента
BuilderDocument.prototype.appendItems = function(jsname, control, rcControl, evalcode) {
    try {
    var doc = this,
        app = doc.app,
        counts = 0,
        arrObj = rcControl.split("\n");
    // Очень часто встречается практика переноса свойств окна на новую строку, это протеворечит
    // шаблону но попробуем обработать этот единственный допустимый не шаблонный случай:
    if (arrObj.length > 1 && app.uiProperties.hasOwnProperty(arrObj[1].split(":")[0])) {
        arrObj[0] += arrObj[1]; arrObj.splice(1, 1);
    }
    // Так как первая строка (содержащая "dialog..." слегка не шаблонная - подкоректируем 
    // и дабавим в неё имя самого окна ("<имя>:dialog...):
    arrObj[0] = jsname+":"+arrObj[0];
    
    try { eval(evalcode); } catch(e) { trace(e,"eval dialog code") }    // Выполняется код инициализации элемента
    doc.window.layout.layout(true);
    app.enabledTabs = false; // Отключаем обновление панелей свойств
    
    // Создаём модели для всех элементов control
    (function _creatItems(doc, control, evalcode) {
        var type = (control.isSeparator ? 'separator' : control.type),
            item = doc.app.hashControls[type],
            tree = doc.app.treeView.control,
            prop_str = arrObj[counts++],
            jsname = prop_str.slice(0, prop_str.indexOf(":")),
            model = null,
            view = null;
        // Создание модели
        if (control === doc.dialogControl.view.control) {
            model = doc.dialogControl;
            tree.activeItem.text = model.control.jsname = jsname;
            tree.activeNode = tree;
        } else {
            view = new uiView(doc, item, type),
            model = new uiModel(view.registerHandlers(control, prop_str, jsname));
        }
        model.updateProperties(prop_str);
        model.updateGraphics(evalcode);
        
        // Временное решение (обновление размера пока работает только для текстов):
        if (type == 'statictext' && !model.properties.characters) {
            var model_sz = model.control.properties.size,
                gfx_sz = model.view.control.graphics.measureString(model.control.properties.text);
            if (model_sz[0] != gfx_sz[0]) model_sz[0] = gfx_sz[0];
            if (model_sz[1] != gfx_sz[1]) model_sz[1] = gfx_sz[1];
        }
        if (SUI.isContainer(type) && control.children.length) {
            var currentNode = tree.activeNode;
            tree.activeNode = tree.activeItem;
            each(control.children, function(child) { _creatItems(doc, child, evalcode); });
            tree.activeNode = currentNode;
        }
    }(doc, control, evalcode));

    app.enabledTabs = true; // Включаем обновление панелей свойств
    } catch(e) { trace(e, counts) }
}

// Перезагрузка документа (используется временный файл)
// Если передан код диалога rcWin - перезагрузка происходит на основании кода (используется в app.paste())
BuilderDocument.prototype.reload = function(rcWin) {
    try {
    var doc = this,
        app = this.app,
        tree = app.treeView.control,
        activeControl = tree.activeItem.model.getVarString(), // Запоминаем выделенный элемент
        file = doc.file,
        name = doc.name.replace(/\*/, ""),
        modified = doc.modified,
        tmpfile = new File(Folder.temp +"/_tmp_" + $.hiresTimer + ".jsx");  // получаем по возможности случайное имя файла
    doc.file = tmpfile;
    doc.file.open("w");  // теперь tmpfile.exists = true; - нужно для doc.save();
    if (rcWin) {
        doc.file.write(rcWin);
        doc.file.close();
    } else {
        doc.file.close();
        doc.save();
    }
    doc.load();
    doc.file = file;
    doc.name = name;
    app.window.text = app.version + " " + app.name + " - " +doc.name;
    tmpfile.remove();
    doc.modified = modified;
    // поменяем цвет кнопки app.btReload на зелёный
    doc._reload = false;

    // Восстанавливаем выделение
    var arrNames = activeControl.replace(/var = /,"").split("."), // arrNames[0] == <имя окна>
        control = tree.items[0].model.view.control;
    for (var i=1; i<arrNames.length; i++) control = control[arrNames[i]];
    var model = doc.findController(control).model;

    doc.activeControl = model;
    doc.activeContainer = SUI.isContainer(model.view.control) ? model.view.control : model.view.control.parent;
    app.treeView.selectItem(doc.activeControl);
    
    } catch(e) { trace(e) }
};

function normalizeRcString(str) {
    // Нужно из ресурсной строки вида stText25:StaticText {text:'stText25'},
    // убить все предшествующие табуляции и пробелы а также прибить все пустые строки
    // и строки, содержащие только закрывающие скобки "}"
    return str.replace(/^\s+/mg,"").replace(/^\s*?[}]+.*[\r|\n]?/mg,"");
}