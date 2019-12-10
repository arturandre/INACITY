/**
 * SessionManager module contains classes responsible for storing
 * and retrieving session data from an anonymous (not logged) user
 * and also from an named (logged) user.
 * @module SessionManager
 */

class SessionManager extends Subject
{
    constructor(sessionObjects)
    {
        super();
        this._sessionObjects = sessionObjects;
        this._loading = false;
        // this._uiModel = uiModel;
        // this._geoImageManager = geoImageManager;
        // this._openLayersHandler = openLayersHandler;


        /*OpenLayers Event Handlers*/
        // this._openLayersHandler.globalVectorSource.on('addfeature', this.olFeatureChangedHandler, this);
        // this._openLayersHandler.globalVectorSource.on('removefeature', this.olFeatureChangedHandler, this);
        // this._openLayersHandler.globalVectorSource.on('changefeature', this.olFeatureChangedHandler, this);
        UIModel.on('featurecreated', () => this.saveSession());
        UIModel.on('featureupdated', () => this.saveSession());
        UIModel.on('featuresmerged', () => this.saveSession());
        UIModel.on('regioncreated', () => this.saveSession());
        UIModel.on('regiondeleted', () => this.saveSession());
        UIModel.on('regionlistitemclick', () => this.saveSession());
        UIModel.on('getimages', () => this.saveSession());
        GeoImageManager.on('geoimagecollectionchange', () => this.saveSession());
        RegionLayer.on('featurecollectionchange', () => this.saveSession());
        //Layer.on('featurecollectionchange', () => this.saveSession());
    }

    get currentSessionName()
    {
        return this._currentSessionName;
    }


    // async olFeatureChangedHandler(vectorevent)
    // {
    //     if (vectorevent.feature.getProperties()['type'] === 'region')
    //     {
    //         await this.saveSession();
    //     }
    // }

    /**
    * @todo Display success and error messages.
    */
    async saveSession(sessionName)
    {
        if (this._loading) return;
        sessionName = sessionName ? sessionName :
            this.currentSessionName ? this.currentSessionName :
                undefined;

        this._currentSessionName = sessionName;

        let session = {};
        session.sessionName = sessionName;
        for (let key in this._sessionObjects)
        {
            session[key] = this._sessionObjects[key].saveToJSON();
        }

        await $.ajax('/savesession/',
            {
                method: 'POST',
                processData: false,
                data: JSON.stringify(session),
                contentType: "application/json; charset=utf-8",
                context: this,
                dataType: 'text'
            })
            .done((userSessionId, textStatus, jqXHR) =>
            {
                //Success message
                //data -> sessionId
                if (!this._currentSessionName) this._currentSessionName = userSessionId;
                SessionManager.notify('sessionsaved', true);
            })
            .fail((jqXHR, textStatus, errorThrown) =>
            {
                throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
            });
                
            
    }

    async newSession()
    {
        await $.ajax('newsession/',
            {
                method: 'POST',
                processData: false,
                data: undefined,
                context: this
            })
            .done(() =>
                {
                    //Success message
                    this._clear();
            })
            .fail((jqXHR, textStatus, errorThrown) =>
                {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                }
        );
        return true;
    }

    clearSession()
    {
        $.ajax('/clearsession/',
            {
                method: 'POST',
                processData: false,
                data: undefined,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                context: this,
                success: function (data, textStatus, jqXHR)
                {
                    //Success message
                    this._clear();
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                },
                complete: function (jqXHR, textStatus) { }
            });

    }

    _clear()
    {
        this._currentSessionName = null;
        for (let key in this._sessionObjects)
        {
            this._sessionObjects[key].clear();
        }
    }

    /**
     * @todo Treat cases in which session returns as a string from the server
     * @param {String} sessionId - Represents the user session id (not to be confused with Django's session)
     */
    async loadSession(sessionId)
    {
        try
        {
            this._loading = true;
            let session = await this.getServerSession(sessionId);
            if (!session) return;

            if (typeof (session) === "string")
            {
                session = JSON.parse(session);
            }

            if (session.sessionName) this._currentSessionName = session.sessionName;
            for (let key in session)
            {
                if (session[key] instanceof Object)
                {
                    this._sessionObjects[key].loadFromJSON(session[key]);
                }
                
            }
            SessionManager.notify('sessionloaded', true);
        }
        finally
        {
            this._loading = false;
        }
    }

    async getServerSession(sessionId)
    {
        let loadSessionWithId = function (sessionId)
        {
            return $.ajax('/loadsession/',
                {
                    method: 'POST',
                    processData: false,
                    context: this,
                    data: JSON.stringify({ sessionId: sessionId }),
                    success: function (data, textStatus, jqXHR)
                    {
                        //Success message
                        if (data)
                        {
                            return data;
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown)
                    {
                        throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                    },
                    complete: function (jqXHR, textStatus) { }
                });
        }.bind(this);



        if (sessionId)
        {
            this._currentSessionName = sessionId;
            return await loadSessionWithId(sessionId);
        }
        else
        {
            let lastId = await $.ajax('/getlastsessionid/',
                {
                    method: 'POST',
                    processData: false,
                    data: undefined,
                    context: this,
                    success: function (sessionId, textStatus, jqXHR)
                    {
                        //Success message
                        return sessionId;
                    },
                    error: function (jqXHR, textStatus, errorThrown)
                    {
                        throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                    },
                    complete: function (jqXHR, textStatus) { }
                });

            try
            {
                if (lastId)
                {
                    this._currentSessionName = lastId;
                    return loadSessionWithId(lastId);
                }
                else
                {
                    return loadSessionWithId();
                }
            } catch (error)
            {
                throw new Error(`error: ${error}`);
            }
        }
    }
}

/**
* Triggered when a non-empty session is loaded from the backend.
* @event module:SessionManager~SessionManager.sessionloaded
* @type {boolean} - True if a non-empty session was loaded. False otherwise.
*/

/**
* Triggered when a successful call to savesession is completed
* @event module:SessionManager~SessionManager.sessionsaved
*/

if (!SessionManager.init)
{
    SessionManager.init = true;
    SessionManager.registerEventNames([
        'sessionloaded',
        'sessionsaved'
    ]);
}