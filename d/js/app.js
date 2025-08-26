/*
  app.js – front-end logic for the dog adoption assurance website

  This script uses the browser's localStorage to persist user accounts,
  session state and pet profiles. It provides functions to register
  subscribers, authenticate users, capture information about their pets
  (including veterinary certificates and photos) and list all pets
  available for adoption. Because there is no back‑end server in this
  simple demo, all data lives in the visitor's browser.
*/

// Utility functions to interact with localStorage
function getUsers() {
  const data = localStorage.getItem('users');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error parsing users from localStorage', e);
    return [];
  }
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUserEmail() {
  return localStorage.getItem('currentUser');
}

function setCurrentUserEmail(email) {
  localStorage.setItem('currentUser', email);
}

function findUser(email) {
  const users = getUsers();
  return users.find(u => u.email === email);
}

function getSeekers() {
  const data = localStorage.getItem('seekers');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error parsing seekers from localStorage', e);
    return [];
  }
}

function setSeekers(seekers) {
  localStorage.setItem('seekers', JSON.stringify(seekers));
}

// Sign up logic: create new user
function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const errorEl = document.getElementById('signup-error');
  errorEl.textContent = '';
  if (!email || !password || !confirm) {
    errorEl.textContent = 'Veuillez remplir tous les champs.';
    return;
  }
  if (password !== confirm) {
    errorEl.textContent = 'Les mots de passe ne correspondent pas.';
    return;
  }
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    errorEl.textContent = 'Un compte avec cet e‑mail existe déjà.';
    return;
  }
  const newUser = {
    email,
    password,
    fund: 4, // from the 6 € subscription, 4 € goes to the dog’s fund
    pet: null // will hold pet details later
  };
  users.push(newUser);
  setUsers(users);
  setCurrentUserEmail(email);
  // Redirect to dashboard directly after successful registration
  window.location.href = 'dashboard.html';
}

// Login logic
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  const user = findUser(email);
  if (!user || user.password !== password) {
    errorEl.textContent = 'Identifiants invalides.';
    return;
  }
  setCurrentUserEmail(email);
  window.location.href = 'dashboard.html';
}

function handleSeekerForm(event) {
  event.preventDefault();
  const email = document.getElementById('seeker-email').value.trim().toLowerCase();
  const breed = document.getElementById('seeker-breed').value.trim().toLowerCase();
  const ageStr = document.getElementById('seeker-age').value.trim();
  const errorEl = document.getElementById('seeker-error');
  if (errorEl) errorEl.textContent = '';
  if (!email) {
    if (errorEl) errorEl.textContent = 'Veuillez fournir un e‑mail.';
    return;
  }
  const age = ageStr ? parseInt(ageStr, 10) : null;
  const seekers = getSeekers();
  seekers.push({ email, breed, age });
  setSeekers(seekers);
  event.target.reset();
  alert('Nous vous contacterons si un chien correspond à votre recherche.');
}

