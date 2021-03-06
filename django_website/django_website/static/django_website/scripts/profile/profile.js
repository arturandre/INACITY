let uiProfileModel = null;
let uiProfileView = null;
let uiProfileController = null;

function initializeUI() {
    uiProfileModel = new UIProfileModel();
    uiProfileView = new UIProfileView(uiProfileModel);
    uiProfileController = new UIProfileController(uiProfileModel, uiProfileView);
}

/**
 * JQuery ready function used to initialize variables
 */
$(document).ready(function () {
    initializeUI();
});