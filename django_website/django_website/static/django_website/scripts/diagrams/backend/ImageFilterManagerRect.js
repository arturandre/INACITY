var ImageFilterManagerRect = ModuleRect.clone();

ImageFilterManagerRect.translate(10, 190);

ImageFilterManagerRect.attr('headerText/text', 'ImageFilterManager');
ImageFilterManagerRect.attr('bodyText/text', 'Double click to see more');

let ImageFilterManagerName = 'ImageFilterManager'
let ImageFilterManagerAttributes = [
    '__instance__: ImageFilterManager',
    '_ImageFilters: dict[filterId: str, filter: ImageFilter]'];

let ImageFilterManagerMethods = [
    '- __init__(self): None',
    '- __new__(cls): __instance__',
    '+ registerFilter(self, filter: ImageFilter): None',
    '+ getAvailableImageFilters(self): dict[filterId : str, dict[name: str, id: str]]',
    '+ processImageFromFeatureCollection(self, filterId, featureCollection: FeatureCollection): FeatureCollection',
];

ImageFilterManagerRect.details = createManagerClass(
    ImageFilterManagerRect.position(),
    ImageFilterManagerName,
    ImageFilterManagerAttributes,
    ImageFilterManagerMethods);

ImageFilterManagerRect.details.origin = ImageFilterManagerRect;
ImageFilterManagerRect.addTo(graph);


let ImageProviderNoteText = 'The Image Filter Manager is responsible for \n' +
'keeping track of computer vision algorithms \n' +
'and by routing image processing requests \n' +
'to some of the implemented algorithms.';

attach_note(ImageFilterManagerRect,
    ImageProviderNoteText
);
