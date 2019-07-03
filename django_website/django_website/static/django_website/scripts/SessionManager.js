/**
 * SessionManager module contains classes responsible for storing
 * and retrieving session data from an anonymous (not logged) user
 * and also from an named (logged) user.
 * @module SessionManager
 */

class SessionManager
{
    constructor(sessionObjects)
    {
        this._sessionObjects = sessionObjects;
        this._loading = false;
        // this._uiModel = uiModel;
        // this._geoImageManager = geoImageManager;
        // this._openLayersHandler = openLayersHandler;


        /*OpenLayers Event Handlers*/
        // this._openLayersHandler.globalVectorSource.on('addfeature', this.olFeatureChangedHandler, this);
        // this._openLayersHandler.globalVectorSource.on('removefeature', this.olFeatureChangedHandler, this);
        // this._openLayersHandler.globalVectorSource.on('changefeature', this.olFeatureChangedHandler, this);
        UIModel.on('featuresmerged', () => this.saveSession());
        UIModel.on('regioncreated', () => this.saveSession());
        UIModel.on('regiondeleted', () => this.saveSession());
        UIModel.on('regionlistitemclick', () => this.saveSession());
        UIModel.on('getimages', () => this.saveSession());
        GeoImageManager.on('geoimagecollectionchange', () => this.saveSession());
        Layer.on('featurecollectionchange', () => this.saveSession());
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
        // if (!sessionName)
        // {
        //     throw new Error(gettext("SessionName should not be null!"));
        // }
        this._currentSessionName = sessionName;

        //let openLayersFeatures = {}; /*OpenLayers features for drawing*/
        //for (let regionId in this.regions)
        //{
        //let olFeature = this._openLayersHandler.globalVectorSource.getFeatureById(regionId);
        //let geoJsonFeatures = olGeoJson.writeFeaturesObject([olFeature]);
        //openLayersFeatures[regionId] = geoJsonFeatures;
        //regions[regionId] = this.regions[regionId].saveToJSON();
        //}

        let session = {};
        session.sessionName = sessionName;
        for (let key in this._sessionObjects)
        {
            session[key] = this._sessionObjects[key].saveToJSON();
        }
        // session.uiModelJSON = this._uiModel.saveToJSON(sessionName);
        // session.geoImageManagerJSON = this._geoImageManager.saveToJSON();


        return await $.ajax('/savesession/',
            {
                method: 'POST',
                processData: false,
                data: JSON.stringify(session),
                contentType: "application/json; charset=utf-8",
                context: this,
                dataType: 'text',
                success: function (userSessionId, textStatus, jqXHR)
                {
                    //Success message
                    //data -> sessionId
                    if (!this._currentSessionName) this._currentSessionName = userSessionId;
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                }
            });
    }

    async newSession()
    {
        return await $.ajax('newsession/',
            {
                method: 'POST',
                processData: false,
                data: undefined,
                context: this,
                success: function (data, textStatus, jqXHR)
                {
                    //Success message
                    this.clear();
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                },
                complete: function (jqXHR, textStatus) { }
            });
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
                    this.clear();
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                },
                complete: function (jqXHR, textStatus) { }
            });

    }

    clear()
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
            for (let key in this._sessionObjects)
            {
                this._sessionObjects[key].loadFromJSON(session[key]);
            }
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