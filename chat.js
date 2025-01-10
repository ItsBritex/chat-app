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
  const backButton = document.getElementById('back-button');
  
  // Variables globales
  let currentUser = null;
  let currentChat = null;
  
  // Event listeners
  messageForm.addEventListener('submit', sendMessage);
  backButton.addEventListener('click', () => window.location.href = 'index.html');
  
  // Función para enviar mensajes
  function sendMessage(e) {
      e.preventDefault();
      const messageText = messageInput.value.trim();
      if (messageText && currentChat && currentUser) {
          db.collection('messages').add({
              sender: currentUser.uid,
              receiver: currentChat.id,
              text: messageText,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
              messageInput.value = '';
          }).catch(error => {
              console.error("Error al enviar el mensaje:", error);
          });
      }
  }
  
  // Función para mostrar mensajes
  function displayMessage(message) {
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
          db.collection('messages')
              .where('sender', 'in', [currentUser.uid, currentChat.id])
              .where('receiver', 'in', [currentUser.uid, currentChat.id])
              .orderBy('timestamp')
              .onSnapshot((snapshot) => {
                  snapshot.docChanges().forEach((change) => {
                      if (change.type === 'added') {
                          displayMessage(change.doc.data());
                      }
                  });
              }, (error) => {
                  console.error("Error al cargar los mensajes:", error);
              });
      }
  }
  
  // Listener para cambios en el estado de autenticación
  auth.onAuthStateChanged((user) => {
      if (user) {
          currentUser = user;
          // Obtener información del amigo del almacenamiento local
          const storedFriend = JSON.parse(localStorage.getItem('currentChatFriend'));
          if (storedFriend) {
              currentChat = storedFriend;
              friendName.textContent = currentChat.name;
              loadMessages();
          } else {
              // Si no hay información del amigo, volver a la página principal
              window.location.href = 'index.html';
          }
      } else {
          // Si no hay usuario autenticado, volver a la página principal
          window.location.href = 'index.html';
      }
  });
  
  