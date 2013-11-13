from django.shortcuts import render_to_response, render
from django.http import HttpResponse
from dataManager.models import UploadFileForm, Menu, DropDown, Content
from django.contrib.auth.views import login as auth_login
from django.utils import simplejson
from django.conf import settings
from django.template import RequestContext
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth import authenticate, login, logout
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os


@csrf_protect
def uploadFiles(request):
    """
    This function is used to upload multiple files form HTML5 and ajax request, it checks that the user
    is logged in, and then checks for correct request, then open/create the map for the file and write
    each file's content.
    """
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))
    import re

    chars = [',', ':', '!', ';', '?']

    if request.method == 'POST':
        if request.is_ajax():
            newString = ''  # This variable is going to contain json string for the object in the database.
            site = request.POST.get('site')
            albumpath = 'home/AdastraRepo/media/images/' + site + '/'
            #albumpath = 'static/albums/' + site + '/'

            if not os.path.isdir(albumpath):  # Check if the path exist, otherwise create it
                os.makedirs(albumpath)

            for file in request.FILES.getlist('files[]'):  # For each file in the request, open/create it and write the content.
                path = '%s' % (albumpath + re.sub('[%s]' % ''.join(chars), '', file.name))
                #print path
                destination = open(path, 'w+b')
                for chunk in file.read():
                    destination.write(chunk)
                destination.close()

                newString += re.sub('[%s]' % ''.join(chars), '', file.name) + ':' + re.sub('[%s]' % ''.join(chars), '', file.name) + ', '
            newString = newString[:-2]  # Remove trailing ', '

            title = re.sub('[%s]' % ''.join(chars), '', request.POST.get('title'))
            string = title + ', '
            toggle = True

            for destination in request.POST.getlist('file'):  # Create a list of all previous files, contains changes in descriptions of images
                string += re.sub('[%s]' % ''.join(chars), '', destination)
                if toggle:
                    string += ':'
                else:
                    string += ', '
                toggle = not toggle

            if newString == '':
                string = string[:-2]
            else:
                string += newString

            obj = Content.objects.get(site=site)  # Update the content of the album
            obj.text = string
            obj.save()

            if newString != '':
                json = '{"newFile": "True", "path": "/media/images/' + site + '/", "file": "' + newString + '"}'
            else:
                json = '{"newFile": "False"}'

            return HttpResponse(json)
        return HttpResponse('{"error": "not ajax."}')
    return HttpResponse('{"error": "not post."}')


@csrf_protect
def uploadImage(request):
    """
    Uploads a single file to be used on a specific site.
    """
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    import re
    chars = [',', ':', '!', ';', '?']

    if request.method == 'POST':
        if request.is_ajax():
            albumpath = 'home/AdastraRepo/media/images/contentImages/'
            file = request.FILES.getlist('file')[0]
            path = '%s' % (albumpath + re.sub('[%s]' % ''.join(chars), '', file.name))
            #path = albumpath + file.name
            destination = open(path, 'w')
            for chunk in file.read():
                destination.write(chunk)
            destination.close()

            #print request.POST.get('site')
            obj = Content.objects.get(site=request.POST.get('site'))
            #print '[img]' + file.name + ',200,200[/img]'
            obj.text += '[img]' + file.name + ',200,200[/img]'
            obj.save()

            return HttpResponse('success')
        return HttpResponse('{"error": "not ajax."}')
    return HttpResponse('{"error": "not post."}')


def index(request, site=''):  # Loads the index template, all subsites are routed to index
    return render_to_response('index.html', context_instance=RequestContext(request))


@csrf_protect
def admin_index(request, site=''):  # Checks for authentication and then gives access to admin site
    if request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('adminIndex.html', context_instance=RequestContext(request))
    return render_to_response('login.html', context_instance=RequestContext(request))


@csrf_protect
def submitMenu(request):  # Updates the database with changes to the menu system
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    js = simplejson.loads(request.POST.items()[0][0])  # Read ajax data
    text = js.get('text')
    link = js.get('link')
    site = ''
    ret = True

    try:
        if Menu.objects.get(link=link):
            ret = False
    except Exception:
        pass

    if js.get('site'):
        site = js.get('site')

    try:
        if DropDown.objects.get(link=link):
            ret = False
    except Exception:
        pass

    try:
        if DropDown.objects.get(link=site):
            ret = False
    except Exception:
        pass

    if ret and js.get('site'):  # Check if it is a menu or a dropdown and create new.
        DropDown.create(Menu.objects.get(link=site), text, link, False)
        Content.create(text, link)
    elif ret:
        Menu.create(text, link, False)
        Content.create(text, link)

    return HttpResponse(ret)


@csrf_protect
def submitContent(request):  # Updates the content of a page.
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    #print request.POST.items()[0]
    js = simplejson.loads(request.POST.items()[0][0].encode('utf-8'))  # Read ajax data
    text = js.get('text')
    site = js.get('site')
    album = js.get('isAlbum')
    if album:
        dropDown = DropDown.objects.get(link=site)  # did we change the site to an album?
        dropDown.hasFiles = True
        dropDown.save()

    obj = Content.objects.get(site=site)
    obj.text = text

    newString = ''
    if js.get('extra'):
        newString += js.get('extra')

        if obj.extra == ',':
            obj.extra = newString[1:]
        else:
            obj.extra += newString
    obj.save()
    return HttpResponse(True)


