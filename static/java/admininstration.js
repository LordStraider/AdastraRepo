function createLink(text) {
    text = text.replace(/å/g, 'a');
    text = text.replace(/ä/g, 'a');
    text = text.replace(/ö/g, 'o');
    text = text.replace(/Å/g, 'A');
    text = text.replace(/Ä/g, 'A');
    text = text.replace(/Ö/g, 'O');
    text = text.replace(/ /g,'');
    return text;
}

function submitText(form) {
    var text = form.newText.value.replace(/\r\n|\r|\n/g,"\\r\\n");
    var site = form.site.value;
    var isAlbum = form.isAlbum.checked;
    var string = '';
    if (isAlbum) {
        string = '{"text": "' + text.substring(0,199) + '", "site": "' +
        site + '", "isAlbum": ' + isAlbum + '}';
    } else {
        string = '{"text": "' + text + '", "site": "' + site + '", "isAlbum": ' + isAlbum;
        var lists = $('.submitList');
        if (lists.length > 0) {
            string += ', "extra": {';

            $(lists).each(function(i, item) {
                string += item.innerHTML;
                string += ', ';
            });

            string = string.slice(0,-2);
            string += '}';
        }

        string += '}';
    }

    $.ajax({
        type: 'POST',
        url: 'submitContent/',
        data: string,

        success: function(result) {
            if (isAlbum) {
                adminloadFileContent('/administrationpage/fileLoader/'+site+'/');
            } else {
                $('#result').html("<span>Successfully updated info!</span>");
            }
        }
    });
}

function loadAdminContent(site) {
    $.getJSON(site, function(data) {
        var content = ['<br/>'];
        var subSite = site.split('/');
        content.push('<div><form class="mainContent" id="newSiteContent" action="javascript:submitText(newSiteContent)">' +
            '<input type="hidden" name="site" value="' + subSite[subSite.length - 2] + '"/>' +
            '<textarea id="textArea" cols="100" rows="'+ data.siteContent.length / 100 + '" name="newText">' +
            data.siteContent + '</textarea><br/>' +
            '<input type="checkbox" id="check" name="isAlbum" value="isAlbum"/><label for="check">Is it an album</label>' +
            '<br/><input type="submit" value="Submit"/></form><div id="result"></div>' +
            '<div id="newStuff"></div></div>' +
            '<div id="extra"><button value="addList">Add list</button>&nbsp;&nbsp;<button value="addImage">Add image</button></div>');

        $('#siteContent').html(content.join(''));

        if (data.extra !== undefined) {
            $(data.extra.split(',')).each(function(key, text) {
                $('#siteContent').append('<div class="newList"></div>');
            });
        }

        $('#check').button();
        $('input[type=submit]').button();
        $('button')
            .button()
            .click(function(e) {
                if (e.currentTarget.value === "addList") {
                    $('#newStuff').html('<ul id="listAdder"><li><input type="text" name="element" value="listElement"/>'+
                        '</li></ul><button id="addToContent">Add to content</button><button id="addElement">Add new element</button>');

                    $('#addElement')
                        .button()
                        .click(function(e) {
                            $('#listAdder').append('<li><input type="text" name="element" value="listElement"/></li>');
                        });
                    $('#addToContent')
                        .button()
                        .click(function() {
                            submitList();
                        });

                } else if (e.currentTarget.value === "addImage") {
                    var id = $('.newList').length;
                    $('#newStuff').html('<form id="uploadFile" enctype="multipart/form-data"action="javascript:uploadImage()">'+
                        '<input type="hidden" id="getSite" value="' + site.split('/')[3] + '" name="site"/><input type="hidden" '+
                        'value="_Extra_Image_Linker_' + id + '" name="link"/><input id="file" value="Select file" type="file" '+
                        'name="file"/><input type="submit"/></form>');
                }
            });
    });
}

function setSize(site, src) {
    var img = $('#resizable');
    var string = site + ', ' + img[0].name + ':' + src + '_-_' + img.height() + '_-_' + img.width();

    $.ajax({
        url: 'setSize/',
        type: 'POST',
        data: string,
        success: function(data){
            $('#newStuff').html('Remember to place the link to the image where you want it.');
        }
    });
}

function uploadImage() {
    file = $('#file')[0].files[0];
    if (file === undefined) {
        return false;
    }

    var id = $('.newList').length;
    var formData = new FormData($('#uploadFile')[0]);

    $.ajax({
        url: 'uploadImage/',
        type: 'POST',
        xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            return myXhr;
        },

        success: function(data){
            arrData = data.split(':');
            file = arrData[1].split('_-_');
            site = $('#getSite')[0].value;
            $('#newStuff').html('<img name="' + arrData[0] + '" id="resizable" class="ui-widget-content" height="' +
                file[1] + '" width="' + file[2] + '" src="/' + file[0] + '"/>' +
                '<button id="submitSize">Submit size</button>');
            $('#submitSize')
                .button()
                .click(function() {
                    setSize(site, file[0]);
                });
            $('#resizable').resizable();
            $('textArea').append('_Extra_Image_Linker_' + id);
        },

        data: formData,
        cache: false,
        contentType: false,
        processData: false
    });
}

