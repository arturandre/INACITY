var MapMinerManagerRect = ModuleRect.clone();

MapMinerManagerRect.translate(10, 310);
MapMinerManagerRect.attr('headerText/text', 'MapMinerManager');
MapMinerManagerRect.attr('bodyText/text', 'Double click to see more');

let MapMinerManagerName = 'MapMinerManager'
let MapMinerManagerAttributes = [
    '__instance__: MapMinerManager',
    '_MapMiners: dict[mapMinerId: str, mapMiner: MapMiner]'];

let MapMinerManagerMethods = [
    '- __init__(self): None',
    '- __new__(cls): __instance__',
    '+ registerMapMiner(self, mapMiner: MapMiner): None',
    '+ getAvailableMapMinersAndQueries(self): dict[mapMinerId: str, dict[name: str, idprovider: str]]',
    '+ requestQueryToMapMiner(self, mapMinerId: str, query: str, region: FeatureCollection) -> List[FeatureCollection]',
];

MapMinerManagerRect.details = createManagerClass(
    MapMinerManagerRect.position(),
    MapMinerManagerName,
    MapMinerManagerAttributes,
    MapMinerManagerMethods);

MapMinerManagerRect.details.origin = MapMinerManagerRect;
MapMinerManagerRect.addTo(graph);

let MapMinerManagerNoteText = 'The Map Miner Manager is \n' +
'responsible for keeping \n' +
'track of GISes data collecting \n' +
'components and for routing \n' +
'requests for geographical \n' +
'features to some GIS collector.'

attach_note(MapMinerManagerRect,
    MapMinerManagerNoteText
);

// MapMinerManagerRect.notes = new joint.shapes.standard.Rectangle(moduleRectProperties);
// MapMinerManagerRect.notes.attr('body/fill', '#DDDD1C');
// MapMinerManagerRect.notes.translate(200, 310);
// MapMinerManagerRect.notes.resize(280, 100);
// MapMinerManagerRect.notes.attr('label/text',
//     'The Map Miner Manager is \n' +
//     'responsible for keeping \n' +
//     'track of GISes data collecting \n' +
//     'components and for routing \n' +
//     'requests for geographical \n' +
//     'features to some GIS collector.');

// MapMinerManagerRect.notes.addTo(graph);