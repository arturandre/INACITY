class GSVCollectorWebSocket
{
    constructor(collectorEndpoint, browser_session)
    {
        this.wsurl = 'ws://' + window.location.host
            + ':' + daphne_port
            + '/ws'
            + '/' + collectorEndpoint
            + '/' + browser_session
            + '/';
        this.socket = new WebSocket(this.wsurl);

        this.socket.onmessage = this._onmessage.bind(this);
        this.socket.onopen = this._onopen.bind(this);
        this.socket.onerror = this._onerror.bind(this);
        GSVCollectorWebSocket.registerFunction("checkAlive", this._checkAlive);
    }

    sendMessage(message, type, extraParams)
    {
        let objMessage = {
            'message': message
        };
        if (type)
        {
            objMessage['type'] = type;
        }
        this.socket.send(JSON.stringify(objMessage));
    }

    _checkAlive()
    {
        return true;
    }
    
    // Handle any errors that occur.
    _onerror(error)
    {
        if (this.onerrorhandler) this.onerrorhandler(error);
    };

    _onopen(e)
    {
        this.socket.send(JSON.stringify({
            'message': 'socket opened!'
        }));
        if (this.onopenhandler) this.onopenhandler(e);
    }

    async _onmessage(e)
    {
        let data = JSON.parse(e.data);
        let message = data['message'];
        if (typeof (message) !== "string")
        {
            return;
        }
        if (message.startsWith("func:"))
        {
            message = message.replace("func:", "");

            let array_regex = /\[[^\]]+\]/g

            let arrays = [...message.matchAll(array_regex)];

            message = message.replace(array_regex, '[]');

            message = message.split(",");

            /** 
             * Retrieves and remove array 1st item which corresponds
             * to the function name
            */
            let funcName = message.shift(); 

            let params = message;
            for (let i = 0; i < params.length; i++)
            {
                if (params[i] === '[]')
                {
                    params[i] = JSON.parse(arrays.shift()[0]);
                }
                else
                {
                    try {
                        params[i] = JSON.parse(params[i]);
                    } catch {
                        params[i] = params[i];
                    }
                }
            }

            let fn = GSVCollectorWebSocket.registeredFunctions[funcName];
            let ret = "";

            if (typeof fn === "function")
            {
                if (fn.constructor.name === "AsyncFunction")
                {
                    ret = await fn(...params);
                }
                else
                {
                    ret = fn(...params);
                    if (ret instanceof Promise)
                    {
                        try {
                            ret = await ret;
                        } catch (error)
                        {
                            console.error(error);
                            ret = "ERROR";
                        }
                        
                        
                    }
                }
            }
            else
            {
                ret = "Error: function not found!"
            }

            if (data['type'] === 'request_message')
            {
                this.socket.send(JSON.stringify({
                    'type': 'fulfill_request',
                    'request_id': data['request_id'],
                    'message': ret
                }));
            }
            else
            {
                this.socket.send(JSON.stringify({
                    'message': ret
                }));
            }
        }
        if (this.onmessagehandler) this.onmessagehandler(message);
    }

    /**
     * 
     * @param {String} functionName - Function reference name used externally
     * @param {AsyncFunction|function} functionHandler - Function to be called
     */
    static registerFunction(functionName, functionHandler)
    {
        if (!GSVCollectorWebSocket.registeredFunctions)
        {
            GSVCollectorWebSocket.registeredFunctions = {};
        }
        GSVCollectorWebSocket.registeredFunctions[functionName] = functionHandler;
    }


}


if (!GSVCollectorWebSocket.init)
{
    GSVCollectorWebSocket.init = true;
    GSVCollectorWebSocket.registerFunction("crawlNodes", GSVService.crawlNodes);
    GSVCollectorWebSocket.registerFunction("getPanoramaByLocation", GSVService.getPanoramaByLocation);
}