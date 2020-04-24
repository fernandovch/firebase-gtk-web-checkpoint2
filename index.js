// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
const firebaseConfig = {
  apiKey: "AIzaSyC1VFJGZzNdjII87giPg1Z9LnSrRIngdqs",
  authDomain: "fir-web-codelab-4f752.firebaseapp.com",
  databaseURL: "https://fir-web-codelab-4f752.firebaseio.com",
  projectId: "fir-web-codelab-4f752",
  storageBucket: "fir-web-codelab-4f752.appspot.com",
  messagingSenderId: "444406181494",
  appId: "1:444406181494:web:901bcebe0d8252ae033957"
};

// Initialize Firebase
if (firebaseConfig && firebaseConfig.apiKey) {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
} else {
  document.write('<h1>Welcome to the Codelab! Add your Firebase config object to <pre>/index.js</pre> and refresh to get started</h1>');
  console.error('missing firebase config object in index.js. It can be found in the Firebase console.');
  return;
}

// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl){
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

// Listen to RSVP button clicks
startRsvpButton.addEventListener('click', () => {
  if (firebase.auth().currentUser){
    // User is signed in; allows user to sign out
    firebase.auth().signOut();
  }
  else{
    // No user is signed in; allows user to sign in
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});

// Listen to the current Auth state
firebase.auth().onAuthStateChanged((user) => {
 if (user){
   startRsvpButton.textContent = "LOGOUT";
   // Show guestbook to logged-in users
   guestbookContainer.style.display = "block";
   subscribeGuestBook();
   subscribeCurrentRSVP(user);
 }
 else{
   startRsvpButton.textContent = "RSVP";
   // Hide guestbook for non-logged-in users
   guestbookContainer.style.display = "none";

   unsubcribeGuestbook();
   unsubscribeCurrentRSVP();
 }
});

// Listen to the form submission
form.addEventListener("submit", (e) => {
 // Prevent the default form redirect
 e.preventDefault();
 // Write a new message to the database collection "guestbook"
 firebase.firestore().collection("guestbook").add({
   text: input.value,
   timestamp: Date.now(),
   name: firebase.auth().currentUser.displayName,
   userId: firebase.auth().currentUser.uid
 })
 // clear message input field
 input.value = ""; 
 // Return false to avoid redirect
 return false;
});

function subscribeGuestBook(){

  guestbookListener = firebase.firestore().collection("guestbook").orderBy("timestamp", "desc")
      .onSnapshot((snaps) => {
      guestbook.innerHTML = "";
      snaps.forEach((doc)=>{
      const entry = document.createElement("p");
      entry.textContent = doc.data().name + ": " + doc.data().text;
      guestbook.appendChild(entry);
      });
      });

}

function unsubcribeGuestbook(){

  if(guestbookListener != null)
  {
      guestbookListener();
      guestbookListener = null;
  }

}

rsvpYes = ()=>{
  const userDoc = firebase.firestore().collection('attendees')
    .doc(firebase.auth().currentUser.uid) ;
    userDoc.set({
      attending:true
    }).catch(console.error);
}

rsvpNo = ()=>{
  
  const userDoc = firebase.firestore().collection('attendees')
    .doc(firebase.auth().currentUser.uid) ;
    userDoc.set({
      attending:false
    }).catch(console.error);
}

firebase.firestore().collection("attendees")
.where("attending", "==", true )
.onSnapshot((snaps)=>{
  const newAttendeeCount = snaps.docs.length;
  numberAttending.innerHTML = newAttendeeCount + ' people going ';
})

function subscribeCurrentRSVP(user){
  rsvpListener = firebase.firestore().collection('attendees')
    .doc(user.uid).onSnapshot( (doc)=>{
      if(doc && doc.data())
      {
          const attendingResponse = doc.data().attending;

          if(attendingResponse){
            rsvpYes.className = "clicked";
            rsvpNo.className = "";
          }else{
            rsvpYes.className = "";
            rsvpNo.className = "clicked";
          }

      }
    })
}

function unsubscribeCurrentRSVP(){
  
  if (rsvpListener !=null) 
  {
    rsvpListener ();
    rsvpListener=null;
  }  
  
  rsvpYes.className = "clicked";
  rsvpNo.className = "";
}