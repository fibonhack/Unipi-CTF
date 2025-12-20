
async function loadPosts() {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    const container = document.getElementById('posts-container');
    container.innerHTML = ''; 

    if (posts.length === 0) {
        container.innerHTML = '<p>Non ci sono ancora post. Scrivine uno!</p>';
    }

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        
        if (post.user === 'Admin') { 
            postDiv.classList.add('admin');
        }

      
        const userHeader = document.createElement('h3');
        const postParagraph = document.createElement('p');

        userHeader.textContent = post.user;
        postParagraph.textContent = post.text;

      
        postDiv.appendChild(userHeader);
        postDiv.appendChild(postParagraph);

        container.appendChild(postDiv);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    if (document.cookie.includes('session=')) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('logout-link').style.display = 'block';
        document.getElementById('create-post-form').style.display = 'block'; 
    }

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userField = document.getElementById('auth-user');
    const passField = document.getElementById('auth-pass');
    const authMessageField = document.getElementById('auth-message');

    
    registerBtn.addEventListener('click', async () => {
        const username = userField.value;
        const password = passField.value;
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        authMessageField.textContent = data.message;
        if(response.ok) {
            authMessageField.style.color = 'green';
        } else {
            authMessageField.style.color = 'red';
        }
    });

    loginBtn.addEventListener('click', async () => {
        const username = userField.value;
        const password = passField.value;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            authMessageField.textContent = "Login riuscito! Ricarico...";
            authMessageField.style.color = 'green';
            setTimeout(() => location.reload(), 1000); 
        } else {
            const data = await response.json();
            authMessageField.textContent = data.message;
            authMessageField.style.color = 'red';
        }
    });

    const submitPostBtn = document.getElementById('submit-post-btn');
    const postTextArea = document.getElementById('post-text');
    const postMessage = document.getElementById('post-message');

    submitPostBtn.addEventListener('click', async () => {
        const text = postTextArea.value;
        
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        postMessage.textContent = '';
        if (response.ok) {
            postMessage.style.color = 'green';
            postMessage.textContent = 'Post pubblicato!';
            postTextArea.value = ''; 
            await loadPosts(); 
        } else {
            const data = await response.json();
            postMessage.style.color = 'red';
            postMessage.textContent = `Errore: ${data.message}`;
        }
      
        setTimeout(() => { postMessage.textContent = ''; }, 3000);
    });
});



/*
Vecchia funzione di login per test
function getDebugToken(user, role) {
    if (user === "admin" && role === "admin") {
        const token = "user=admin&role=admin";
        console.log("Token Admin (Base64):", btoa(token));
        return btoa(token);
    } else {
        return btoa("user=" + user + "&role=guest");
    }
}
*/