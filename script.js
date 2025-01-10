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
  const userNameSpan = document.getElementById('user-name');
  const newUsernameInput = document.getElementById('new-username');
  const saveUsernameButton = document.getElementById('save-username');
  const friendSearch = document.getElementById('friend-search');
  const friendList = document.getElementById('friend-list');
  
  // Variables globales
  let currentUser = null;
  
  // Event listeners
  loginButton.addEventListener('click', signInWithGoogle);
  logoutButton.addEventListener('click', signOut);
  friendSearch.addEventListener('input', debounce(searchFriends, 300));
  userNameSpan.addEventListener('click', showUsernameInput);
  saveUsernameButton.addEventListener('click', changeUsername);
  
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
      friendList.innerHTML = '';
  
      if (searchTerm.length === 0) {
          return;
      }
  
      db.collection('users')
          .orderBy('username')
          .startAt(searchTerm)
          .endAt(searchTerm + '\uf8ff')
          .limit(10)
          .get()
          .then((snapshot) => {
              snapshot.forEach((doc) => {
                  const userData = doc.data();
                  if (doc.id !== currentUser.uid) {
                      const li = document.createElement('li');
                      li.textContent = `@${userData.username}`;
                      li.addEventListener('click', () => startChat(doc.id, userData.username));
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
  function startChat(friendId, friendUsername) {
      localStorage.setItem('currentChatFriend', JSON.stringify({ id: friendId, username: friendUsername }));
      window.location.href = 'chat.html';
  }
  
  // Función para mostrar el input de cambio de nombre de usuario
  function showUsernameInput() {
      userNameSpan.style.display = 'none';
      newUsernameInput.style.display = 'inline-block';
      saveUsernameButton.style.display = 'inline-block';
      newUsernameInput.value = userNameSpan.textContent.slice(1); // Eliminar el @
      newUsernameInput.focus();
  }
  
  // Función para cambiar el nombre de usuario
  function changeUsername() {
      const newUsername = newUsernameInput.value.trim();
      if (newUsername && newUsername !== currentUser.username) {
          db.collection('users').where('username', '==', newUsername).get()
              .then((snapshot) => {
                  if (snapshot.empty) {
                      return db.collection('users').doc(currentUser.uid).update({
                          username: newUsername
                      });
                  } else {
                      throw new Error('El nombre de usuario ya existe');
                  }
              })
              .then(() => {
                  userNameSpan.textContent = `@${newUsername}`;
                  currentUser.username = newUsername;
                  newUsernameInput.style.display = 'none';
                  saveUsernameButton.style.display = 'none';
                  userNameSpan.style.display = 'inline-block';
              })
              .catch((error) => {
                  alert(error.message);
              });
      }
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
  
          // Verificar si el usuario ya tiene un nombre de usuario
          db.collection('users').doc(user.uid).get().then((doc) => {
              if (doc.exists && doc.data().username) {
                  currentUser.username = doc.data().username;
                  userNameSpan.textContent = `@${currentUser.username}`;
              } else {
                  // Si no tiene un nombre de usuario, crear uno basado en su displayName
                  const username = user.displayName.toLowerCase().replace(/\s+/g, '_');
                  db.collection('users').doc(user.uid).set({
                      username: username,
                      email: user.email
                  }, { merge: true });
                  currentUser.username = username;
                  userNameSpan.textContent = `@${username}`;
              }
          });
      } else {
          currentUser = null;
          loginButton.style.display = 'inline-block';
          logoutButton.style.display = 'none';
          userSection.style.display = 'none';
          friendList.innerHTML = '';
      }
  });
  
  