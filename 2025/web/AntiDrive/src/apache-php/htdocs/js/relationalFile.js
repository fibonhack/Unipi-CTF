import { Gui } from "./framework/gui.js";
import { requests } from "./framework/requests.js";

export class RelationalFile extends Gui {
    eventCallbacks = {};
    static defaultDoubleClick = undefined;

    /**
     * Represents a file or directory in the relational file system.
     * @param {string} name - The name of the file or directory.
     * @param {string} id_father - The ID of the parent directory.
     * @param {string} id - The ID of the file or directory (optional).
     */
    constructor(name, id_father, id = '') {
        super();

        this.tag = document.createElement("div");

        this.tag.className = "f"
        this.tag.innerText = name;
        this.tag.id = id + '-' + id_father + '-' + name;

        if (RelationalFile.defaultDoubleClick)
            this.addEventListener(
                "doubleclick",
                RelationalFile.defaultDoubleClick
            );

        this.addEventListener("contextmenu", e => {
            e.preventDefault();

            Gui.dropMenu.insert([
                Gui.addBtn("remove", this.remove.bind(this)),
                Gui.addBtn("download",
                    this.download.bind(this)
                )
            ]);
        });
    }

    /**
     * Creates a RelationalFile instance from a DOM tag.
     * @param {HTMLElement} tag - The DOM element representing the file or directory.
     * @returns {RelationalFile} The created RelationalFile instance.
     */
    static fromTag(tag) {
        console.log(tag.innerText, tag.id);
        return new RelationalFile(
            tag.innerText,
            tag.id.split('-')[0],
            tag.id.split('-')[1]
        );
    }

    // feature methods

    /**
     * Uploads a file to the current working directory.
     * @param {string} cwd - The current working directory.
     */
    static upload(cwd) {
        const input = document.createElement('input');

        input.type = 'file';
        input.accept = 'text/*';

        Gui.dropMenu.close();

        input.addEventListener("change", async (e) => {
            for (let file of e.target.files) {
                if (!file) return;

                const kwargs = {
                    action: 'touch',
                    data: {
                        file: file,
                        cartella: cwd
                    },
                    error_handlings: {
                        '400': () => Gui.notify("File not acceptable, it already exists or it is too big"),
                        '422': () => Gui.notify("The element is not a text file"),
                    }
                };

                try {
                    const response = await requests(kwargs);

                    if (response.ok)
                        Gui.desktop.appendChild(
                            new RelationalFile(file.name, cwd).tag
                        );
                } catch (error) {
                    console.error('Errore durante l\'upload:', error);
                }
            }
        });

        input.click();
    }

    /**
     * Downloads the file associated with this instance.
     */
    async download() {
        Gui.dropMenu.close();

        let kwargs = {
            action: 'download',
            data: {
                name: this.getName(),
                father: this.getFather()
            },
            error_handlings: {
                '404': () => Gui.notify("File not found"),
            }
        }

        let response;
        try {
            response = await (await requests(kwargs)).text();
        } catch (error) {
            console.error("Error downloading file:", error.message);
        }

        const blob = new Blob([response], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        window.location.href = url;
    }

    /**
     * Removes the file or directory associated with this instance.
     */
    async remove() {
        Gui.dropMenu.close();

        const kwargs = {
            action: 'rm',
            data: {
                name: this.getName(),
                cartella: this.getFather()
            }
        };

        try {
            const response = await requests(kwargs);
            if (response.ok) {
                Gui.desktop.removeChild(this.tag);
            }
        } catch (error) {
            console.error("Error removing file:", error.message);
        }
    }

    // ===========  getter methods =============

    /**
     * Gets the ID of the file or directory.
     * @returns {string} The ID of the file or directory.
     */
    getId() {
        return this.tag.id.split('-')[0];
    }

    /**
     * Gets the ID of the parent directory.
     * @returns {string} The ID of the parent directory.
     */
    getFather() {
        return this.tag.id.split('-')[1];
    }

    /**
     * Gets the name of the file or directory.
     * @returns {string} The name of the file or directory.
     */
    getName() {
        return this.tag.innerText;
    }

    // ===========  setter methods =============

    /**
     * Sets the ID of the file or directory.
     * @param {string} id - The new ID.
     */
    setId(id) {
        this.tag.id = id + '-' + this.getFather();
    }

    /**
     * Sets the ID of the parent directory.
     * @param {string} id - The new parent ID.
     */
    setFather(id) {
        this.tag.id = this.getId() + '-' + id;
    }

    /**
     * Sets the name of the file or directory.
     * @param {string} name - The new name.
     */
    setName(name) {
        this.tag.innerText = name;
        this.tag.id = this.getId() + '-' + this.getFather() + '-' + name;
    }

    /**
     * Adds an event listener to the file or directory.
     * @param {string} type - The type of event (e.g., 'click', 'contextmenu').
     * @param {Function} callback - The callback function for the event.
     */
    addEventListener(type, callback) {
        if (type == "doubleclick") {
            this.tag.addEventListener("click", (e) => {
                if (this.clickCounter == 1)
                    callback(e);

                this.clickCounter = (this.clickCounter + 1) % 2;
            });
            return;
        }

        this.tag.addEventListener(type, callback);
    }
}