// Logout
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Dashboard: load user data and populate fields
function loadDashboard() {
  const email = getCurrentUserEmail();
  if (!email) {
    // if not logged in, redirect to login page
    window.location.href = 'login.html';
    return;
  }
  const user = findUser(email);
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  // Display fund amount
  const fundEl = document.getElementById('fund-value');
  if (fundEl) {
    fundEl.textContent = user.fund.toFixed(2) + ' €';
  }
  // Populate existing pet info if any
  if (user.pet) {
    displayPetInfo(user.pet);
    const nameInput = document.getElementById('pet-name');
    const breedInput = document.getElementById('pet-breed');
    const dobInput = document.getElementById('pet-dob');
    const ageInput = document.getElementById('pet-age');
    const descInput = document.getElementById('pet-desc');
    const foodInput = document.getElementById('pet-food');
    const toyInput = document.getElementById('pet-toy');
    const behaviorInput = document.getElementById('pet-behavior');
    if (nameInput) nameInput.value = user.pet.name || '';
    if (breedInput) breedInput.value = user.pet.breed || '';
    if (dobInput) dobInput.value = user.pet.dob || '';
    if (ageInput) ageInput.value = user.pet.age || '';
    if (descInput) descInput.value = user.pet.description || '';
    if (foodInput) foodInput.value = user.pet.food || '';
    if (toyInput) toyInput.value = user.pet.toy || '';
    if (behaviorInput) behaviorInput.value = user.pet.behavior || '';
  } else {
    const infoSection = document.getElementById('pet-info');
    if (infoSection) infoSection.style.display = 'none';
    const formEl = document.getElementById('pet-form');
    if (formEl) formEl.style.display = 'block';
  }
  // Attach form handler
  const petForm = document.getElementById('pet-form');
  if (petForm) {
    petForm.addEventListener('submit', function(ev) {
      ev.preventDefault();
      savePetInfo(user);
    });
  }
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

function calculateAge(dob) {
  if (!dob) return Infinity;
  const diff = Date.now() - new Date(dob).getTime();
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

function notifySeekers(pet) {
  const seekers = getSeekers();
  const matches = seekers.filter(s => {
    const breedMatch = !s.breed || pet.breed.toLowerCase().includes(s.breed);
    const petAge = pet.age != null ? pet.age : calculateAge(pet.dob);
    const ageMatch = !s.age || petAge <= s.age;
    return breedMatch && ageMatch;
  });
  if (matches.length > 0) {
    const emails = matches.map(m => m.email).join(', ');
    alert('Ce chien correspond aux recherches de : ' + emails);
  }
}

// Save pet information from the dashboard form
function savePetInfo(user) {
  const name = document.getElementById('pet-name').value.trim();
  const breed = document.getElementById('pet-breed').value.trim();
  const dob = document.getElementById('pet-dob').value;
  const ageStr = document.getElementById('pet-age').value;
  const age = ageStr ? parseInt(ageStr, 10) : null;
  const desc = document.getElementById('pet-desc').value.trim();
  const food = document.getElementById('pet-food').value.trim();
  const toy = document.getElementById('pet-toy').value.trim();
  const behavior = document.getElementById('pet-behavior').value.trim();
  const vetFileInput = document.getElementById('pet-vet');
  const photoInput = document.getElementById('pet-photos');
  const errorEl = document.getElementById('pet-error');
  if (errorEl) errorEl.textContent = '';
  // Allow saving even if some fields are left empty or no photos are provided
  const existingPhoto = (user.pet && user.pet.photos && user.pet.photos[0]) ? user.pet.photos[0] : null;
  // Read files asynchronously and then save
  const readerTasks = [];
  // Vet certificate (single file)
  let vetObj = null;
  if (vetFileInput.files && vetFileInput.files.length > 0) {
    const file = vetFileInput.files[0];
    const vetPromise = new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = function() {
        vetObj = { name: file.name, data: fr.result };
        resolve();
      };
      fr.readAsDataURL(file);
    });
    readerTasks.push(vetPromise);
  }
  // Photo (single)
  let photoObj = existingPhoto;
  if (photoInput.files && photoInput.files.length > 0) {
    const file = photoInput.files[0];
    const p = new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = function() {
        const comment = prompt('Ajouter un commentaire pour cette photo :', '');
        photoObj = { name: file.name, data: fr.result, comment };
        resolve();
      };
      fr.readAsDataURL(file);
    });
    readerTasks.push(p);
  }
  Promise.all(readerTasks).then(() => {
    const users = getUsers();
    // Update this user
    const idx = users.findIndex(u => u.email === user.email);
    const petObj = {
      name,
      breed,
      dob,
      age,
      description: desc,
      food,
      toy,
      behavior,
      vetFile: vetObj,
      photos: photoObj ? [photoObj] : []
    };
    users[idx].pet = petObj;
    setUsers(users);
    user.pet = petObj;
    notifySeekers(petObj);
    displayPetInfo(petObj);
  });
}

// Show the pet form for editing existing data
function showEditForm(pet) {
  const form = document.getElementById('pet-form');
  const infoEl = document.getElementById('pet-info');
  if (infoEl) infoEl.style.display = 'none';
  if (form) {
    form.style.display = 'block';
    if (pet) {
      document.getElementById('pet-name').value = pet.name || '';
      document.getElementById('pet-breed').value = pet.breed || '';
      document.getElementById('pet-dob').value = pet.dob || '';
      document.getElementById('pet-age').value = pet.age || '';
      document.getElementById('pet-desc').value = pet.description || '';
      document.getElementById('pet-food').value = pet.food || '';
      document.getElementById('pet-toy').value = pet.toy || '';
      document.getElementById('pet-behavior').value = pet.behavior || '';
    }
  }
}

