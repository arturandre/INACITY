/**
 * Observer module contains classes used to implement the Observer Pattern
 * and allow the creation of events and eventHandlers
 * @module Observer
 */

/**
* This class keeps a list of _observers and dispatch (notify) them about
* some event with some parameters
* @param {string[]} eventNames - All the event names this class dispatches
*/
class Subject {

    constructor()
    {
        //this._eventNames = eventNames;
        //this._observers = {};
    }

    static registerEventNames(eventNames)
    {
        this._eventNames = eventNames;
    }

    /**
    * Listens for an event named "eventName"
    * @param {string} eventName - The event name
    * @param {function} listener - The listener function
    * @param {object} opt_this - The object to use as this in listener
    */
    static on(eventName, listener, opt_this)
    {
        if (this._eventNames.indexOf(eventName) < 0)
        {
            throw Error("Event name not registered.");
        }
        if (typeof listener !== 'function')
        {
            throw Error("Listener should be a function.");
        }
        if (!this._observers[eventName]) this._observers[eventName] = [];
        this._observers[eventName].push({listener: listener, opt_this: opt_this});
    }

    static notify(eventName, data) {
        for (const listenerIdx in this._observers[eventName])
        {
            let listenerRecord = this._observers[eventName][listenerIdx];
            if (listenerRecord.opt_this)
            {
                (listenerRecord.listener.bind(listenerRecord.opt_this))(data);
            }
            else
            {
                listenerRecord.listener(data);
            }
        }
    }
}

Subject._eventNames = [];
Subject._observers = {};