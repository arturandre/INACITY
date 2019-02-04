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

    onClickLoadSessionBtn(evt){
        let btn = $(evt.target);
        let sessionId = btn.attr('data-session-id');
        //let sessionName = $(`#td${sessionId}`)[0].innerText;
        this.uiProfileModel.loadSession(sessionId);
    }

    onClickRenameSessionBtn(evt){
        let btn = $(evt.target);
        let sessionId = btn.attr('data-session-id');
        let sessionName = $(`#td${sessionId}`)[0].innerText;
        let newSessionName = this.uiProfileView.askSessionName(sessionName);
    
        this.uiProfileModel.renameSession(sessionId, newSessionName);
    }
    onClickDeleteSessionBtn(){

    }
}