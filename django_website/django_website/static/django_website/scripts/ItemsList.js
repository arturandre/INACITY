/**
 * Responsible for displaying selectable items.
 * @module ItemsList
 */

/**
 * Responsible for displaying selectable items.
 * @param {string} containerDivId - The container that holds the items.
 * @param {string} containerShadowId - The shadow background.  
 * @param {string} okbuttonId - The ok button.
 */
class ItemsList extends Subject {
    constructor(containerDivId, containerShadowId, okbuttonId) {
        super();

        this._itemsArray = [];
        this.selectedItemsArray = [];
        if (containerDivId) {
            if (typeof (containerDivId) === 'string') {
                this._container = $(`#${containerDivId}`);
            }
            else
            {
                this._container = containerDivId;
            }
        }
        if (containerShadowId) {
            this._containerShadow = $(`#${containerShadowId}`);
        }

        if (okbuttonId) {
            this._okbuttonclick = $(`#${okbuttonId}`);

            this._okbuttonclick.on("click", function () {
                this.hide();
                ItemsList.notify('okbuttonclick', this);

            }.bind(this));
        }

        ItemsList.on("selecteditemschanged", function () {
            this.redraw();
        }.bind(this));
        ItemsList.on("itemsarraychanged", function () {
            let trigger = false;
            for (let i = this.selectedItemsArray.length - 1; i >= 0; i--) {
                let item = this.selectedItemsArray[i];
                if (this.itemsArray.findIndex((p) => p.id === item.id) === -1) {
                    this.selectedItemsArray.splice(i, 1);
                    trigger = true;
                }
            }
            this.redraw();

            if (trigger = true) {
                ItemsList.notify("selecteditemschanged", this);
            }
        }.bind(this));
    }

    /**
     * Adds an item to the itemsArray.
     * @param {Item} item - It represents the item's caption and id.
     * @param {string} Item.id - Identifies an item inside the ItemsArray.
     * @param {string} Item.label - Used for displaying the item.
    */
    addItem(item) {
        //let item = { "id": id, "label": label };
        let index = this.itemsArray.findIndex((p) => p.id === item.id);
        if (index !== -1) {
            console.error(`Duplicated id (${id}) found!`)
            return;
        }
        this.itemsArray.push(item);
        ItemsList.notify('itemsarraychanged', this);
    }

    /**
     * Removes an item from the itemsArray.
     * @param {string} item - The item's id.
    */
    removeItem(id) {
        let index = this.itemsArray.findIndex((p) => p.id === id);
        if (index === -1) {
            console.error(`Item Not Found: ${id}`);
            return;
        }
        this.itemsArray.splice(index, 1);
        ItemsList.notify('itemsarraychanged', this);
    }


    /**
     * Shows the shadowContainer and its contents.
     */
    show() {
        if (this._containerShadow) {
            this._containerShadow.show();
        }
    }

    /**
     * Hides the shadowContainer and its contents.
     */
    hide() {
        if (this._containerShadow) {
            this._containerShadow.hide();
        }
    }


    get itemsArray() {
        return this._itemsArray;
    }

    /**
     * Redraws all the items based on itemsArray and selectecItemsArray.
     */
    redraw() {
        if (this._container) {
            this._container.empty();
            for (let i = 0; i < this.itemsArray.length; i++) {
                let item = this.itemsArray[i];

                let newButton = this._createButton(item);
                if (this.selectedItemsArray.findIndex((p) => p.id === item.id) !== -1) {
                    newButton.addClass("active");
                }
                this._container.append(newButton);
            }
        }
    }

    /**
     * Adds an element with a label to the container.
     * @private
     * @param {string} item - The label.
     */
    _createButton(item) {
        let newButton = $(document.createElement("button"));
        newButton.addClass("btn btn-outline-primary buttondiv");
        newButton.html(item.label);
        newButton.on("click", function () { this.toggleItemActive(item); }.bind(this));
        return newButton;
    }

        _createContainerDiv(item) {
        let newContainerDiv = $(document.createElement("div"));
        newContainerDiv.addClass("btn-group-vertical");
        newContainerDiv.html(item);
        newContainerDiv.on("click", function () { this.toggleItemActive(item); }.bind(this));
        return newContainerDiv;
    }

    /**
     * Adds the "active" class to the item's id
     * @param {string} itemId - The item's id.
     */
    setItemActive(item) {
        let index = this.itemsArray.findIndex((p) => p.id === item.id);
        if (index === -1) {
            console.log(`Item Not Found: ${item.id}`);
            return;
        }

        let indexSelected = this.selectedItemsArray.findIndex((p) => p.id === item.id);
        if (indexSelected !== -1) {
            console.log(`Item Already Selected: ${item.id}`);
        }
        this.selectedItemsArray.push(item);
        ItemsList.notify('selecteditemschanged', this);
    }

    /**
     * Removes the "active" class from the item's id
     * @param {string} itemId 
     */
    setItemInactive(id) {
        let index = this.itemsArray.findIndex((p) => p.id === id);
        if (index === -1) {
            console.log(`Item Not Found: ${id}`);
            return;
        }

        let indexSelected = this.selectedItemsArray.findIndex((p) => p.id === id);
        if (indexSelected === -1) {
            console.log(`itemId Not Found: ${itemId}`);
        }
        this.selectedItemsArray.splice(indexSelected, 1);
        ItemsList.notify('selecteditemschanged', this);
    }

    /**
     * Toggles (adds or removes) the "active" class from the item with the id "itemId"
     * @param {string} itemId 
     */
    toggleItemActive(item) {
        let index = this.itemsArray.findIndex((p) => p.id === item.id);
        if (index === -1) {
            console.log(`itemId Not Found: ${id}`);
            return;
        }

        let indexSelected = this.selectedItemsArray.findIndex((p) => p.id === item.id);
        if (indexSelected === -1) {
            this.selectedItemsArray.push(item);
        }
        else {
            this.selectedItemsArray.splice(indexSelected, 1);
        }
        ItemsList.notify('selecteditemschanged', this);
    }
}


/** 
* Triggered when an item is added or removed from itemsArray.
* @event module:ItemsList~ItemsList#itemsarraychanged
* @type {ItemsList}
* @property {ItemsList} itemsList - The items list instance.
* @property {string[]} itemsList.itemsArray - Holds the items.
* @property {string[]} itemsList.selectecItemsArray - Holds the selected items.
*/
/** 
* Triggered when an item is added or removed from selectedItemsArray.
* @event module:ItemsList~ItemsList#selecteditemschanged
* @type {ItemsList}
* @property {ItemsList} itemsList - The items list instance.
* @property {string[]} itemsList.itemsArray - Holds the items.
* @property {string[]} itemsList.selectecItemsArray - Holds the selected items.
*/
/** 
* Triggered when the "ok" button is clicked.
* @event module:ItemsList~ItemsList#okbuttonclick
* @type {ItemsList}
* @property {ItemsList} itemsList - The items list instance.
* @property {string[]} itemsList.itemsArray - Holds the items.
* @property {string[]} itemsList.selectecItemsArray - Holds the selected items.
*/
if (!ItemsList.init) {
    ItemsList.init = true;
    ItemsList.registerEventNames([
        'itemsarraychanged',
        'selecteditemschanged',
        'okbuttonclick',
    ]);
}

//Make the DIV element draggable:
dragElement(document.getElementById("mydiv"));

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    }
    else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }


    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
