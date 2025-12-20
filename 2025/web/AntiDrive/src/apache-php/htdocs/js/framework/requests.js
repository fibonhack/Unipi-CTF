"use strict";

/**
 * Sends an asynchronous HTTP POST request to the server using the provided parameters.
 *
 * @param {Object} kwargs - The parameters for the request.
 * @param {string} kwargs.action - The action to be performed, appended to the request body.
 * @param {Object} [kwargs.data] - An optional object containing key-value pairs to be sent as additional data.
 * @param {Object} [kwargs.error_handlings] - An optional object where keys are error codes (or substrings of error messages)
 *                                            and values are callback functions to handle specific errors.
 * @param {Object} [kwargs.response] - An optional object to store the response if the request is successful.
 *
 * @throws {Error} Throws an error if the HTTP response is not OK or if an unexpected error occurs.
 *
 * @example
 * const kwargs = {
 *   action: 'login',
 *   data: { username: 'user', password: 'pass' },
 *   error_handlings: {
 *     '401': () => console.error('Unauthorized access'),
 *     '500': () => console.error('Server error')
 *   },
 *   response: {}
 * };
 * 
 * requests(kwargs);
 */

export async function requests(kwargs) {  // action, data, error_handlers, collables
    
    if (!kwargs.action)
        throw Error("Missing action parameter");

    const formData = new FormData();
    formData.append('action', kwargs.action);

    if (kwargs.data) for (const [key, value] of Object.entries(kwargs.data))
        formData.append(key, value);

    try{
        const response = await fetch("php/api.php", {
            method: 'POST',
            body: formData
        });

        if (response.ok)
            return response;

        else {
            throw Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }
    }
    catch (error){
        if (kwargs.error_handlings)
            for (const [code, callable] of Object.entries(kwargs.error_handlings))
                if (error.message && error.message.includes(code)){
                    callable();
                    return {ok : false};
                }
        
        throw Error(`Errore durante la richiesta di ${kwargs.action} error_message: ${error.message}`);
    }
}

/*

errors: 
 - action not passed
 - user not logged in

 - errors of "ACCOUNT" action:
   - username and password not passed 
    

*/