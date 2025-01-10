// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDidRLWFRYqlXWfacV9Rdn2ErkfFJ9iCgw",
  authDomain: "chat-app-ccc84.firebaseapp.com",
  projectId: "chat-app-ccc84",
  storageBucket: "chat-app-ccc84.firebasestorage.app",
  messagingSenderId: "991015329906",
  appId: "1:991015329906:web:d0bb02133b8de1a52c62eb",
  measurementId: "G-3X6LV0DT7P"
};
// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias de Firestore y autenticación
const db = firebase.firestore();
const auth = firebase.auth();

// Elementos del DOM
const loginButton = document.getElementById('login');
const logoutButton = document.getElementById('logout');
const userIdDisplay = document.getElementById('user-id');
const newIdInput = document.getElementById('new-id');
const changeIdButton = document.getElementById('change-id');
const searchBar = document.getElementById('search-bar');
const searchButton = document.getElementById('search');
const resultsList = document.getElementById('results');
const chatSection = document.getElementById('chat-section');
const chatUserDisplay = document.getElementById('chat-user');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message');

// Estado global
let currentUser = null;
let chatUser = null;

// Autenticación
loginButton.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        alert('Sesión iniciada');
    } catch (error) {
        console.error('Error al iniciar sesión', error);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        alert('Sesión cerrada');
    } catch (error) {
        console.error('Error al cerrar sesión', error);
    }
});

// Cambio de ID
changeIdButton.addEventListener('click', async () => {
    const newId = newIdInput.value.trim();
    if (newId) {
        await db.collection('users').doc(currentUser.uid).update({ id: newId });
        userIdDisplay.textContent = newId;
        alert('ID cambiado con éxito');
    }
});

// Búsqueda de amigos
searchButton.addEventListener('click', async () => {
    const query = searchBar.value.trim();
    if (query) {
        const snapshot = await db.collection('users').where('name', '==', query).get();
        resultsList.innerHTML = '';
        snapshot.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.data().name;
            li.addEventListener('click', () => startChat(doc.id, doc.data().name));
            resultsList.appendChild(li);
        });
    }
});

// Enviar mensaje
sendMessageButton.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (message && chatUser) {
        await db.collection('chats').add({
            from: currentUser.uid,
            to: chatUser.id,
            message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
    }
});

// Función para iniciar chat
function startChat(userId, userName) {
    chatUser = { id: userId, name: userName };
    chatUserDisplay.textContent = userName;
    chatSection.style.display = 'block';
    loadMessages();
}

// Cargar mensajes
function loadMessages() {
    db.collection('chats')
        .where('from', 'in', [currentUser.uid, chatUser.id])
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            snapshot.forEach(doc => {
                const message = doc.data();
                const div = document.createElement('div');
                div.textContent = `${message.from === currentUser.uid ? 'Tú' : chatUser.name}: ${message.message}`;
                chatMessages.appendChild(div);
            });
        });
}

// Manejar cambios de autenticación
auth.onAuthStateChanged(async user => {
    if (user) {
        currentUser = user;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        document.getElementById('auth').style.display = 'none';
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({ id: user.email, name: user.displayName });
        }
        userIdDisplay.textContent = userDoc.data().id || user.email;
        document.getElementById('profile').style.display = 'block';
        document.getElementById('search-section').style.display = 'block';
    } else {
        currentUser = null;
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        document.getElementById('auth').style.display = 'block';
        document.getElementById('profile').style.display = 'none';
        document.getElementById('search-section').style.display = 'none';
        chatSection.style.display = 'none';
    }
});