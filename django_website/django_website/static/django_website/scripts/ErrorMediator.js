/**
* The ErrorMediator class is responsible for centering
* error messages issued by any component and also for
* routing these messages to subscribed components.
* @module "ErrorMediator.js"
*/

class ErrorMediator {
    constructor() { throw new Error("ErrorMediator should not be instantiated.");}

    static subscribe(listener) {
        if (typeof (listener) !== "object"
            || typeof (listener.get_error) !== "function") {
            throw new Error("The listener should be an object with a get_error(error_message) function.");
        }

        if (ErrorMediator._error_subscribers.indexOf(listener) > -1) {
            console.trace("Listener already subscribed. Ignoring.");
            return;
        }

        ErrorMediator._error_subscribers.push(listener);
    }

    static notify(error_message) {
        for (let i in ErrorMediator._error_subscribers)
        {
            let subscriber = ErrorMediator._error_subscribers[i];
            subscriber.get_error(error_message);
        }
    }
}


if (!ErrorMediator.init) {
    Object.defineProperties(ErrorMediator,
        {
            'init': { value: true, writable: false },
            '_error_subscribers': { value: [], writable: false },
        });
}