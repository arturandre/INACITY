class UIProfileModel extends Subject {
    constructor()
    {

    }

    renameSession(userId, sessionId, newName)
    {
        $.ajax('/api/session/rename',
        {
            method: 'POST',
            processData: false,
            data: JSON.stringify({
                'userId': userId,
                'sessionId': sessionId,
                'newName': newName
            }),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function (data, textStatus, XHR) {
                document.getElementById(`td${sessionId}`).innerHTML = newName;
            }.bind(this),
            error: function (jqXHR, textStatus, errorThrown) {
                defaultAjaxErrorHandler('renameSession', textStatus, errorThrown);
            }
        });
    }
}