@csrf_protect
def reorder(request):  # Reorders the menu list.
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    i = 0
    for menu in request.POST.items()[0][0].split(', '):
        obj = Menu.objects.get(link=menu)
        obj.order = i
        obj.save()
        i += 1
    return HttpResponse(True)


@csrf_protect
def setSize(request):  # Changes the size of a picture on a site
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    arr = request.POST.items()[0][0].split(', ')
    site = arr[0]
    change = arr[1].split(':')
    string = ''

    obj = Content.objects.get(site=site)  # Get object, iterate to find picture, update and save.
    for extra in obj.extra.split(','):
        var = extra.split(':')
        string += var[0]
        if var[0] == change[0]:
            string += ':' + change[1] + ','
        else:
            string += ':' + var[1] + ','
    obj.extra = string[:-1]
    obj.save()
    return HttpResponse(True)


@csrf_protect
def removeMenu(request):  # Removes menus from the database.
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    data = simplejson.loads(request.POST.items()[0][0]).get('data').split(':')
    if data[0] == 'menu':
        menu = Menu.objects.get(link=data[1])
        try:  # Maybe there exists dropdowns from this menu, then remove them as well.
            for item in DropDown.objects.all().filter(Menu=menu):
                Content.objects.get(site=item.link).delete()
                item.delete()
        except NameError:
            pass
        Content.objects.get(site=menu.link).delete()
        menu.delete()
        return HttpResponse(True)
    elif data[0] == 'sub':
        dropDown = DropDown.objects.get(link=data[1])
        Content.objects.get(site=dropDown.link).delete()
        dropDown.delete()
        return HttpResponse(True)
    return HttpResponse(False)


@csrf_protect
def removeFromAlbum(request):  # remove a picture from an album.
    if not request.user.is_authenticated() and request.user.is_staff:
        return render_to_response('login.html', context_instance=RequestContext(request))

    data = simplejson.loads(request.POST.items()[0][0])
    index = int(data.get('index')) + 1
    site = data.get('site')
    string = ''
    i = 0
    obj = Content.objects.get(site=site)
    for part in obj.text.split(','):
        if index != i:
            string += part + ','
        i += 1
    string = string[:-1]
    obj.text = string
    obj.save()
    return HttpResponse(True)


@csrf_protect
def view_logout(request):  # log out from the site
    logout(request)
    return render_to_response('index.html', context_instance=RequestContext(request))


@csrf_protect
def checkLoggedIn(request):  # confirm that the user is still active.
    if request.user.is_authenticated():
        string = '{"loggedIn": "True", "firstName": "' + request.user.first_name + '", "lastName": "' + request.user.last_name + '"}'
    else:
        string = '{"loggedIn": "False"}'
    input_map = simplejson.loads(string, strict=False)
    return HttpResponse(simplejson.dumps(input_map), mimetype='application/javascript')


@csrf_protect
def siteContent(request, site=''):  # returns  the site content in json form
    item = Content.objects.get(site=site)
    string = '{"admin": false, "siteContent": "' + item.text
    if item.extra not in [','] and item.extra:
        string += '", "extra": "' + item.extra
    string += '"}'
    input_map = simplejson.loads(string, strict=False)
    return HttpResponse(simplejson.dumps(input_map), mimetype='application/javascript')


@csrf_protect
def siteAdminContent(request, site=''):  # returns the site content in json form with admin set to true
    item = Content.objects.get(site=site)
    string = '{"admin": true, "siteContent": "' + item.text
    if item.extra not in [','] and item.extra:
        string += '", "extra": "' + item.extra
    string += '"}'
    input_map = simplejson.loads(string, strict=False)
    return HttpResponse(simplejson.dumps(input_map), mimetype='application/javascript')


@csrf_protect
def fileLoader(request, site=''):  # returns the content of the albums, listing all pictures in json.
    imageAlbum = Content.objects.get(site=site).text.split(', ')
    string = '[{"title": "' + imageAlbum.pop(0) + '"}, {"path": "' + settings.MEDIA_URL + 'images/' + site + '/"}, '
    for image in imageAlbum:
        string += '{"fileLoader": "' + image + '"}, '
    string = string[:-2] + ']'
    input_map = simplejson.loads(string, strict=False)
    return HttpResponse(simplejson.dumps(input_map), mimetype='application/javascript')


@csrf_protect
def menu(request):  # returns a json with all menus and dropowns.
    if request.is_ajax():
        string = '['
        for item in Menu.objects.all().order_by('order'):
            string += '{"menu": "' + item.text + '", "subs": [  '
            for sub in DropDown.objects.filter(Menu=item):
                string += '{"sub": "' + sub.text + '", "linked": "' + sub.link
                if sub.hasFiles:
                    string += '/fileLoader'
                string += '"}, '
            string = string[:-2] + '], "linked": "' + item.link + '"}, '
        string = string[:-2] + ']'

        input_map = simplejson.loads(string)
        return HttpResponse(simplejson.dumps(input_map), mimetype='application/javascript')
