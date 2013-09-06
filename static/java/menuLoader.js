function getSiteString() {
    var site = window.location.href.split('/');
    if (site.length <= 4)
        return "siteContent/Hem";
    return site[site.length - 2];
}

function loadMenu(loggedIn) {
    $.getJSON('/menu/', function(data) {
        var menu = [];

        $.each (data, function (i) {
            menu.push('<li value="' + i + '" id="' + data[i].linked + '"><a href="/' + data[i].linked + '/">' + data[i].menu + '</a>');
            if (data[i].subs.length > 0) {
                menu.push('<ul class="' + data[i].linked + '">');

                $.each (data[i].subs, function (j) {
                    menu.push('<li id="' + data[i].subs[j].linked + '"><a href="/' + data[i].linked + '/' + data[i].subs[j].linked + '/">' + data[i].subs[j].sub + '</a></li>');
                });

                menu.push('</ul>');
            }
            menu.push('</li>');
        });

        if (loggedIn) {
            menu.push('<li value="999"><a href="/manageMenu/">Manage menu</a></li>');
        }

        $('<ul/>', {
            id: "menu",
            class: "outer-ul",
            html: menu.join('')
        }).appendTo('#jquerymenu');

        $( "#menu" ).menu({ position: { my: "left top", at: "top+25" } });
    });
}