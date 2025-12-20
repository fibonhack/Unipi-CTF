
/**
 * Popup class provides functionality to create and manage popup windows.
 * It includes methods to open, close, insert content, and log messages.
 */
class Popup {
    /**
     * Constructor initializes the popup and log div elements.
     */
    constructor() {
        this.logDiv = document.createElement("div");
        this.logDiv.id = "logs";

        this.popupDiv = document.createElement("div");
        this.popupDiv.id = "popup";

        this.removable = false;
        this.previousDialog = [];

        this.popupDiv.addEventListener("contextmenu", e => e.stopPropagation());
        this.popupDiv.addEventListener("click", () => (this.removable) ? this.close():null);
        this.keyboardEscape = (e) => (this.removable && e.code == "Escape") ? this.close():null;
    }
    
    /**
     * Opens the popup window.
     * @param {boolean} removable - Whether the popup can be closed by clicking outside or pressing Escape.
     */
    open(removable = false) {
        this.removable = removable;
        document.addEventListener("keydown", this.keyboardEscape.bind(this));
        document.body.appendChild(this.popupDiv);
    }

    /**
     * Inserts content into the popup window.
     * @param {Array<HTMLElement>} tags - The elements to insert into the popup.
     */
    insert(tags) {
        for (let t of tags) {
            this.popupDiv.appendChild(t);
        }
    }

    /**
     * Toggles the visibility of a dialog. If there is no previous dialog stored,
     * it saves the current dialog (if any), clears and closes it, then inserts and opens the new dialog.
     * If a previous dialog exists, it clears and closes the current dialog, restores the previous dialog,
     * and opens it.
     *
     * @param {HTMLElement|Array} newDialog - The new dialog to be displayed. Can be an HTMLElement or an array of elements.
     */
    toggleDialog(newDialog){
        if (this.previousDialog.length == 0){
            
            if (document.getElementById("popup")){
                for (let elem of this.popupDiv.childNodes)
                    this.previousDialog.push(elem);
            }
            else this.previousDialog = [false];

            this.clear();
            this.close();

            this.insert(newDialog);
            this.open();
        }
        else{
            this.clear();
            this.close();

            if (this.previousDialog[0] !== false){
                this.insert(this.previousDialog);
                this.open();
            }

            this.previousDialog = [];
        }
    }

    /**
     * Logs a message in the popup window.
     * @param {string} msg - The message to log.
     */
    log(msg){
        this.logDiv.innerText = msg;
        this.popupDiv.appendChild(this.logDiv);
    }

    /**
     * Clears the log message from the popup window.
     */
    clear(){
        if (document.getElementById("logs"))
            this.popupDiv.removeChild(this.logDiv);
    }

    /**
     * Closes the popup window.
     */
    close() {
        if (!document.getElementById("popup"))
            return;

        this.removable = false;
        document.removeEventListener("keydown", this.keyboardEscape.bind(this));

        this.popupDiv.innerHTML = "";
        document.body.removeChild(this.popupDiv);
    }
}

/**
 * DropDownMenu class provides functionality to create and manage dropdown menus.
 */
class DropDownMenu {
    /**
     * Constructor initializes the dropdown menu tag.
     */
    constructor(){
        this.tag = document.createElement("div");
        this.tag.id = "drop-down-menu";
    }

    /**
     * Opens the dropdown menu at the specified coordinates.
     * @param {number} x - The x-coordinate for the menu.
     * @param {number} y - The y-coordinate for the menu.
     */
    open(x, y){
        
        this.tag.style.left = x + 'px';
        this.tag.style.top  = y + 'px';

        document.body.appendChild(this.tag);

        this.tag.addEventListener("click", e => e.stopPropagation());
        document.body.addEventListener("click", this.close.bind(this));
    }

    /**
     * Inserts content into the dropdown menu.
     * @param {Array<HTMLElement>|HTMLElement} tags - The elements to insert into the menu.
     */
    insert(tags){
        // check if the menu is already open
        if (this.tag.childNodes.length != 0)
            return;

        if (tags instanceof Array){
            for (let t of tags){
                if (t) this.tag.appendChild(t);
            }
        }
        else
            this.tag.appendChild(tags);
    }

    /**
     * Closes the dropdown menu.
     */
    close(){
        if (document.getElementById(this.tag.id))
            document.body.removeChild(this.tag);

        this.tag.innerHTML = "";
    }
}


export class Gui {
    static accountBar     = document.body.querySelector("#accountBar");
    static finestra    = document.body.querySelector("#window");
    static helpDiv     = document.body.querySelector("#help");

    static desktop;
    static pwd;
    static toolBar;

    static DropDownElements = [];

/**
     * Constructor initializes the GUI elements and prevents instantiation of the abstract class.
     */
    constructor() {
        if (this.constructor == Gui) {
            throw Error("Abstract class can't have new instances");
        }

        if (!Gui.pwd) {
            Gui.pwd = document.createElement("div");
            Gui.pwd.id = "pwd";
            Gui.finestra.appendChild(Gui.pwd);
        }

        if (!Gui.toolBar) {
            Gui.toolBar = document.createElement("div");
            Gui.toolBar.id = "toolBar";
            Gui.finestra.append(Gui.toolBar);
        }

        if (!Gui.desktop) {
            Gui.desktop = document.createElement("div");
            Gui.desktop.id = "desktop";
            Gui.finestra.appendChild(Gui.desktop);
        }

        this.clickCounter = 0;
    }

    static popup = new Popup();
    static dropMenu = new DropDownMenu();

