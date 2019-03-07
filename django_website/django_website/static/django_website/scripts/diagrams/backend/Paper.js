var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('myholder'),
    model: graph,
    width: 1200,
    height: 700, // height had to be increased
    gridSize: 10,
    //drawGrid: true,
    // background: {
    //     color: 'rgba(0, 255, 0, 0.3)'
    // }
});

paper.on('element:pointerdblclick', function (elementView) {
    //resetAll(this);

    var currentElement = elementView.model;
    //currentElement.attr('body/stroke', 'orange')
    if (currentElement.details) {
        currentElement.details.position
        (
            currentElement.position().x,
            currentElement.position().y
        );
        currentElement.details.addTo(graph);
    }
    else if (currentElement.origin) {
        currentElement.origin.addTo(graph);
        if (currentElement.origin.notes)
        {
            currentElement.origin.notes.addTo(graph);
        }
    }

    if (currentElement.details || currentElement.origin) {
        currentElement.remove();
        if (currentElement.notes)
        {
            currentElement.notes.remove();
        }
    }
});

var uml = joint.shapes.uml;

