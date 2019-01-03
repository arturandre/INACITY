var uiProfileModel = null;
var uiProfileView = null;
var uiProfileController = null;

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