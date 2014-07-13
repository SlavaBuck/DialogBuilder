/**************************************************************************
 *  03document.jsx
 *  DESCRIPTION: BuilderDocument: Класс документа (представляет редактируемый диалог)
 *  @@@BUILDINFO@@@ 03document.jsx 1.61 Sun Jul 13 2014 22:35:38 GMT+0300
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
};

// Наследуемся напрямую от MVCDocument
inherit (BuilderDocument, MVCDocument);
                                     
// Функции сохранения и открытия
/*
BuilderDocument.prototype.load = function() {
    var doc = this,
        app = doc.app;
    // К моменту вызова этого метода уже должны быть установлены свойства name и file в прототипном методе приложения loadDocument...
    if (!this.file.exists) return false;
    try {
        //....
        app.window.text = app.version + " " + app.name + " - " +doc.name; // убрать в дщкумент document load
        return true;
    } catch(e) { log(e.description); return false; }
};
*/
//~ // TODO: Оптимизировать для быстрого закрытия окна документа:
//~ BuilderDocument.prototype.close = function() {
//~     this.window.visible = false;
//~     this.app.documentsView.control.layout.layout(true);
//~     return true;
//~ }

BuilderDocument.prototype.save = function() {
    var doc = this,
        app = doc.app,
        LStr = app.LStr;
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
    } catch(e) { log(e.description); return false; }
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
    var type = (rcString.indexOf("{") != -1 ? rcString.substr(0, rcString.indexOf("{")) : rcString).replace(/\s/g,"").toLowerCase();
    var item = app.hashControls[type];
    
    // танцы с добавлением tabbedpanel и tab:
    if (!item) return;
    if (type == 'tab' && doc.activeContainer.type != 'tabbedpanel') return;
    if (doc.activeContainer.type == 'tabbedpanel' && type != 'tab') return;

    if (!doc.modified) doc.modified = true;
    var rcString = (type == 'separator' ? SUI.Separator.toString() : (item == "Window" ? 'panel' : type) + rcString.slice(type.length));
    
    try {
        var model = new uiModel(new uiView(doc, item, type).createControl(doc.activeContainer, rcString));
    } catch(e) { return null }

    // если установлен autofocus и добавлен контейнер - переустанавливаем фокус на него:
    if (app.options.autofocus && SUI.isContainer(item)) {
        app.treeView.control.activeNode = app.treeView.control.activeItem;
        doc.activeContainer = model.view.control;
    };

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

// Обеспечивается корректная очистка коллекций моделей в родительском приложении:
BuilderDocument.prototype.removeModel = function(model) {
    var app = this.app;
    app.models.splice(app.models.getFirstIndexByKeyValue("id", model.id), 1);
    return this.__super__.removeModel.call(this, model);
};

BuilderDocument.prototype.swapItem = function(model, direct) {
    // direct = Up || Down
};

BuilderDocument.prototype.load = function() {
    // документ был создан только-что с помощью addDocument() (см. MVC.DOM: MVCApplication.loadDocument())
    var doc = this,
        app = this.app,
        file = doc.file,
        body = "";
    file.open("r"); body = file.read(); file.close();
    // Вычленяем ресурсную строку, представляющую диалог целиком
    var rcWin = body.slice(body.indexOf("new Window(")+12, body.indexOf('");')).replace(/\\[\r|\n]/g, "");
    
    // переустанавливаем родительское окно
    doc.removeItem(doc.models[doc.models.length-1]);

    var model = doc.addItem(rcWin);
    if (!model) {
        // "Неудачная попытка открытия документа"
        alert(localize(app.LStr.uiErr[7]), app.name +" v"+app.version, false);
        return false;
    };
    var control = model.view.control;
    control.alignment = ['left','top'];
    
    var dlgName = body.slice(body.indexOf("var")+3, body.indexOf("new Window(")).replace(/[\s|=]/g, "");
    var evalcode = "var " + dlgName + " = control;\r" + body.slice(body.indexOf('");')+3);
    evalcode = evalcode.slice(0, evalcode.indexOf(dlgName+".show()"));
    evalcode = evalcode.slice(0, evalcode.indexOf(dlgName+".onResizing"));
    // Выполняется код под диалогом
    try {
        eval(evalcode);
    } catch(e) { trace(e) }
    
    // Создаём модели для всех элементов диалога
    (function _creatItems(doc, body, control) {
        each(control.children, function(child) {
            var type = (child.isSeparator ? 'separator' : child.type),
                item = doc.app.hashControls[type];
            new uiModel(new uiView(doc, item, type).registerHandlers(child, child.toSource()));
            if (SUI.isContainer(type)) _creatItems(doc, body, child);
        })
    }(doc, body, model.view.control));

    app.treeView.refreshItems(doc);
    //app.treeView.selectItem(model);
    app.treeView.control.items[0].expanded = true;
    doc.modified = false;
    return true;
};