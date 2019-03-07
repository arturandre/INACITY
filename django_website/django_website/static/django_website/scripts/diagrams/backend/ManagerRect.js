var ManagerRect = ModuleRect.clone();
ManagerRect.resize(510, 420);
ManagerRect.attr('headerText/text', 'Manager');
ManagerRect.addTo(graph);

let ManagerRectTextNote = 
'Every manager has as responsability\n' +
'to delegate requests\n' +
'for data to a class responsible for\n' +
'generating/colleting that data.\n' +
'\n'+
'Managers also keep track of\n' +
'registered components\n' +
'in order to publish them to clients';

attach_note(ManagerRect, ManagerRectTextNote, {width: 280, height: 120}, 'right-vtop');