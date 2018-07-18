/**
* Responsible for keeping the state of the UI
* @module "UIHandler.js"
*/

/**
 * Responsible for keeping user selections.
 * @param {string} SelectedMapMiner - Selected map miner's id
 * @param {string} SelectedMapFeature - Selected map features's id
 * @param {string} SelectedImageProvider - Selected image providers' id
 */
class UIHandler {
    constructor()
    {
        this._SelectedMapMiner = null;
        this._SelectedMapFeature = null;
        this._SelectedImageProvider = null;
    }

    set SelectedMapMiner(mapMiner) {
        this._SelectedMapMiner = mapMiner;
    }
    set SelectedMapFeature(mapFeature) {
        this._SelectedMapFeature = mapFeature;
    }
    set SelectedImageProvider(imageProvider) {
        this._SelectedImageProvider = imageProvider;
    }

    get SelectedMapMiner() { return this._SelectedMapMiner; }
    get SelectedMapFeature() { this._SelectedMapFeature; }
    get SelectedImageProvider() { this._SelectedImageProvider; }

    //function setAvailableImageMiners() {
    function populateImageProviderDiv(imageProviders) {
        let imageProviderDiv = $(`#imageProviderDiv`);
        imageProviderDiv.empty();
        for (let imageProviderIdx in imageProviders) {
            let imageProviderName = imageProviders[imageProviderIdx].name;
            let imageProviderBtn = create_dropDown_aButton(imageProviderName, imageProviderIdx, this.changeImageProviderClick);
            imageProviderDiv.append(imageProviderBtn);
        }
    }

    /**
     * Handler for changing map tiles.
     * @param {string} imageProviderId - Id defined in the back-end ImageMiner
     * @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     */
    function changeImageProviderClick(imageProviderId, event) {
        if (!btnElementChecker(event)) return;
        _UIHandler.SelectedImageProvider = imageProviderId;
        $(`#btnCollectImages`).removeClass("hidden");
        let imageProviderBtn = $(`#btnImageProvider`);
        imageProviderBtn.addClass("btn-success");
        imageProviderBtn.removeClass("btn-secondary");

        imageProviderBtn.html(availableImageMiners[imageProviderId].name);
    }
}
