/**************************************************************************
 *  08customControllers.jsx
 *  DESCRIPTION: custom Controllers: Класс документа (представляет редактируемый диалог)
 *  @@@BUILDINFO@@@ 08customControllers.jsx 1.51 Thu Jul 03 2014 22:25:16 GMT+0300
 * 
 * NOTICE:
 *         Данные функции заменяют стандартный механизм _updateView из библиотеки MVC 
 *     Оказалось, что определённые свойства ScriptUI объектов - динамические (происходит нечто 
 *     подобное смены адреса (например для свойства alignment) после присвоения ему нового значения). 
 *         В связи с этим такие свойства нужно обновлять "в-ручном" режиме, для них нужны отдельные обновлялки.
 *     
/**************************************************************************
 * © Вячеслав aka SlavaBuck, 03.07.2014.  slava.boyko#hotmail.com
 */

// ------------------------------------------------------------------------
// Специальная обработка для свойств размера
function _updViewMsts(newVal, oldVal, key) {
    try {
    // this указывает на объект контролёра. watch не работает. (данные модели требуют обновления вручную)
    // this.model_obj уже имеет новое значение, инициализированное в диспатчере
    this.special = true; // Ставим метку в котроллёре, чтобы повторно не отрабатывать в customUpdate: 
    var app = this.app.app, // this.app указывает на BuilderDocument а нам нужен BuilderApplication
        w = this.app.window,
        model_obj = this.model_obj,
        model_pro = this.model.control.properties,
        control = this.view.control,
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
                    case 'edittext': sz[0] -= 10; sz[1] += 6; break;
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
    } catch(e) { trace(e, "_updViewMsts:") }
};

// ------------------------------------------------------------------------
// Специальная обработка для свойств выравнивания
function _updViewAlign(newVal, oldVal, key) {
    // this указывает на объект контролёра. watch не работает. (данные модели требуют обновления вручную)
    // this.model_obj уже имеет новое значение, инициализированное в диспатчере
    this.special = true; // Ставим метку в котроллёре, чтобы повторно не отрабатывать в customUpdate: 
    try {
    var app = this.app.app, // this.app указывает на BuilderDocument а нам нужен BuilderApplication
        w = this.app.window,    
        model_obj = this.model_obj,
        model_pro = this.model.control.properties,
        control = this.view.control,
        prop = this.binding.split(':')[0].split('.');
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