// Display pet information on the dashboard
function displayPetInfo(pet) {
  const infoEl = document.getElementById('pet-info');
  if (!infoEl) return;
  const form = document.getElementById('pet-form');
  if (form) form.style.display = 'none';
  infoEl.style.display = 'flex';
  // Clear existing
  infoEl.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = "Fiche d'identité de votre animal";
  infoEl.appendChild(title);
  const card = document.createElement('div');
  card.className = 'card pet-card';
  const img = document.createElement('img');
  if (pet.photos && pet.photos.length > 0) {
    img.src = pet.photos[0].data;
  } else {
    img.src = 'images/real2.jpg';
  }
  img.alt = pet.name;
  card.appendChild(img);
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';
  const heading = document.createElement('h3');
  heading.textContent = pet.name;
  cardContent.appendChild(heading);
  const breedP = document.createElement('p');
  breedP.textContent = 'Race : ' + (pet.breed || '');
  cardContent.appendChild(breedP);
  const dobP = document.createElement('p');
  if (pet.dob) {
    dobP.textContent = 'Date de naissance : ' + new Date(pet.dob).toLocaleDateString('fr-FR');
  } else {
    dobP.textContent = 'Date de naissance :';
  }
  cardContent.appendChild(dobP);
  const ageP = document.createElement('p');
  if (pet.age != null) {
    ageP.textContent = 'Âge : ' + pet.age + ' an' + (pet.age > 1 ? 's' : '');
  } else if (pet.dob) {
    const years = Math.floor(calculateAge(pet.dob));
    ageP.textContent = 'Âge : ' + years + ' an' + (years > 1 ? 's' : '');
  } else {
    ageP.textContent = 'Âge :';
  }
  cardContent.appendChild(ageP);
  const descP = document.createElement('p');
  descP.textContent = pet.description;
  cardContent.appendChild(descP);
  const foodP = document.createElement('p');
  foodP.textContent = 'Aliment préféré : ' + (pet.food || '');
  cardContent.appendChild(foodP);
  const toyP = document.createElement('p');
  toyP.textContent = 'Jouet préféré : ' + (pet.toy || '');
  cardContent.appendChild(toyP);
  const behaviorP = document.createElement('p');
  behaviorP.textContent = 'Comportement : ' + (pet.behavior || '');
  cardContent.appendChild(behaviorP);
  // Vet file
  if (pet.vetFile) {
    const vetLink = document.createElement('a');
    vetLink.href = pet.vetFile.data;
    vetLink.download = pet.vetFile.name;
    vetLink.textContent = 'Télécharger le certificat vétérinaire';
    vetLink.style.display = 'block';
    vetLink.style.marginBottom = '0.5rem';
    cardContent.appendChild(vetLink);
  }
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = 'Modifier';
  editBtn.addEventListener('click', () => showEditForm(pet));
  cardContent.appendChild(editBtn);
  card.appendChild(cardContent);
  infoEl.appendChild(card);
  // ensure the newly created sheet is visible
  window.scrollTo({ top: infoEl.offsetTop, behavior: 'smooth' });
}

