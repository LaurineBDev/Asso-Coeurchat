// ======================== Imports Firebase ========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  addDoc, collection, doc, getFirestore, onSnapshot, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================== Configuration Firebase ========================
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

// ======================== DOM Elements ========================
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

const searchName = document.getElementById("search-name");
const searchSexe = document.getElementById("search-sexe");
const searchAge = document.getElementById("search-age");

let currentEditId = null;  // ID de l'animal en cours de modification
let isAdmin = false;        // Détermine si l'utilisateur est admin

// ======================== Connexion ========================
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

// ======================== Déconnexion ========================
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  currentEditId = null;
  animalForm.reset();
  animalForm.querySelector("button").textContent = "Ajouter";
});

// ======================== Changement d’état ========================
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

// ======================== Ajouter / Modifier un animal ========================
animalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("status").value;
  const nom = document.getElementById("nom").value;
  const naissance = document.getElementById("naissance").value;
  const photo = document.getElementById("photo").value;
  const sexe = document.getElementById("sexe").value;
  const description = document.getElementById("description").value;

  try {
    if (currentEditId) {
      const docRef = doc(db, "animaux", currentEditId);
      await updateDoc(docRef, { nom, naissance, photo, description, sexe, status });
      currentEditId = null;
      animalForm.querySelector("button").textContent = "Ajouter";
    } else {
      await addDoc(collection(db, "animaux"), { nom, naissance, photo, description, sexe, status });
    }
    animalForm.reset();
  } catch (error) {
    alert("Erreur : " + error.message);
  }
});

// ======================== Lightbox ========================
function showFullscreen(src) {
  overlayImg.src = src;
  overlay.style.display = "flex";
}

overlay.addEventListener("click", () => {
  overlay.style.display = "none";
});

// ======================== Filtrage ========================
function filterAnimal(animal) {
  const nameFilter = searchName.value.toLowerCase();
  if (nameFilter && !animal.nom.toLowerCase().includes(nameFilter)) return false;

  const sexeFilter = searchSexe.value.toLowerCase();
  if (sexeFilter && animal.sexe.toLowerCase() !== sexeFilter) return false;

  const ageFilter = searchAge.value;
  if (ageFilter) {
    const birthYear = new Date(animal.naissance).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (ageFilter === "0-1" && !(age >= 0 && age <= 1)) return false;
    if (ageFilter === "1-3" && !(age > 1 && age <= 3)) return false;
    if (ageFilter === "3+" && !(age > 3)) return false;
  }

  return true;
}

// ======================== Affichage des animaux ========================
function renderListeAnimaux() {
  onSnapshot(collection(db, "animaux"), (snapshot) => {
    listeAnimaux.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const animal = docSnap.data();
      if (!filterAnimal(animal)) return;

      const div = document.createElement("div");
      div.classList.add("animal");

      const textDiv = document.createElement("div");
      textDiv.classList.add("text-content");

      const statusText = animal.status === "recherche"
        ? "En recherche de famille"
        : animal.status === "reserve"
        ? "Réservé"
        : animal.status === "adopte"
        ? "Déjà adopté"
        : "En recherche de famille";

      textDiv.innerHTML = `
        <p>Statut : ${statusText}</p>
        <h3>${animal.nom}</h3>
        <p>Date de naissance : ${animal.naissance}</p>
        <p>Sexe : ${animal.sexe}</p>
        <p>${animal.description}</p>
      `;

      const img = document.createElement("img");
      img.src = animal.photo;
      img.alt = animal.nom;
      img.classList.add("animal-photo");
      img.addEventListener("click", () => showFullscreen(animal.photo));

      div.appendChild(textDiv);
      div.appendChild(img);

      // Bouton "intéressé" pour tous
      const interestBtn = document.createElement("button");
      interestBtn.textContent = "Intéressé par l'animal, envoyer un mail";
      interestBtn.classList.add("adopt-btn");
      interestBtn.addEventListener("click", () => {
        const subject = encodeURIComponent(`Intérêt pour ${animal.nom}`);
        const body = encodeURIComponent(
          `Bonjour,\n\nJe suis intéressé par ${animal.nom}. J'aimerais avoir plus d'informations sur cet animal, pouvez-vous me recontacter.\n\nCordialement.`
        );

        window.location.href = `mailto:maildel@asso.com?subject=${subject}&body=${body}`;
      });

      textDiv.appendChild(interestBtn);

      // Admin controls
      if (isAdmin) {
        const statusDiv = document.createElement("div");
        statusDiv.classList.add("status-buttons");

        const statuses = [
          { value: "recherche", label: "En recherche" },
          { value: "reserve", label: "Réservé" },
          { value: "adopte", label: "Adopté" }
        ];

        statuses.forEach((s) => {
          const btn = document.createElement("button");
          btn.textContent = s.label;
          btn.addEventListener("click", async () => {
            const docRef = doc(db, "animaux", docSnap.id);
            await updateDoc(docRef, { status: s.value });
          });
          statusDiv.appendChild(btn);
        });

        textDiv.appendChild(statusDiv);

        const editBtn = document.createElement("button");
        editBtn.textContent = "Modifier";
        editBtn.classList.add("edit-btn");
        editBtn.addEventListener("click", () => {
          document.getElementById("nom").value = animal.nom;
          document.getElementById("naissance").value = animal.naissance;
          document.getElementById("photo").value = animal.photo;
          document.getElementById("description").value = animal.description;
          document.getElementById("sexe").value = animal.sexe;
          document.getElementById("status").value = animal.status || "recherche";
          currentEditId = docSnap.id;
          animalForm.querySelector("button").textContent = "Modifier";
        });

        textDiv.appendChild(editBtn);
      }

      listeAnimaux.appendChild(div);
    });
  });
}

// ======================== Écouteurs filtres ========================
searchName.addEventListener("input", renderListeAnimaux);
searchSexe.addEventListener("change", renderListeAnimaux);
searchAge.addEventListener("change", renderListeAnimaux);
