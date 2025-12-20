const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const SECRET = process.env["secret"] || "secret";

const allPosts = [
    { id: 1, user: "Alice", text: "Che bella giornata oggi!" },
    { id: 2, user: "Bob", text: "Qualcuno ha visto il mio gatto?" },
    { id: 3, user: "Admin", text: "Post privato. La flag è: " + process.env["FLAG"] }
];

const usersDB = {};

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username e password richiesti" });
    }
    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Username o password invalidi" });
    }
    if (username.length < 8 || password.length < 8) {
        return res.status(400).json({ message: "Password o username troppo corti" });
    }
    if (usersDB[username]) {
        return res.status(409).json({ message: "Username già esistente" });
    }
    usersDB[username] = password;
    console.log("Nuovo utente registrato:", username);
    res.status(201).json({ message: "Registrazione completata! Ora puoi fare il login." });
});

app.post('/api/login', (req, res) => {

    const { username, password } = req.body;

    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Username o password invalidi" });
    }

    if (usersDB[username] && usersDB[username] === password) {
        const tokenPayload = `user=${username}&role=guest`;

        /* Sign token */
        const signature = crypto.createHash("sha256").update(`${SECRET}.${tokenPayload}`).digest("hex");
        const token = `${tokenPayload}.${signature}`;

        const guestCookie = Buffer.from(token).toString('base64');

        res.cookie('session', guestCookie, { 
            httpOnly: false,
            maxAge: 3600000 
        }); 
        res.json({ message: "Login effettuato!" });
    } else {
        res.status(401).json({ message: "Credenziali non valide" });
    }
});


app.get('/api/logout', (req, res) => {
    res.clearCookie('session');
    res.redirect('/');
});

const checkCookie = (raw) => {
    const pieces = Buffer.from(raw, 'base64').toString('ascii').split(".");

    if (pieces.length !== 2){
        return null;
    }

    const tokenPayload = pieces[0];
    const signature = pieces[1];

    // Check signature
    if(crypto.createHash("sha256").update(`${SECRET}.${tokenPayload}`).digest("hex") !== signature){
        return null;
    }

    return tokenPayload;
}

app.post('/api/posts', (req, res) => {
    const { text } = req.body;
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
        return res.status(401).json({ message: "Devi essere loggato per postare" });
    }

    if (!text || typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({ message: "Il post non può essere vuoto" });
    }

    try {
        const decodedCookie = checkCookie(sessionCookie);
        if(!decodedCookie){
            return res.status(401).json({ message: "Cookie non valido" });
        }

        const username = decodedCookie.split('&')[0].split('=')[1];
        const newPost = {
            id: allPosts.length + 1,
            user: username,
            text: text
        };
        allPosts.push(newPost);
        console.log(`Nuovo post da ${username}: ${text}`);
        res.status(201).json(newPost); 
    } catch (e) {
        res.status(401).json({ message: "Cookie non valido" });
    }
});


app.get('/api/posts', (req, res) => {
    let isAdmin = false;
    const sessionCookie = req.cookies.session;

    if (sessionCookie) {
        try {
            const decodedCookie = checkCookie(sessionCookie);
            if(!decodedCookie){
                return res.status(401).json({ message: "Cookie non valido" });
            }

            let role = decodedCookie.split("&")
                .map(x => x.split("="))
                .filter(x => { return x[0] === "role"});

            if (role[0][1] === "admin") {
                isAdmin = true;
            }
        } catch (e) {
            console.log("Cookie non valido:", e.message);
        }
    }

    if (isAdmin) {
        res.json(allPosts);
    } else {
        const publicPosts = allPosts.filter(p => p.user !== 'Admin');
        res.json(publicPosts);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Challenge 'social-easy' in ascolto su http://localhost:${PORT}`);
});