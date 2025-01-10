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
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const userSection = document.getElementById('user-section');
  const userName = document.getElementById('user-name');
  const friendSearch = document.getElementById('friend-search');
  const friendList = document.getElementById('friend-list');
  
  // Variables globales
  let currentUser = null;
  
  // Event listeners
  loginButton.addEventListener('click', signInWithGoogle);
  logoutButton.addEventListener('click', signOut);
  friendSearch.addEventListener('input', debounce(searchFriends, 300));
  
  // Función para iniciar sesión con Google
  function signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(error => {
          console.error("Error al iniciar sesión:", error);
      });
  }
  
  // Función para cerrar sesión
  function signOut() {
      auth.signOut().catch(error => {
          console.error("Error al cerrar sesión:", error);
      });
  }
  
  // Función para buscar amigos
  function searchFriends() {
      const searchTerm = friendSearch.value.trim().toLowerCase();
      if (searchTerm.length === 0) {
          friendList.innerHTML = '';
          return;
      }
  
      db.collection('users')
          .where('nameLower', '>=', searchTerm)
          .where('nameLower', '<=', searchTerm + '\uf8ff')
          .limit(10)
          .get()
          .then((snapshot) => {
              friendList.innerHTML = '';
              snapshot.forEach((doc) => {
                  const userData = doc.data();
                  if (doc.id !== currentUser.uid) {
                      const li = document.createElement('li');
                      li.textContent = userData.name;
                      li.addEventListener('click', () => startChat(doc.id, userData.name));
                      friendList.appendChild(li);
                  }
              });
              if (friendList.children.length === 0) {
                  const li = document.createElement('li');
                  li.textContent = 'No se encontraron usuarios';
                  friendList.appendChild(li);
              }
          })
          .catch(error => {
              console.error("Error al buscar usuarios:", error);
          });
  }
  
  // Función para iniciar chat
  function startChat(friendId, friendName) {
      localStorage.setItem('currentChatFriend', JSON.stringify({ id: friendId, name: friendName }));
      window.location.href = 'chat.html';
  }
  
  // Función debounce para evitar múltiples llamadas a la base de datos
  function debounce(func, delay) {
      let timeoutId;
      return function (...args) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
  }
  
  // Listener para cambios en el estado de autenticación
  auth.onAuthStateChanged((user) => {
      if (user) {
          currentUser = user;
          loginButton.style.display = 'none';
          logoutButton.style.display = 'inline-block';
          userSection.style.display = 'block';
          userName.textContent = user.displayName;
  
          // Guardar o actualizar la información del usuario en Firestore
          db.collection('users').doc(user.uid).set({
              name: user.displayName,
              email: user.email,
              nameLower: user.displayName.toLowerCase()
          }, { merge: true });
      } else {
          currentUser = null;
          loginButton.style.display = 'inline-block';
          logoutButton.style.display = 'none';
          userSection.style.display = 'none';
          friendList.innerHTML = '';
      }
  });
  
  