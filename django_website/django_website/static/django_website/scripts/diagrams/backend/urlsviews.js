var urlsRect = ModuleRect.clone();
var viewsRect = ModuleRect.clone();

urlsRect.position(30, 20);
urlsRect.resize(160, 40);
urlsRect.attr('headerText/text', 'urls');
urlsRect.addTo(graph);

let urlsRectTextNote =
'urls is a default component of django\n'+
'applications responsible for exposing\n'+
'all the endpoints used to make requests\n'+
'to the server by some client.';

attach_note(urlsRect, urlsRectTextNote, null, 'right-vtop');

viewsRect.position(520, 20);
viewsRect.resize(160, 40);
viewsRect.attr('headerText/text', 'views');
viewsRect.addTo(graph);

let viewsRectTextNote =
'The \'views\' component works side-by-side with\n'+
'the urls component. It implements functions\n'+
'that are called when some endpoint is reached\n'+
'by some client.';

attach_note(viewsRect, viewsRectTextNote, {width: 300, height: 100}, 'right-vtop');
