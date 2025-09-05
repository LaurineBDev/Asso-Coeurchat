import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { addDoc, collection, doc, getFirestore, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// -------------------- Firebase config --------------------
const firebaseConfig = {
  apiKey: "AIzaSyCXfqXDrchazy8K8lWYpjRCbkGJYD1bnyI",
  authDomain: "asso-chat62.firebaseapp.com",
  projectId: "asso-chat62",
  storageBucket: "asso-chat62.appspot.com",
  messagingSenderId: "283608611023",
  appId: "1:283608611023:web:d0f47df1457b11e4e19fba",
  measurementId: "G-MTTSWTZR20"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -------------------- DOM Elements --------------------
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const logoutSection = document.getElementById("logout-section");
const adminSection = document.getElementById("admin-section");
const userInfo = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout-btn");
const animalForm = document.getElementById("animal-form");
const listeAnimaux = document.getElementById("liste-animaux");

const overlay = document.getElementById("overlay");
const overlayImg = document.getElementById("overlay-img");

let currentEditId = null;
let isAdmin = false;

// -------------------- Connexion --------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Erreur de connexion : " + error.message);
  }
});

// -------------------- Déconnexion --------------------
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  currentEditId = null;
  animalForm.reset();
  animalForm.querySelector("button").textContent = "Ajouter";
});

// -------------------- Changement d’état --------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    logoutSection.classList.remove("hidden");
    adminSection.classList.remove("hidden");
    userInfo.textContent = "Connecté : " + user.email;
    isAdmin = true;
  } else {
    loginSection.classList.remove("hidden");
    logoutSection.classList.add("hidden");
    adminSection.classList.add("hidden");
    isAdmin = false;
  }
  renderListeAnimaux();
});

// -------------------- Ajouter / Modifier un animal --------------------
animalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value;
  const naissance = document.getElementById("naissance").value;
  const photo = document.getElementById("photo").value;
  const description = document.getElementById("description").value;

  try {
    if (currentEditId) {
      const docRef = doc(db, "animaux", currentEditId);
      await updateDoc(docRef, { nom, naissance, photo, description });
      currentEditId = null;
      animalForm.querySelector("button").textContent = "Ajouter";
    } else {
      await addDoc(collection(db, "animaux"), { nom, naissance, photo, description });
    }
    animalForm.reset();
  } catch (error) {
    alert("Erreur : " + error.message);
  }
});

// -------------------- Lightbox --------------------
function showFullscreen(src) {
  overlayImg.src = src;
  overlay.style.display = "flex";
}

overlay.addEventListener("click", () => {
  overlay.style.display = "none";
});

// -------------------- Affichage des animaux --------------------
function renderListeAnimaux() {
  onSnapshot(collection(db, "animaux"), (snapshot) => {
    listeAnimaux.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const animal = docSnap.data();
      const div = document.createElement("div");
      div.classList.add("animal");

      // Texte à gauche
      const textDiv = document.createElement("div");
      textDiv.classList.add("text-content");
      textDiv.innerHTML = `
        <h3>${animal.nom}</h3>
        <p>Date de naissance : ${animal.naissance}</p>
        <p>${animal.description}</p>
      `;

      // Image à droite
      const img = document.createElement("img");
      img.src = animal.photo;
      img.alt = animal.nom;
      img.classList.add("animal-photo");
      img.addEventListener("click", () => showFullscreen(animal.photo));

      div.appendChild(textDiv);
      div.appendChild(img);

      // Bouton Modifier pour admin
      if (isAdmin) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "Modifier";
        editBtn.classList.add("edit-btn");
        editBtn.addEventListener("click", () => {
          document.getElementById("nom").value = animal.nom;
          document.getElementById("naissance").value = animal.naissance;
          document.getElementById("photo").value = animal.photo;
          document.getElementById("description").value = animal.description;
          currentEditId = docSnap.id;
          animalForm.querySelector("button").textContent = "Modifier";
        });
        textDiv.appendChild(editBtn);
      }

      listeAnimaux.appendChild(div);
    });
  });
}
