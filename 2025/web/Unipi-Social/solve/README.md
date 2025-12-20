# Solve per 'social-easy'

La vulnerabilità è una funzione JavaScript "dimenticata" nel codice sorgente lato client, che permette di generare un cookie di sessione da admin.

1.  **Ispezione:** Aprire il sito e i Developer Tools (F12).
2.  **Sorgenti:** Andare nel tab "Sorgenti" (o "Sources") e trovare il file `app.js`.
3.  **Analisi:** Leggendo `app.js`, si nota una funzione commentata (o non usata) chiamata `getDebugToken(user, role)`.
4.  **Esecuzione:** Andare nel tab "Console".
5.  **Generazione Token:** Eseguire la funzione per generare il token da admin:
    ```javascript
    btoa("user=admin&role=admin")
    ```
6.  **Ottenere il Token:** La console restituirà la stringa Base64: `dXNlcj1hZG1pbiZyb2xlPWFkbWlu`
7.  **Iniezione Cookie:** Andare nel tab "Applicazione" -> Cookies.
8.  Creare un nuovo cookie (o modificare quello esistente) con:
    * Nome: `session`
    * Valore: `dXNlcj1hZG1pbiZyb2xlPWFkbWlu`
9.  **Ricaricare:** Ricaricare la pagina (F5).
10. **Flag:** Il post dell'admin apparirà, contenente la flag: `unipi{j4v4scr1pt_c00ki3_inj3cti0n}`