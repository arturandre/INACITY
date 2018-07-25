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
        //this._eventNames = [];
        //this._observers = new Object();
    }

    /**
     * Register at class level the eventNames that the subclass can dispatch events for
     * and creates, also at class level, a dictionary of observers.
     * @param {string[]} eventNames - The names of the events the subclass will dispatch.
     */
    static registerEventNames(eventNames)
    {
        /* this is the subclass */
        this._eventNames = eventNames;
        this._observers = {};
    }

    /**
    * Listens for an event named "eventName"
    * @param {string} eventName - The event name
    * @param {function} listener - The listener function
    * @param {object} opt_this - The object to use as this in listener
    */
    static on(eventName, listener)
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
        this._observers[eventName].push({listener: listener});
    }

    static notify(eventName, data) {
        for (let listenerIdx in this._observers[eventName])
        {
            let listenerRecord = this._observers[eventName][listenerIdx];
            listenerRecord.listener(data);
            //if (listenerRecord.opt_this)
            //{
            //    (listenerRecord.listener.bind(listenerRecord.opt_this))(data);
            //}
            //else
            //{
            //    listenerRecord.listener(data);
            //}
        }
    }
}

//Subject._eventNames = [];
//Subject._observers = {};