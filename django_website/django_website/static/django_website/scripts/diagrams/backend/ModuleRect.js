let moduleRectProperties =
        {
            size: { width: 180, height: 50 },
            position: { x: 30, y: 150}
        };


var ModuleRect = new joint.shapes.standard.HeaderedRectangle(moduleRectProperties);
ModuleRect.attr('root/title', 'joint.shapes.standard.HeaderedRectangle');
ModuleRect.attr('header/fill', 'lightgray');
ModuleRect.attr('bodyText/text', '');