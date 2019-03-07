function attach_note(element, text, size, offsetOrAnchor)
{
    if (!size) size = {width: 280, height: 100};
    
    

    element.notes = new joint.shapes.standard.Rectangle();
    element.notes.attr('body/fill', '#DDDD1C');
    element.notes.attr('label/text', text);
    element.notes.resize(size.width,size.height);
    let eX = element.position().x;
    let eY = element.position().y;
    let eW = element.size().width;
    let eH = element.size().height;
    element.notes.position(eX, eY);

    if (!offsetOrAnchor)
    {
        element.notes.translate(eW + 30,  (eH - size.height)/2);
    }
    

    if (typeof(offsetOrAnchor) === 'string')
    {
        switch(offsetOrAnchor)
        {
            case 'right-vcenter':
            {
                element.notes.translate(eW + 30,  (eH - size.height)/2);

            }
            case 'right-vtop':
            {
                element.notes.translate(eW + 30,  0);
            }
        }
    }

    if (typeof(offsetOrAnchor) === 'object')
    {
        element.notes.translate(offsetOrAnchor.x, offsetOrAnchor.y);
    }

    
    
    element.notes.addTo(element.graph);
}