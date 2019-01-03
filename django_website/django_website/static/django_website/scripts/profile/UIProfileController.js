class UIProfileController{
    constructor(uiProfileModel, uiProfileView)
    {
        this.uiProfileModel = uiProfileModel;
        this.uiProfileView = uiProfileView;

        this.initialize();
        this.uiProfileView.initialize();
    }

    initialize(){
        this.uiProfileView.onClickLoadSessionBtn = this.onClickLoadSessionBtn.bind(this);
        this.uiProfileView.onClickRenameSessionBtn = this.onClickRenameSessionBtn.bind(this);
        this.uiProfileView.onClickDeleteSessionBtn = this.onClickDeleteSessionBtn.bind(this);
    }

    onClickLoadSessionBtn(){

    }

    onClickRenameSessionBtn(evt){
        let btn = $(evt.target);
        this.uiProfileModel.renameSession(btn);
    }
    onClickDeleteSessionBtn(){

    }
}