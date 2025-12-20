import { Gui } from "./framework/gui.js"

/**
 * LoginManager class handles the creation and management of a login form,
 * including validation and session checking.
 */
export class LoginManager extends Gui {
    callbacks = {
        "onlogin" : [],
        "onlogout": []
    }

    /**
     * Constructor for the LoginManager class.
     * @param {Function} backend - The backend function for handling requests.
     */
    constructor(backend) {
        super();

        this.backend = backend

        // elements
        this.logoutBtn = Gui.addBtn("log-out", async () => {

            await this.backend({action : "logout"});

            this.isLogged();
       });

       this.deleteBtn = Gui.addBtn("delete-account", async () => {
            Gui.popup.insert([
                Gui.addBtn("exit", () => {Gui.popup.clear(); Gui.popup.close();}),
                Gui.addBtn("confirm", () => {
                    this.backend({action : "delete-account"});
                    this.isLogged();
                })
            ]);
            Gui.popup.open(true);
       })

        this.form      = this.#addForm();
        this.nav       = this.#addNav();
    }

    /**
     * Adds navigation buttons for login and signup.
     * @returns {HTMLElement} The navigation container element.
     */
    #addNav(){
        let nav = document.createElement("div");
        nav.id  = "login-nav";

        nav.appendChild(
            Gui.addBtn("log-in",
                e => {
                    document.getElementById("sign-up")
                        .removeAttribute("disabled");

                    e.target.setAttribute("disabled", "");

                    document.getElementById("confirm-container")
                        .innerHTML = "";
                },
                {disabled : true}

            )
        )

        nav.appendChild(
            Gui.addBtn("sign-up",
                e => {
                    document.getElementById("log-in")
                        .removeAttribute("disabled");

                    e.target.setAttribute("disabled", "");

                    let container = document.getElementById("confirm-container");
                    container.appendChild(this.confirm.label);
                    container.appendChild(this.confirm.tag);
                    container.appendChild(this.confirm.btn);
                }
            )
        )
        return nav;

    }

    /**
     * Adds the login form with validation and event listeners.
     * @returns {HTMLFormElement} The login form element.
     */
    #addForm(){
        let form = document.createElement("form");
        form.addEventListener("submit", e => e.preventDefault());
        form.id = "login-form";

        let validity_logger = (input, checkValidity, error_msg) => {
            let ret = checkValidity(input);
            if (!ret){
                Gui.popup.log(error_msg)
            }
            return ret;
        }

        let default_check = (input) => input.validity.valid;
        let user_msg = `* The username can have only uppercase, lowercase latin characters, digits an dashes(-).
            * The username must have more then 3 characters and less then 64 characters`

        let username = Gui.addInput({
            id : "username",
            pattern : "[A-Za-z\\d\\-]{3,64}",
            changeListner: e =>{ validity_logger(e.target, default_check, user_msg)}
        });

        let pswd_msg = `* The password must at least have one lowercase character, one uppercase character, one digit and one special character
            * The special characters availible are: @$!%*?&
            * The length? It must be between 8 and 64 characters`;

        let password = Gui.addInput({
                id : "password",
                pattern : "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*.?&])[A-Za-z\\d@$.!%*?&]{8,64}$",
                is_password : true,
                changeListner: e => {validity_logger(e.target,  default_check, pswd_msg)}
            }
        );

        let check_msg = "* The confirm password and password don't match";
        let confirm_check = (input) => {
            let ret =  (input.value == document.getElementById("password").value);

            if (!ret)
                input.setCustomValidity("Invalid field.");
            else
                input.setCustomValidity("");

            return ret;
        };

        this.confirm = Gui.addInput({
                id : "confirm-password",
                is_password : true,
                changeListner: e => {validity_logger(e.target, confirm_check, check_msg)}
            }
        );

        let submit = Gui.addBtn("submit", () => this.sendInputs(),
            { disabled : true}
        );

        let submit_check = (e) => {
            let submit = Gui.popup.popupDiv.querySelector("#submit");

            let check = false;
            for (const input of document.getElementsByTagName("input")){
                if (input.id != "confirm-password")
                    check = validity_logger(
                        input,
                        default_check,
                        (input.id == "username") ? user_msg : pswd_msg
                    );
                else
                    check = validity_logger(
                        input,
                        confirm_check,
                        check_msg
                    );
            }

            if (!check){
                submit.setAttribute("disabled", "");
            }
            else{
                Gui.popup.clear();
                submit.removeAttribute("disabled");
            }
        };

        for (let input of [username.tag, password.tag, this.confirm.tag])
            input.addEventListener("input", submit_check);

        username.render(form);
        password.render(form);

        let confirm_container = document.createElement("div");
        confirm_container.id = "confirm-container";
        form.appendChild(confirm_container);

        form.appendChild(submit);

        return form;
    }

    // ================= EVENT FUNCTIONS =================

    /**
     * Adds a callback function to be executed on successful login.
     * @param {Function} callback - The callback function.
     */
    addEventListener(type, callback){
        if (this.callbacks[type])
            this.callbacks[type].push(callback);
    }

    /**
     * Checks if the user is logged in.
     * @returns {Promise<boolean>} True if the user is logged in, false otherwise.
     */
    async isLogged(loggouted){
        let kwargs = {
            action: 'is_logged',
            error_handlings: {
                '401': () => { // non è loggato
                    for (let callback of this.callbacks["onlogout"])
                        callback();

                    Gui.popup.insert([this.nav, this.form]);
                    Gui.popup.open();
            }}
        }

        let res = await this.backend(kwargs);

        if (res.ok){

            let text = await res.text();
            for (let callback of this.callbacks["onlogin"])
                await callback(text);

            return true;
        }

        return false;
    }

    // =========== EVENT FUNCTIONS ===========


    /**
     * Sends the login or signup inputs to the backend.
     * @param {boolean} logouted - Whether the user is logged out.
     * @param {CallableFunction} on_internal_login - a function to call when the user is logged in
     */
    async sendInputs(logouted) {

        let user = this.form.querySelector("#username").value;
        let pass = this.form.querySelector("#password").value;

        let action, data;
        if (this.form.querySelector("#confirm-password")){

            action = "signup";
            data = {
                username: user,
                password: pass,
                confirm_password: this.confirm.tag.value
            }
        }
        else{
            action = "login";
            data = { username: user, password: pass };
        }

        const kwargs = {
          action: action,
          data: data,
          error_handlings: {
            '409': () => Gui.popup.log("User already exist"),
            '404': () => Gui.popup.log("Account not signed up"),
            '401': () => Gui.popup.log("Wrong Password")
          }
        };

        let res = await this.backend(kwargs)

        if (res.ok){
            Gui.popup.clear();
            Gui.popup.close();

            for (let callback of this.callbacks["onlogin"])
                callback(user, logouted);
        }
    }


}