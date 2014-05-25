DialogBuilder
=============

Дизанер и конструктор диалоговых окон для **Adobe ExtendScript© & InDesign©**, написан на чистом **JavaScript** (**ExtendScript**).

![src/doc/DBuilder_tutorial.png](src/doc/DBuilder_tutorial.png)

### Установка
**DialogBuilder** базируется на библиотеках **ExtendScript**, представленных в отдельном [репозитории](https://github.com/SlavaBuck/Includes). В данном репозитории содержиться две папки ***./contrib*** и ***./src***. Последняя скомпилированная рабочая версия находится в папке ***./contrib***. Для использования программы достаточно поместить содержимое папки *./contrib* в папку со скриптами **InDesign** и с палитры скриптов запустить файл *DBuilder.jsx* (чтобы файлы были видены в палитре скриптов InDesign, их можно расспаковать в папку *C:\Program Files (x86)\Adobe\Adobe InDesign CS6\Scripts\Scripts Panel\* - справедливо для win7 & InDesign CS6):

[![Установка и работа с DialogBuilder](https://i1.ytimg.com/vi/i6P0OuBvmqI/3.jpg?time=1401041885690)](http://youtu.be/i6P0OuBvmqI)

Для работы с исходниками необходимо дополнительно скачать библиотеки и в файле *./src/02application.jsx* прописать к ним путь:

```js
/* *************************************************************************
 *  02application.jsx
 *  DESCRIPTION: BuilderApplication: Основной класс приложения 
 *  @@@BUILDINFO@@@ 02application.jsx 1.20 Sun May 25 2014 19:23:11 GMT+0300
 * 
 * NOTICE: 
 * 
/* *************************************************************************
 * © Вячеслав aka SlavaBuck, 10.02.2014.  slava.boyko#hotmail.com
 */

// #includepath нужно настроить на папку с библиотеками
#includepath "../../Include/"
```


----------------------------------
**Copyright:** © Вячеслав aka Buck, 2014. <slava.boyko@hotmail.com>

**License:** [Creative Commons Attribution-NonCommercial-ShareAlike 3.0](http://creativecommons.org/licenses/by-nc-sa/3.0/)

**РУС:** РАЗРЕШЕНО СВОБОДНОЕ ИСПОЛЬЗОВАНИЕ ПРОИЗВЕДЕНИЯ, ПРИ УСЛОВИИ УКАЗАНИЯ ЕГО АВТОРА, НО ТОЛЬКО В НЕКОММЕРЧЕСКИХ ЦЕЛЯХ. ТАКЖЕ ВСЕ ПРОИЗВОДНЫЕ ПРОИЗВЕДЕНИЯ, ДОЛЖНЫ РАСПРОСТРАНЯТЬСЯ ПОД ЛИЦЕНЗИЕЙ CC BY-NC-SA.

**ENG:** THE WORK (AS DEFINED BELOW) IS PROVIDED UNDER THE TERMS OF THIS CREATIVE COMMONS PUBLIC LICENSE (''CCPL'' OR ''LICENSE''). THE WORK IS PROTECTED BY COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS AUTHORIZED UNDER THIS LICENSE OR COPYRIGHT LAW IS PROHIBITED.
>>>>>>> v1
