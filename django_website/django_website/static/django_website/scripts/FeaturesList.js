class FeaturesList extends ItemsList {
    constructor(containerDivId, containerShadowId, okbuttonId) {
        super(containerDivId, containerShadowId, okbuttonId);
    }
    
    _createContainerAddress() {
        let container = $(document.createElement("div"));
        let containerMenu = $(document.createElement("div"));
        this.containerMenu.append(container);
        return container;
    }


}