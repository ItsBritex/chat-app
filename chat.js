// Configuración de Firebase (asegúrate de que sea la misma que en script.js)
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

// Obtener referencias a los servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos del DOM
const friendName = document.getElementById('friend-name');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const backButton = document.getElementById('back-to-chats');

// Variables globales
let currentUser = null;
let currentChat = null;

// Listener para regresar a la página de chats
backButton.addEventListener('click', () => window.location.href = 'index.html');

// Mostrar el botón de enviar cuando hay texto en el input
messageInput.addEventListener('input', () => {
    if (messageInput.value.trim() !== '') {
        sendButton.style.display = 'flex';
        messageInput.style.flex = '0.8'; // Reduce ligeramente el tamaño del input
    } else {
        sendButton.style.display = 'none';
        messageInput.style.flex = '1'; // Restaura el tamaño original
    }
});

// Función para enviar mensajes a Firebase
function sendMessageToFirebase(messageText) {
    if (messageText && currentChat && currentUser) {
        db.collection('messages').add({
            sender: currentUser.uid,
            receiver: currentChat.id,
            text: messageText,
            time: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Mensaje enviado con éxito');
        }).catch(error => {
            console.error("Error al enviar el mensaje:", error);
        });
    } else {
        console.error('No se puede enviar el mensaje. Datos faltantes:', { messageText, currentChat, currentUser });
    }
}

// Función para mostrar mensajes en el chat
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.sender === currentUser.uid ? 'sent' : 'received');
    messageElement.textContent = message.text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll automático
}

// Función para cargar mensajes desde Firebase
function loadMessages() {
    if (currentUser && currentChat) {
        db.collection('messages')
            .where('sender', 'in', [currentUser.uid, currentChat.id])
            .where('receiver', 'in', [currentUser.uid, currentChat.id])
            .orderBy('time')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        displayMessage(change.doc.data());
                    }
                });
            }, (error) => {
                console.error("Error al cargar los mensajes:", error);
            });
    } else {
        console.error('No se pueden cargar los mensajes. Datos faltantes:', { currentUser, currentChat });
    }
}

// Listener de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        const storedFriend = JSON.parse(localStorage.getItem('currentChatFriend'));
        if (storedFriend) {
            currentChat = storedFriend;
            friendName.textContent = `@${currentChat.username}`;
            loadMessages();
        } else {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});

// Listener para enviar el mensaje al enviar el formulario
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText) {
        sendMessageToFirebase(messageText);
        messageInput.value = ''; // Limpiar el input
        sendButton.style.display = 'none'; // Ocultar el botón de enviar
        messageInput.style.flex = '1'; // Restaura el tamaño del input
    }
});