// Show detailed information about a dog in a modal
function openDogModal(user) {
  const modal = document.getElementById('dog-modal');
  if (!modal) return;
  const content = modal.querySelector('.modal-content');
  const pet = user.pet;
  let ageDisplay = '';
  if (pet.age != null) {
    ageDisplay = pet.age + ' an' + (pet.age > 1 ? 's' : '');
  } else if (pet.dob) {
    const years = Math.floor(calculateAge(pet.dob));
    ageDisplay = years + ' an' + (years > 1 ? 's' : '');
  }
  const photoSrc =
    pet.photos && pet.photos.length > 0 ? pet.photos[0].data : 'images/real2.jpg';
  content.innerHTML = `
    <button class="modal-close" aria-label="Fermer">&times;</button>
    <div class="dog-modal-grid">
      <img src="${photoSrc}" alt="${pet.name}" class="dog-photo">
      <div class="dog-info">
        <h2 class="dog-name">${pet.name}</h2>
        <p class="dog-breed"><strong>Race :</strong> ${pet.breed}</p>
        <p><strong>Date de naissance :</strong> ${pet.dob}</p>
        <p><strong>Âge :</strong> ${ageDisplay}</p>
        <p class="dog-desc"><strong>Description :</strong> ${pet.description}</p>
        <p><strong>Nourriture préférée :</strong> ${pet.food}</p>
        <p><strong>Jouet préféré :</strong> ${pet.toy}</p>
        <p><strong>Comportement :</strong> ${pet.behavior}</p>
        <span class="badge fund-badge">Cagnotte : ${user.fund.toFixed(2)} €</span>
        <p><strong>Maître :</strong> ${user.email}</p>
        <div class="dog-actions spacing-md">
          <button class="action-button adopt-btn">Adopter</button>
          <button class="action-button share-btn">Partager</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open');
  const closeBtn = content.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', function handler(e) {
    if (e.target === modal) {
      modal.classList.remove('open');
      modal.removeEventListener('click', handler);
    }
  });
}

// Display all dogs for adoption on dogs.html
function loadDogsPage() {
  const container = document.getElementById('dogs-container');
  if (!container) return;
  const users = getUsers();
  let count = 0;
  users.forEach(user => {
    if (user.pet) {
      count++;
      const card = document.createElement('div');
      card.className = 'card dog-card';
      const photoSrc =
        user.pet.photos && user.pet.photos.length > 0
          ? user.pet.photos[0].data
          : 'images/real2.jpg';
      card.innerHTML = `
        <img src="${photoSrc}" alt="${user.pet.name}" class="dog-photo">
        <div class="dog-info">
          <h3 class="dog-name">${user.pet.name}</h3>
          <p class="dog-desc">${user.pet.description}</p>
          <span class="badge fund-badge">${user.fund.toFixed(2)} €</span>
        </div>
      `;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openDogModal(user));
      container.appendChild(card);
    }
  });
  // Show message if no dogs
  const messageEl = document.getElementById('no-dogs-message');
  if (messageEl) {
    if (count === 0) {
      messageEl.style.display = 'block';
    } else {
      messageEl.style.display = 'none';
    }
  }
}

// Display preview of adoptable dogs on the home page with search
function loadHomeDogs() {
  const container = document.getElementById('home-dogs-container');
  if (!container) return;
  const users = getUsers();
  container.innerHTML = '';
  let count = 0;
  users.forEach(user => {
    if (user.pet) {
      count++;
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      if (user.pet.photos && user.pet.photos.length > 0) {
        img.src = user.pet.photos[0].data;
      } else {
        img.src = 'images/real2.jpg';
      }
      img.alt = user.pet.name;
      card.appendChild(img);
      const content = document.createElement('div');
      content.className = 'card-content';
      const h3 = document.createElement('h3');
      h3.textContent = user.pet.name;
      const p = document.createElement('p');
      p.textContent = user.pet.description;
      const fund = document.createElement('p');
      fund.className = 'fund';
      fund.textContent = 'Cagnotte: ' + user.fund.toFixed(2) + ' €';
      content.append(h3, p, fund);
      card.appendChild(content);
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openDogModal(user));
      container.appendChild(card);
    }
  });
  const messageEl = document.getElementById('no-home-dogs-message');
  if (messageEl) messageEl.style.display = count === 0 ? 'block' : 'none';
}

// Simple slider for the home page gallery
function initGallerySlider() {
  const slider = document.querySelector('.gallery-slider');
  if (!slider) return;
  const track = slider.querySelector('.slider-track');
  const slides = slider.querySelectorAll('.slide');
  const prev = slider.querySelector('.slider-btn.prev');
  const next = slider.querySelector('.slider-btn.next');
  let index = 0;
  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
  }
  prev.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    update();
  });
  next.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    update();
  });
  setInterval(() => {
    next.click();
  }, 5000);
}

// Rotate awareness messages in the thin top banner
function initAwarenessBanner() {
  const el = document.getElementById('awareness-text');
  if (!el) return;
  const messages = [
    "Stop au trafic d'animaux ! Signalez-le au 0 800 123 456.",
    "Adoptez, n'achetez pas : soutenez les refuges.",
    "Protégez la faune sauvage : gardez la nature propre.",
    "Vaccinez et stérilisez vos animaux pour leur santé."
  ];
  let index = 0;
  function update() {
    el.textContent = messages[index];
    index = (index + 1) % messages.length;
  }
  update();
  setInterval(update, 6000);
}

// Attach event listeners based on page
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  const seekerForm = document.getElementById('seeker-form');
  if (seekerForm) {
    seekerForm.addEventListener('submit', handleSeekerForm);
  }
  // Dashboard page detection
  if (document.getElementById('dashboard-page')) {
    loadDashboard();
  }
  // Dogs page detection
  if (document.getElementById('dogs-page')) {
    loadDogsPage();
  }
  loadHomeDogs();
  // Home page slider
  initGallerySlider();
  // Awareness messages banner
  initAwarenessBanner();
});
