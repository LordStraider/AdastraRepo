function loadContent(site) {
    $.getJSON(site, function(data) {
        var content = ['<br/>'];
        var list = [];
        var re = [];
        if (data.extra !== undefined) {
            $(data.extra.split(',')).each(function(key, text) {
                var arr = text.split(':');
                re.push( new RegExp(arr[0], 'g') );
                if (arr[0].search('List_Linker') !== -1) {
                    list.push( '<div class="list"><ul><li>' + arr[1].replace(/_-_/g, '</li><li>') +
                        '</li></ul></div>' );
                } else {
                    size = arr[1].split('_-_');
                    list.push( '<div class="image"><img src="/' + size[0] + '" height="' +
                        size[1] + '" width="' + size[2] + '"/></div>' );
                }
            });
        }

        $(data.siteContent.split('\n')).each(function(key, text) {
            $(re).each(function (i, r) {
                text = text.replace(r,list[i]);
            });
            content.push('<br/>' + text);
        });

        content.push('<div style="clear:both;"></div>');
        $('#siteContent').html(content.join(''));
    });
}

function changePicture(src, alt) {
    if (src !== undefined) {
        //var file = src.split('http://192.168.1.42');
        var file = src.split('localhost:8000');
        console.log(file);
        $('#picture').html('<img src="' + file[1] + '" alt="' + alt + '"><p>Beskrivning: ' + alt + '</p>');
    }
}

function loadFileContent(site) {
    $.getJSON(site, function(data) {
        var file = '';
        var title = data.shift().title;
        var content = ['<div class="scroll-pane ui-widget ui-widget-header ui-corner-all"><div class="scroll-content">'];
        var path = data.shift().path;
        var active = data[0].fileLoader.split(':');
        var cnt = 0;

        $.each (data, function (i) {
            file = data[i].fileLoader.split(':');
            content.push('<div class="scroll-content-item ui-widget-header"><img id="' + i + '" src="' + path + file[1] + '" alt="' +
                file[0] + '">&nbsp;&nbsp;</div>');
            cnt++;
        });


        content.push('</div><div class="scroll-bar-wrap ui-widget-content ui-corner-bottom"><div class="scroll-bar"></div></div></div>');
        content.push('<div style="clear:both;"></div>');
        $('#siteContent').html('<h2>' + title + '</h2><div id="picture"></div>');

        $('<div/>', {
            id:'gallery',
            html: content.join('')
        }).appendTo('#siteContent');

        $('#picture').html('<img src="' + path + active[1] + '" alt="' + active[0] + '"><p>Beskrivning: ' + active[0] + '</p>');

        setNumbPic();
        setScrollBar();
    });
}

var prev;
function reloadPage(e, preAdress, loggedIn) {
    console.log(e.target.href);
    if (e.target.href !== undefined) {
        e.stopImmediatePropagation();

        if (prev !== undefined)
            prev.removeClass("cssmenu-active");
        prev = $(e.target.parentElement);
        prev.addClass("cssmenu-active");

        var href = e.target.href.split('/');
        if (href[href.length - 2] == 'fileLoader') {
            if (loggedIn) {
                adminloadFileContent(preAdress + '/fileLoader/' + href[href.length - 3] + '/');
            } else {
                loadFileContent('/fileLoader/' + href[href.length - 3] + '/');
            }
        } else {
            if (loggedIn) {
                loadAdminContent(preAdress + '/siteContent/' + href[href.length - 2] + '/');
            } else {
                loadContent(preAdress + '/siteContent/' + href[href.length - 2] + '/');
            }
        }
        return false;
    }
}
