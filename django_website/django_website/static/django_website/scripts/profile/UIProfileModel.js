class UIProfileModel extends Subject {
    constructor()
    {
        super();
    }

    loadSession(sessionId)
    {
        $.ajax('/loadsession/',
        {
            method: 'POST',
            processData: false,
            data: JSON.stringify({
                sessionId: sessionId
            }),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function (data, textStatus, XHR) {
                
            },
            error: function (jqXHR, textStatus, errorThrown) {
                defaultAjaxErrorHandler('loadSession', textStatus, errorThrown);
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

    deleteSession(sessionId)
    {
        $.ajax('/api/session/delete/',
        {
            method: 'POST',
            processData: false,
            data: JSON.stringify({
                'sessionId': sessionId,
            }),
            context: this,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function (data, textStatus, XHR) {
                var sessionRow = document.getElementById(`td${sessionId}`);
                while (sessionRow.tagName !== "TR") sessionRow = sessionRow.parentNode;
                sessionRow.parentNode.removeChild(sessionRow);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                defaultAjaxErrorHandler('renameSession', textStatus, errorThrown);
            }
        });
    }
}