function submitList() {
    var id = $('.newList').length;
    var list = '';
    $('#listAdder li input').each(function(i, input) {
        list += input.value + '_-_';
    });
    list = list.slice(0,-3);

    $('.mainContent').append('<div class="newList submitList">"_Extra_List_Linker_' + id + '": "' + list + '"</div>');
    $('textArea').append('_Extra_List_Linker_' + id);
    $('#newStuff').html('Place the link where you want it and press submit.');
}

function submitSubMenu(subMenu) {
    var link = createLink(subMenu.menu.value);
    var text = subMenu.menu.value;
    var site = subMenu.site.value;

    $.ajax({
        type: "POST",
        url: "submitMenu/",
        data: '{"text": "' + text + '", "link": "' + link + '", "site": "' + site + '"}',

        success: function(result){
            if (result === 'True') {
                $('.menuManager .' + site).append('<li id="' + link + '">' + text + '&nbsp;&nbsp;&nbsp;&nbsp;<img id="sub:' + link  +
                    '" src="/static/images/styles/delete.jpg" height="14px" alt=", click to delete"/></li>');
                $('#menu .' + site).append('<li id="' + link + '"><a href="/' + site + '/' + link + '/">' + text + '</a></li>');
                $( "#menu" ).menu({ position: { my: "left top", at: "top+25" } });
                $('#result').html('<span>Successfully added menu ' + text + '!</span>');
                setListener();
            } else {
                $('#result').html('<span>Error: Menu ' + text + ' already exist.</span>');
            }
        }
    });
}

function submitMenu(menu) {
    var link = createLink(menu.menu.value);
    var text = menu.menu.value;

    $.ajax({
        type: "POST",
        url: "submitMenu/",
        data: '{"text": "' + text + '", "link": "' + link + '"}',

        success: function(result){
            if (result === 'True') {
                $('.outer-ul').append('<li id="' + link + '"><a href="/' + link + '/">' + text + '</a></li>');
                $('.menuManager').append('<li id="' + link + '">' + text + '&nbsp;&nbsp;&nbsp;&nbsp;<img id="menu:' + link  +
                    '" src="/static/images/styles/delete.jpg" height="14px" alt=", click to delete"/></li>');
                $( "#menu" ).menu({ position: { my: "left top", at: "top+25" } });
                $('#result').html('<span>Successfully added ' + text + '!</span>');
                setListener();
            } else {
                $('#result').html('<span>Error: Menu ' + text + ' already exist.</span>');
            }
        }
    });
}

function sendReOrder() {
    var order = '';
    $('.menuManager .sorter').each(function(i) {
        order += this.id + ', ';
        $('#menu #' + this.id)[0].value = i;
    });
    order = order.slice(0, -2);
    $.ajax({
        type: "POST",
        url: "reorder/",
        data: order,

        success: function(result){
            if (result === 'True') {
                var ul = $('#menu');
                var li = ul.children('li');

                li.detach().sort(function(a, b) {
                    return a.value > b.value;
                });
                ul.append(li);

                $('#result').html('Successfully submitted new order!');
            } else {
                $('#result').html('Error reordering...');
            }
        }
    });
}

function loadMenuManager() {
    $.getJSON('/menu/', function(data) {
        var manager = ['<br/><ul class="menuManager">'];
        var id = 0;

        $.each (data, function (i) {
            var link = data[i].linked.split('/');
            manager.push('<li class="sorter" id="' + link[0] + '">' + data[i].menu + '&nbsp;&nbsp;&nbsp;&nbsp;<img id="menu:' + link[0] +
                '" src="/static/images/styles/delete.jpg" height="14px" alt=", click to delete"/>');
            manager.push('<ul class="' + data[i].linked + '">');
            if (data[i].subs.length > 0) {
                $.each (data[i].subs, function (j) {
                    link = data[i].subs[j].linked.split('/');
                    manager.push('<li id="' + link[0] + '">' + data[i].subs[j].sub + '&nbsp;&nbsp;&nbsp;&nbsp;<img id="sub:' + link[0]  +
                        '" src="/static/images/styles/delete.jpg" height="14px" alt=", click to delete"/></li>');
                });
            }
            manager.push('<li><form id="subMenu' + id + '" action="javascript:submitSubMenu(subMenu'+id+')">'+
                '<input type="hidden" name="site" value="' + data[i].linked + '"/><input type="text" name="menu" value="'+
                'New sub menu"/><input type="submit" value="Add"/></form></li></ul></li></li>');
            id++;
        });

        manager.push('<li><form id="newMenu" action="javascript:submitMenu(newMenu)">'+
            '<input type="text" name="menu" value="New menu"/><input type="submit" value="Add"/></form></li><li>'+
            '<button>Submit re-ordering</button></li></ul><div id="result"></div>');

        $('#siteContent').html(manager.join(''));
        $('input[type=submit]').button();
        $('button')
            .button()
            .click(function(e) {
                sendReOrder();
                e.preventDefault();
            });

        setListener();

        $('.menuManager').sortable();
        $('.menuManager').disableSelection();
    });
}

