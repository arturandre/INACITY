class FeaturesList extends ItemsList {
    constructor() {
        let addressesDiv = $(document.createElement("div"));
        super(addressesDiv);

        this._outerContainer = $(document.createElement("div"));
        this._outerContainer.addClass("containerAddress");
        
        this._containerMenu = $(document.createElement("div"));
        this._containerMenu.addClass("containerMenu");
        this._outerContainer.append(this._containerMenu);
        
        let pinbutton = $(document.createElement("button"));
        this._containerMenu.append(pinbutton);
        pinbutton.addClass("pinbutton");
        pinbutton.html("<i class='far fa-thumbtack'></i>");
        let trashbutton = $(document.createElement("button")); 
        trashbutton.addClass("trashbutton");
        trashbutton.html("<i class='far fa-trash'></i>");
        this._containerMenu.append(trashbutton);

        
        // this._border = $(document.createElement("border"));
        // this._border.addClass("borderDiv");
        // this._border.append(this._outerContainer);
        this._container.addClass("containerDiv btn-group-vertical btn-group-toggle");
        this._container.attr("data-toggle","buttons");
        this._outerContainer.append(this._container);
    }
}