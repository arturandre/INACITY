var ImageProviderManagerRect = ModuleRect.clone();

ImageProviderManagerRect.translate(10, 70);

ImageProviderManagerRect.attr('headerText/text', 'ImageProviderManager');
ImageProviderManagerRect.attr('bodyText/text', 'Double click to see more');

let ImageProviderManagerName = 'ImageProviderManager'
let ImageProviderManagerAttributes = [
    '__instance__: ImageProviderManager',
    '_ImageProviders: dict[ImageProviderId: str,  provider: ImageProvider]'];

let ImageProviderManagerMethods = [
    '- __init__(self): None',
    '- __new__(cls): __instance__',
    '+ registerImageProvider(self, provider: ImageProvider): None',
    '+ ImageProviders(self): _ImageProviders',
    '+ getAvailableImageProviders(self): dict[imageProviderId: dict[name: str, idprovider: str]]',
    '+ getImageForFeatureCollection(self, imageProviderId, featureCollection: FeatureCollection): List[GeoImage]',
];

ImageProviderManagerRect.details = createManagerClass(
    ImageProviderManagerRect.position(),
    ImageProviderManagerName,
    ImageProviderManagerAttributes,
    ImageProviderManagerMethods);

ImageProviderManagerRect.details.origin = ImageProviderManagerRect;
ImageProviderManagerRect.addTo(graph);

let ImageProviderManagerNoteText = 'The Image Provider Manager is \n' +
    'responsible for keeping track \n' +
    'of image collecting components \n' +
    'and for routing image requests \n' +
    'to some image provider.';

attach_note(ImageProviderManagerRect,
    ImageProviderManagerNoteText
);