function setListener() {
    $(".menuManager img").on("click", function(e) {
        $.ajax({
            type: "POST",
            url: "removeMenu/",
            data: '{"data": "' + e.currentTarget.id + '"}',

            success: function(result){
                var link = e.currentTarget.id.split(':')[1];
                if (result) {
                    $('.menuManager #' + link).remove();
                    $('#menu #' + link).remove();
                    $('#menu').menu({ position: { my: 'left top', at: 'top+25' } });
                } else {
                    $('.menuManager #result').html(', error removing...');
                }
            }
        });
    });
}

function setAlbumListener() {
    $('#descriptionlist img').on('click', function(e) {
        if (e.currentTarget.id !== 'image') {
            var site = $('#getSite')[0].value;
            $.ajax({
                type: 'POST',
                url: 'removeFromAlbum/',
                data: '{"index": "' + e.currentTarget.id + '", "site": "' + site + '"}',

                success: function(result) {
                    var id = e.currentTarget.id;
                    if (result === "True") {
                        $('#descriptionlist #li_' + id).remove();
                    } else {
                        $('#descriptionlist #li_' + id).append(', error removing...');
                    }
                }
            });
        }
    });
}

function submitAlbum(form) {
    var formData = new FormData($('#newAlbumContent')[0]);

    $.ajax({
        url: 'upload/',
        type: 'POST',
        xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            return myXhr;
        },

        success: function(data){
            var json = $.parseJSON(data);
            if (json['newFile'] === 'True') {
                var path = json['path'];
                var file = '';
                $.each(json['file'].split(', '), function(i, img) {
                    file = img.split(':')[0];
                    $('#descriptionlist').append('<li id="li_' + i + '">' + file + ': <input type"text" value="' + file +
                        '" name="file"/><input type="hidden" value="' + file + '" name="file"/>&nbsp;&nbsp;<img height="35px" id="image' +
                        '" src="' + path + file + '" alt="' + file + '">&nbsp;&nbsp;&nbsp;&nbsp;<img id="' + i +
                        '" src="/static/images/styles/delete.jpg" height="14px" alt=", click to delete"/></li>');
                });
            }

            $('.multiupload').replaceWith($('.multiupload').clone(true));
            setAlbumListener();
        },

        data: formData,
        cache: false,
        contentType: false,
        processData: false
    });
}

function adminloadFileContent(site) {
    $.getJSON(site, function(data) {
        var file = '';
        var title = data.shift().title;
        var path = data.shift().path;
        var cnt = 0;
        var content = ['</br><form id="newAlbumContent" enctype="multipart/form-data" action="javascript:submitAlbum(newAlbumContent)">'+
            'Title: <input type="text" name="title" value="' + title + '"/><ul id="descriptionlist">'];

        $.each (data, function (i) {
            file = data[i].fileLoader.split(':');
            content.push('<li id="li_' + i +'">' + file[1] + ': <input type"text" value="' + file[0] + '" name="file"/>'+
                '<input type="hidden" value="' + file[1] + '" name="file"/>&nbsp;&nbsp;<img height="35px" src="' +
                path + file[1] + '" alt="' + file[0] + '" id="image">&nbsp;&nbsp;&nbsp;&nbsp;<img id="' + i  +
                '" src="/static/images/styles/delete.jpg" height="14px" alt=", click to delete"/></li>');
            cnt++;
        });

        content.push('</ul><ul><li><p>Add files... <input type="file" name="files[]" class="multiupload" multiple/></p></li><li>'+
            '<input type="hidden" value="' + site.split('/')[3] + '" name="site" id="getSite"/><input type="submit" value="Submit"/>'+
            '</li></ul></form><div id="result"></div>');

        $('#siteContent').html(content.join(''));

        $("#descriptionlist").sortable({
          stop: function () {
            // enable text select on inputs
            $("#descriptionlist").find("input")
             .bind('mousedown.ui-disableSelection selectstart.ui-disableSelection', function(e) {
              e.stopImmediatePropagation();
            });
          }
        }).disableSelection();

        // enable text select on inputs
        $("#descriptionlist").find("input")
         .bind('mousedown.ui-disableSelection selectstart.ui-disableSelection', function(e) {
          e.stopImmediatePropagation();
        });

        setAlbumListener();
    });
}