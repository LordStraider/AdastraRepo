function loadContent(site) {
    $.getJSON(site, function(data) {
        var content = [''];

        var html = data.siteContent.replace(/\r\n/g, '<br/>');
        var html2 = '';
        $(html.split('[img]')).each(function(key, text) {
            if (key === 0)
                html2 = text;
            else
                html2 += '<div class="image"><img src="/media/images/contentImages/' + text.replace(',', '" width="').replace(',', '" height="').replace('[/img]', '" /></div>');
        });
        content.push(html2);
        html = content.join('');
        content = [''];

        html2 = '';
        $(html.split('[b]')).each(function(key, text) {
            if (key === 0)
                html2 = text;
            else
                html2 += '<b>' + text.replace('[/b]', '</b>');
        });
        content.push(html2);
        html = content.join('');
        content = [''];

        html2 = '';
        $(html.split('[i]')).each(function(key, text) {
            if (key === 0)
                html2 = text;
            else
                html2 += '<i>' + text.replace('[/i]', '</i>');
        });
        content.push(html2);
        html = content.join('');
        content = [''];

        html2 = '';
        $(html.split('[h1]')).each(function(key, text) {
            if (key === 0)
                html2 = text;
            else
                html2 += '<h1>' + text.replace('[/h1]', '</h1>');
        });
        content.push(html2);
        html = content.join('');
        content = [''];

        html2 = '';
        $(html.split('[h2]')).each(function(key, text) {
            if (key === 0)
                html2 = text;
            else
                html2 += '<h2>' + text.replace('[/h2]', '</h2>');
        });
        content.push(html2);
        html = content.join('');
        content = [''];

        html2 = '';
        $(html.split('[a]')).each(function(key, text) {
            if (key === 0)
                html2 = text;
            else
                html2 += '<a href="' + text.replace(',', '">').replace('[/a]', '</a>');
        });
        content.push(html2);
        content.push('<div style="clear:both;"></div>');
        html = content.join('').replace(/%22/g, '"');
        content = [''];

        $('#siteContent').html(html);
    });
}

function changePicture(src, alt) {
    if (src !== undefined) {
        var file = src.split('media');
        $('#picture').html('<img src="/media' + file[1] + '" alt="' + alt + '"><p>Beskrivning: ' + alt + '</p>');
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
    if (e.target.href !== undefined) {
        prev = $(e.target.parentElement);
        
        var href = e.target.href.split('/');
        if (href[href.length - 2] == 'fileLoader') {
            if (loggedIn) {
                adminloadFileContent(preAdress + '/fileLoader/' + href[href.length - 3] + '/');
            } else {
                loadFileContent('/fileLoader/' + href[href.length - 3] + '/');
            }
        } else {
            if (loggedIn) {
                //console.log("loading " + preAdress +'/siteContent/' + href[href.length - 2] + '/');
                loadAdminContent(preAdress + '/siteContent/' + href[href.length - 2] + '/');
            } else {
                loadContent(preAdress + '/siteContent/' + href[href.length - 2] + '/');
            }
        }
    }
    return false;
}

function adjustStyle(width, hasIE) {
    widthInt = parseInt(width, 10);
    if (widthInt < 600) {
        $("#displayMenu").show();
        $("#size-stylesheet").attr("href", "/static/css/narrow.css");
        $("#menu-stylesheet").attr("href", "/static/css/menuNarrow.css");
    } else if ((widthInt >= 601) && (widthInt < 1130)) {
        $("#displayMenu").show();
        $("#size-stylesheet").attr("href", "/static/css/medium.css");
        $("#menu-stylesheet").attr("href", "/static/css/menuNarrow.css");
    } else {
        $("#displayMenu").hide();
        $("#menu3").show();
        if (hasIE) {
            $("#menu-stylesheet").attr("href", "/static/css/menuIE.css");
        } else {
            $("#menu-stylesheet").attr("href", "/static/css/menu.css");
        }
        $("#size-stylesheet").attr("href", "/static/css/wide.css");
    }
}
