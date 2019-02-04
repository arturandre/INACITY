class UIProfileModel extends Subject {
    constructor()
    {
        super();
    }

    loadSession(sessionId)
    {
        $.ajax('/loadsession/',
        {
            processData: false,
            data: JSON.stringify({
                sessionId: sessionId
            }),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function (data, textStatus, XHR) {
                
            },
            error: function (jqXHR, textStatus, errorThrown) {
                defaultAjaxErrorHandler('renameSession', textStatus, errorThrown);
            }
        });
    }

    renameSession(sessionId, newName)
    {
        $.ajax('/api/session/rename/',
        {
            method: 'POST',
            processData: false,
            data: JSON.stringify({
                'sessionId': sessionId,
                'newName': newName
            }),
            context: this,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function (data, textStatus, XHR) {
                document.getElementById(`td${sessionId}`).innerText = newName;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                defaultAjaxErrorHandler('renameSession', textStatus, errorThrown);
            }
        });
    }
}