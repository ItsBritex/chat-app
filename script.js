// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDidRLWFRYqlXWfacV9Rdn2ErkfFJ9iCgw",
    authDomain: "chat-app-ccc84.firebaseapp.com",
    projectId: "chat-app-ccc84",
    storageBucket: "chat-app-ccc84.firebasestorage.app",
    messagingSenderId: "991015329906",
    appId: "1:991015329906:web:d0bb02133b8de1a52c62eb",
    measurementId: "G-3X6LV0DT7P"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Get references to Firebase services
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // DOM elements
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const userSection = document.getElementById('user-section');
  const userName = document.getElementById('user-name');
  const friendSearch = document.getElementById('friend-search');
  const friendList = document.getElementById('friend-list');
  const chatSection = document.getElementById('chat-section');
  const chatFriendName = document.getElementById('chat-friend-name');
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  // Global variables
  let currentUser = null;
  let currentChat = null;
  
  // Event listeners
  loginButton.addEventListener('click', signInWithGoogle);
  logoutButton.addEventListener('click', signOut);
  friendSearch.addEventListener('input', searchFriends);
  sendButton.addEventListener('click', sendMessage);
  
  // Sign in with Google
  function signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider);
  }
  
  // Sign out
  function signOut() {
      auth.signOut();
  }
  
  // Search friends
  function searchFriends() {
      const searchTerm = friendSearch.value.toLowerCase();
      db.collection('users').get().then((snapshot) => {
          friendList.innerHTML = '';
          snapshot.forEach((doc) => {
              const userData = doc.data();
              if (userData.name.toLowerCase().includes(searchTerm) && doc.id !== currentUser.uid) {
                  const li = document.createElement('li');
                  li.textContent = userData.name;
                  li.addEventListener('click', () => startChat(doc.id, userData.name));
                  friendList.appendChild(li);
              }
          });
      });
  }
  
  // Start chat
  function startChat(friendId, friendName) {
      currentChat = friendId;
      chatFriendName.textContent = friendName;
      chatSection.style.display = 'block';
      loadMessages(friendId);
  }
  
  // Load messages
  function loadMessages(friendId) {
      chatMessages.innerHTML = '';
      db.collection('messages')
          .where('participants', 'array-contains', currentUser.uid)
          .orderBy('timestamp')
          .onSnapshot((snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added') {
                      const message = change.doc.data();
                      if (message.participants.includes(friendId)) {
                          displayMessage(message);
                      }
                  }
              });
          });
  }
  
  // Display message
  function displayMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      messageElement.classList.add(message.sender === currentUser.uid ? 'sent' : 'received');
      messageElement.textContent = message.text;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Send message
  function sendMessage() {
      const messageText = messageInput.value.trim();
      if (messageText && currentChat) {
          db.collection('messages').add({
              sender: currentUser.uid,
              text: messageText,
              participants: [currentUser.uid, currentChat],
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          messageInput.value = '';
      }
  }
  
  // Auth state change listener
  auth.onAuthStateChanged((user) => {
      if (user) {
          currentUser = user;
          loginButton.style.display = 'none';
          logoutButton.style.display = 'inline-block';
          userSection.style.display = 'block';
          userName.textContent = user.displayName;
          db.collection('users').doc(user.uid).set({
              name: user.displayName,
              email: user.email
          }, { merge: true });
      } else {
          currentUser = null;
          loginButton.style.display = 'inline-block';
          logoutButton.style.display = 'none';
          userSection.style.display = 'none';
          chatSection.style.display = 'none';
      }
  });
  
  