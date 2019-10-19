class GSVCollectorWebSocket
{
    constructor(collectorEndpoint, browser_session)
    {
        this.wsurl = 'ws://' + window.location.host
            + ':8001' //daphne port
            + '/ws'
            + '/' + collectorEndpoint
            + '/' + browser_session
            + '/';
        this.socket = new WebSocket(this.wsurl);

        this.socket.onmessage = this._onmessage.bind(this);
        this.socket.onopen = this._onopen.bind(this);
        this.socket.onerror = this._onerror.bind(this);
    }

    sendMessage(message)
    {
        this.socket.send(JSON.stringify({
            'message': message
        }));
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
            message = message.replace("func:", "").split(",");
            let funcName = message.shift(); //Retrieves and remove array 1st item
            let params = message;

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
                }
            }
            else
            {
                ret = "Error: function not found!"
            }

            this.socket.send(JSON.stringify({
                'message': ret
            }));
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
}