    // ========== DRAWING FUNCTIONS ==========

    /**
     * This is a generic function to create a button with the following parameters.
     * 
     * @param {string} label - The innerText of the button
     * @param {string} id - The id of the button
     * @param {Boolean} disabled - if true the button is disabled by default
     * @param {CallableFunction} onclick - The function to run when the event click is triggered
     * @returns The button element to append
     */
    static addBtn(id, onclick, {disabled, hasLabel}={}){

        let btn = document.createElement("button");
        hasLabel = (hasLabel===undefined) ? true : hasLabel;

        if (hasLabel){
            btn.innerText = id.replace("-", " ");
            btn.innerText = btn.innerText.charAt(0) + btn.innerText.slice(1);
        }
        btn.id = id;

        if (disabled)
            btn.setAttribute("disabled", "");

        btn.addEventListener("click", onclick);
        
        return btn;
    }

    /**
     * Creates an input field with optional configurations such as a label, pattern, and password visibility toggle.
     * 
     * @param {Object} kwargs - Configuration options for the input field.
     * @param {string} kwargs.id - The ID of the input element.
     * @param {string} [kwargs.pattern] - A regex pattern for input validation (optional).
     * @param {boolean} [kwargs.is_password=false] - If true, the input type is set to "password".
     * @param {boolean} [kwargs.no_label=false] - If true, no label is created for the input field.
     * @param {boolean} [kwargs.not_required=false] - If true, the input field is not marked as required.
     * @param {Function} [kwargs.inputListner] - A callback function for the "input" event (optional).
     * @param {Function} [kwargs.changeListner] - A callback function for the "change" event (optional).
     * @returns {Object} An object containing the created elements:
     *  - `tag`: The input element.
     *  - `label`: The label element (if `no_label` is false).
     *  - `btn`: A button to toggle password visibility (only if `is_password` is true).
     *  - `render`: A function to append the elements to a parent container.
     */
    static addInput(kwargs){ // id, log_message, {pattern, is_password, checkValidity}={}
        let elem = {
            tag   : document.createElement("input")
        };
        
        if (!kwargs.no_label){
            elem.label = document.createElement("label");

            elem.label.innerText = kwargs.id.replace('-', ' ');
            elem.label.innerText = elem.label.innerText.charAt(0) + elem.label.innerText.slice(1);

            if (kwargs.is_password){
                elem.tag.type = "password";

                let show_pswd = (e) => {
                    (elem.tag.type == "password") ? elem.tag.type = "" : elem.tag.type = "password";
                    e.target.toggleAttribute("show");
                };

                elem.btn = this.addBtn("show-"+kwargs.id, show_pswd, {hasLabel : false});
            }

        }

        if (kwargs.pattern)
            elem.tag.pattern  = kwargs.pattern;

        if (kwargs.id) 
            elem.tag.id = kwargs.id;

        if (!kwargs.not_required) 
            elem.tag.required = true;
        
        if (kwargs.inputListner)
            elem.tag.addEventListener("input", kwargs.inputListner);
            
        if (kwargs.changeListner)
            elem.tag.addEventListener("change", kwargs.changeListner);

        elem.render = (tag) => {
            if (!kwargs.no_label)
                tag.append(elem.label);
            
            tag.appendChild(elem.tag);

            if (kwargs.is_password)
                tag.appendChild(elem.btn);
        };

        return elem;
    }

    // ========== GUI FUNCTIONS ==========

    /**
     * Displays a notification popup with the specified message.
     * @param {string} msg - The message to display.
     */
    static notify(msg){
        this.popup.open(true);
        this.popup.log(msg);
        setTimeout(10000, () => {
            this.popup.clear();
            this.popup.close();
        });
    }

    // ========== ESCAPE FUNCTION ==========

    /**
     * Handles the Escape key or click event to close elements.
     * @param {Object} bind - The object to bind the event listener to.
     * @param {Event} e - The event object.
     */
    static escapeFunction(bind, e){
        if (e.code == "Escape"){

            if (bind.listners){
                for (let f of bind.listners) f();
                bind.listners = undefined;
            }

            document.removeEventListener("keydown", e => Gui.escapeFunction(bind, e))
            document.removeEventListener("click", e => Gui.escapeFunction(bind, e));
            document.removeEventListener("focusout", e => Gui.escapeFunction(bind, e));
        }
    }

    /**
     * Adds an event listener for the Escape key or click event.
     * @param {Object} bind - The object to bind the event listener to.
     * @param {Function} callback - The callback function to execute.
     * @param {boolean} listenClick - If true it's listen the click event.
     * @param {boolean} listenFocus - If true it's listen the focusout event.
     */
    static addEscapeListner(bind, callback, listenClick=false, listenFocus=false){
        if (!bind.listners){
            bind.listners = [];
            document.addEventListener("keydown", e =>  Gui.escapeFunction(bind, e));
            
            if (listenClick)
                document.addEventListener("click", () => {
                    Gui.escapeFunction(bind, {code : "Escape"});
                });

            if (listenFocus)
                document.addEventListener("focusout", e => {
                    e.code = "Escape";
                    Gui.escapeFunction(bind, {code : "Escape"});
                });
        }

        if (bind.listners.includes(callback))
            return;
        
        bind.listners.push(callback);
    }

    /**
     * Removes an event listener for the Escape key or click event.
     * @param {Function} callback - The callback function to remove.
     */
    static removeEscapeListner(callback){
        document.removeEventListener("keydown", callback);
        document.removeEventListener("click", callback);
        document.removeEventListener("focusout", callback);
    }
}
