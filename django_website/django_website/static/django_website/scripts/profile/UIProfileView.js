class UIProfileView{
    constructor(uiProfileModel)
    {
        this.uiProfileModel = uiProfileModel;

        this.onClickLoadSessionBtn = null;
        this.onClickRenameSessionBtn = null;
        this.onClickDeleteSessionBtn = null;

        /**
         * Some buttons in this page are loaded by Template files (based on user sessions).
         * There's multiples equal buttons in this page (since they've all the same functions) so we need to treat
         * them with a list.
         */
        this.btnLoadSessionList = $("[data-custom-id=btnLoadSession]");
        this.btnRenameSessionList = $("[data-custom-id=btnRenameSession]");
        this.btnDeleteSessionList = $("[data-custom-id=btnDeleteSession]");
    }

    initialize()
    {
        this.btnLoadSessionList.each(function(_, btn)   { $(btn).on("click", this.onClickLoadSessionBtn.bind(this));}.bind(this));
        this.btnRenameSessionList.each(function(_, btn) { $(btn).on("click", this.onClickRenameSessionBtn.bind(this));}.bind(this));
        this.btnDeleteSessionList.each(function(_, btn) { $(btn).on("click", this.onClickDeleteSessionBtn.bind(this));}.bind(this));
    }

    askSessionName(currentSessionName="")
    {
        return window.prompt(gettext("Would you like to give this session a name? Current one is:"), currentSessionName);
    }


}