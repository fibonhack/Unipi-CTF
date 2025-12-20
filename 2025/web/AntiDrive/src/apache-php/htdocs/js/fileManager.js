import { Gui } from "./framework/gui.js";
import { requests } from "./framework/requests.js";
import { RelationalFile } from "./relationalFile.js";

/**
 * FileManager class handles the creation, management, and synchronization
 * of files and folders in the user interface. It interacts with the LoginManager
 * to ensure the user is authenticated before accessing file operations.
 */
export class FileManager extends Gui {
    cwd = null;
    ls = [];

    /**
     * Constructor for the FileManager class.
     */
    constructor() {
        super();

        this.syncBtn = Gui.addBtn("refresh", this.syncArchive.bind(this));
        this.syncBtn.textContent = "";

        document.addEventListener("contextmenu", e => {
            e.preventDefault();

            Gui.dropMenu.insert([
                Gui.addBtn("upload-file", () => RelationalFile.upload(this.cwd))
            ]);

            Gui.dropMenu.open(e.clientX, e.clientY);
        });

        // RelationalFile.defaultDoubleClick = (e) => {
        //     RelationalFile.fromTag(e.target).download();
        // };
    }

    destroy(){
        this.cwd = null;
        this.ls = [];
        Gui.desktop.innerHTML = "";
        for (let elem of Gui.pwd.childNodes) if (elem.id != "refresh")
            Gui.pwd.removeChild(elem);
    }

    // ============= EVENT METHODS ==============

    /**
     * Synchronizes the current working directory path in the GUI.
     * @param {string} name - The name of the current directory.
     */
    async syncPwd(name) {

        let pwdContainer = document.getElementById("pwd");
        let root_dir = document.createElement("div");

        if (!this.cwd)
            this.cwd = await (await this.getRootId()).text();

        root_dir.id = this.cwd;
        root_dir.innerText = name;

        pwdContainer.innerHTML = "";
        pwdContainer.appendChild(
            root_dir
        );
    }

    /**
     * Synchronizes the archive view in the GUI.
     * @param {string} name - The name of the current directory.
     * @param {boolean} loggedout - Whether the user is logged out.
     */
    async syncArchive(name) {
        try {
            Gui.desktop.innerHTML = "";

            const kwargs = {
                action: 'ls',
                data: {
                    father: this.cwd
                }
            };

            const response = await requests(kwargs);
            const text = await response.text();
            let lines = text.split('\n');
            if (this.cwd == null)
                this.cwd = lines[0];

            lines = lines.filter(val => val.indexOf('|') > -1);

            this.parseAPI(lines);
        } catch (error) {
            console.error("Error fetching archive:", error.message);
        }
    }

    // ============= UTILITY METHODS ========

    /**
     * Gets the ID of the root directory.
     * @returns {Promise<Response>} The response containing the root ID.
     */
    getRootId() {
        const kwargs = {
            action: 'getRootId'
        };

        return requests(kwargs);
    }
    
    /**
     * Refreshes the archive view with the given list of names.
     * @param {Array<string>} names - The list of names to refresh the archive with.
     */
    parseAPI(names){
        
        let elems = [...Gui.desktop.querySelectorAll('.f'), ...Gui.desktop.querySelectorAll('.d')];
        let list_server = names.map(val => ({
            name: val.split('|')[0],
            type: val.split('|')[1],
            id: val.split('|')[2]
        }));
        let list_client = [];

        for (let c of elems) {
            if (!list_server.includes(c.innerText)) {
                Gui.desktop.removeChild(c);
                continue;
            }
            list_client.push(c);
        }

        list_server = list_server.filter(val => !list_client.includes(val.name));

        for (let f of list_server) {
            let file = new RelationalFile(f.name, this.cwd, f.id);

            this.ls.push(file);
            Gui.desktop.appendChild(file.tag);
        }
    }

}