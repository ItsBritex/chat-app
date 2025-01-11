// Configuración de Firebase
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
const backButton = document.getElementById('back-button');

// Variables globales
let currentUser = null;
let currentChat = null;

// Event listeners
messageForm.addEventListener('submit', sendMessage);
sendButton.addEventListener('click', sendMessage);
backButton.addEventListener('click', () => window.location.href = 'index.html');
messageInput.addEventListener('input', toggleSendButtonColor);

// Función para cambiar el color del botón de enviar
function toggleSendButtonColor() {
    if (messageInput.value.trim() !== '') {
        sendButton.classList.add('has-text');
    } else {
        sendButton.classList.remove('has-text');
    }
}

// Función para enviar mensajes
function sendMessage(e) {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText && currentChat && currentUser) {
        console.log('Intentando enviar mensaje:', messageText);
        console.log('Usuario actual:', currentUser.uid);
        console.log('Destinatario:', currentChat.id);

        db.collection('messages').add({
            sender: currentUser.uid,
            receiver: currentChat.id,
            text: messageText,
            time: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Mensaje enviado con éxito');
            messageInput.value = '';
            toggleSendButtonColor(); // Actualizar el color del botón después de enviar
        }).catch(error => {
            console.error("Error al enviar el mensaje:", error);
        });
    } else {
        console.error('No se puede enviar el mensaje. Datos faltantes:', { messageText, currentChat, currentUser });
    }
}

// Función para mostrar mensajes
function displayMessage(message) {
    console.log('Mostrando mensaje:', message);
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.sender === currentUser.uid ? 'sent' : 'received');
    messageElement.textContent = message.text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para cargar mensajes
function loadMessages() {
    if (currentUser && currentChat) {
        console.log('Cargando mensajes para:', currentUser.uid, currentChat.id);
        db.collection('messages')
            .where('sender', 'in', [currentUser.uid, currentChat.id])
            .where('receiver', 'in', [currentUser.uid, currentChat.id])
            .orderBy('time')
            .onSnapshot((snapshot) => {
                console.log('Snapshot recibido:', snapshot.size, 'mensajes');
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        console.log('Nuevo mensaje:', change.doc.data());
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

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Usuario autenticado:', user.uid);
        currentUser = user;
        
        // Actualizar la foto de perfil
        const userProfilePicture = document.getElementById('user-profile-picture');
        userProfilePicture.src = user.photoURL || 'assets/default.jpeg'; // Si no tiene foto, usa la predeterminada
        
        // Obtener información del amigo del almacenamiento local
        const storedFriend = JSON.parse(localStorage.getItem('currentChatFriend'));
        if (storedFriend) {
            console.log('Amigo del chat:', storedFriend);
            currentChat = storedFriend;
            friendName.textContent = `@${currentChat.username}`;
            loadMessages();
        } else {
            console.error('No hay información del amigo en el almacenamiento local');
            window.location.href = 'index.html';
        }
    } else {
        console.log('No hay usuario autenticado');
        window.location.href = 'index.html';
    }
});


// Verificar el estado de autenticación al cargar la página
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Usuario autenticado al cargar la página:', user.uid);
    } else {
        console.log('No hay usuario autenticado al cargar la página');
        window.location.href = 'index.html';
    }
});

