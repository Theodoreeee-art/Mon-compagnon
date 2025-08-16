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
    initAlbum(user);
    const nameInput = document.getElementById('pet-name');
    const breedInput = document.getElementById('pet-breed');
    const dobInput = document.getElementById('pet-dob');
    const descInput = document.getElementById('pet-desc');
    const foodInput = document.getElementById('pet-food');
    const toyInput = document.getElementById('pet-toy');
    const behaviorInput = document.getElementById('pet-behavior');
    if (nameInput) nameInput.value = user.pet.name || '';
    if (breedInput) breedInput.value = user.pet.breed || '';
    if (dobInput) dobInput.value = user.pet.dob || '';
    if (descInput) descInput.value = user.pet.description || '';
    if (foodInput) foodInput.value = user.pet.food || '';
    if (toyInput) toyInput.value = user.pet.toy || '';
    if (behaviorInput) behaviorInput.value = user.pet.behavior || '';
  } else {
    const infoSection = document.getElementById('pet-info');
    if (infoSection) infoSection.style.display = 'none';
    const formEl = document.getElementById('pet-form');
    if (formEl) formEl.style.display = 'block';
    const albumSection = document.getElementById('photo-album');
    if (albumSection) albumSection.style.display = 'none';
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

// Save pet information from the dashboard form
function savePetInfo(user) {
  const name = document.getElementById('pet-name').value.trim();
  const breed = document.getElementById('pet-breed').value.trim();
  const dob = document.getElementById('pet-dob').value;
  const desc = document.getElementById('pet-desc').value.trim();
  const food = document.getElementById('pet-food').value.trim();
  const toy = document.getElementById('pet-toy').value.trim();
  const behavior = document.getElementById('pet-behavior').value.trim();
  const vetFileInput = document.getElementById('pet-vet');
  const photoInput = document.getElementById('pet-photos');
  const errorEl = document.getElementById('pet-error');
  if (errorEl) errorEl.textContent = '';
  if (!name || !breed || !dob || !desc || !food || !toy || !behavior) {
    if (errorEl) errorEl.textContent = 'Veuillez remplir tous les champs concernant votre chien.';
    return;
  }
  const existingPhotos = (user.pet && user.pet.photos) ? user.pet.photos : [];
  const totalPhotos = existingPhotos.length + (photoInput.files ? photoInput.files.length : 0);
  if (totalPhotos < 2) {
    if (errorEl) errorEl.textContent = 'Veuillez ajouter au moins deux photos de votre chien.';
    return;
  }
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
  // Photos (multiple)
  const photos = existingPhotos.slice();
  if (photoInput.files && photoInput.files.length > 0) {
    Array.from(photoInput.files).forEach(file => {
      const p = new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = function() {
          const comment = prompt('Ajouter un commentaire pour cette photo :', '');
          photos.push({ name: file.name, data: fr.result, comment });
          resolve();
        };
        fr.readAsDataURL(file);
      });
      readerTasks.push(p);
    });
  }
  Promise.all(readerTasks).then(() => {
    const users = getUsers();
    // Update this user
    const idx = users.findIndex(u => u.email === user.email);
    const petObj = {
      name,
      breed,
      dob,
      description: desc,
      food,
      toy,
      behavior,
      vetFile: vetObj,
      photos
    };
    users[idx].pet = petObj;
    setUsers(users);
    user.pet = petObj;
    displayPetInfo(petObj);
    initAlbum(user);
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
  infoEl.style.display = 'block';
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

  // Display additional photos below the card
  if (pet.photos && pet.photos.length > 1) {
    const extraContainer = document.createElement('div');
    extraContainer.classList.add('pet-extra-photos');
    pet.photos.slice(1).forEach((photo) => {
      const extraImg = document.createElement('img');
      extraImg.src = photo.data;
      extraImg.alt = pet.name;
      extraImg.loading = 'lazy';
      extraContainer.appendChild(extraImg);
    });
    infoEl.appendChild(extraContainer);
  }
}

// Initialize and manage the photo album section on the dashboard
function initAlbum(user) {
  const section = document.getElementById('photo-album');
  const input = document.getElementById('album-input');
  const addBtn = document.getElementById('add-photos');
  const viewBtn = document.getElementById('view-album');
  const closeBtn = document.getElementById('close-album');
  if (!section || !input) return;
  section.style.display = 'block';
  displayAlbum(user.pet);
  if (input.dataset.initialized) return;
  input.dataset.initialized = 'true';
  if (addBtn) {
    addBtn.addEventListener('click', () => input.click());
  }
  if (viewBtn) {
    viewBtn.addEventListener('click', () => openAlbumModal(user.pet));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAlbumModal);
  }
  const modal = document.getElementById('album-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAlbumModal();
    });
  }
  input.addEventListener('change', () => {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    const newPhotos = [];
    const tasks = files.map(file => new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = () => {
        // Add the photo with an empty comment field. The textarea below the
        // picture lets the user provide or edit a comment after import.
        newPhotos.push({ name: file.name, data: fr.result, comment: '' });
        resolve();
      };
      fr.readAsDataURL(file);
    }));
    Promise.all(tasks).then(() => {
      const users = getUsers();
      const idx = users.findIndex(u => u.email === user.email);
      if (!users[idx].pet.photos) users[idx].pet.photos = [];
      users[idx].pet.photos = users[idx].pet.photos.concat(newPhotos);
      user.pet.photos = users[idx].pet.photos;
      setUsers(users);
      input.value = '';
      displayAlbum(user.pet);
      displayPetInfo(user.pet);
    });
  });
}

function displayAlbum(pet) {
  const gallery = document.getElementById('album-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  const viewBtn = document.getElementById('view-album');
  if (viewBtn) {
    if (pet.photos && pet.photos.length > 0) {
      viewBtn.style.display = 'inline-block';
    } else {
      viewBtn.style.display = 'none';
    }
  }
  if (pet.photos) {
    pet.photos.forEach((ph, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'album-item';
      const img = document.createElement('img');
      img.src = ph.data;
      img.alt = ph.name;
      img.style.cursor = 'pointer';
      const link = document.createElement('a');
      link.href = ph.data;
      link.target = '_blank';
      link.appendChild(img);
      wrap.appendChild(link);
      const ta = document.createElement('textarea');
      ta.className = 'album-comment';
      ta.placeholder = 'Ajouter un commentaire';
      ta.value = ph.comment || '';
      ta.addEventListener('change', () => {
        const users = getUsers();
        const email = getCurrentUserEmail();
        const idx = users.findIndex(u => u.email === email);
        if (idx !== -1 && users[idx].pet && users[idx].pet.photos && users[idx].pet.photos[index]) {
          users[idx].pet.photos[index].comment = ta.value;
          setUsers(users);
        }
      });
      wrap.appendChild(ta);
      gallery.appendChild(wrap);
    });
  }
}

function openAlbumModal(pet) {
  const modal = document.getElementById('album-modal');
  const modalGallery = document.getElementById('modal-gallery');
  if (!modal || !modalGallery) return;
  modalGallery.innerHTML = '';
  if (pet.photos) {
    pet.photos.forEach(ph => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-item';
      const img = document.createElement('img');
      img.src = ph.data;
      img.alt = ph.name;
      wrap.appendChild(img);
      const comment = document.createElement('p');
      comment.className = 'modal-comment';
      comment.textContent = ph.comment || '';
      wrap.appendChild(comment);
      modalGallery.appendChild(wrap);
    });
  }
  modal.classList.add('active');
}

function closeAlbumModal() {
  const modal = document.getElementById('album-modal');
  if (modal) {
    modal.classList.remove('active');
  }
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
      card.className = 'card';
      // use first photo or placeholder
      const img = document.createElement('img');
      if (user.pet.photos && user.pet.photos.length > 0) {
        img.src = user.pet.photos[0].data;
      } else {
        img.src = 'images/real2.jpg'; // fallback image: photo réelle d’un chien
      }
      img.alt = user.pet.name;
      card.appendChild(img);
      const cardContent = document.createElement('div');
      cardContent.className = 'card-content';
      const h3 = document.createElement('h3');
      h3.textContent = user.pet.name;
      cardContent.appendChild(h3);
      const p = document.createElement('p');
      p.textContent = user.pet.description;
      cardContent.appendChild(p);
      const fundSpan = document.createElement('p');
      fundSpan.className = 'fund';
      fundSpan.textContent = 'Cagnotte: ' + (user.fund.toFixed(2)) + ' €';
      cardContent.appendChild(fundSpan);
      card.appendChild(cardContent);
      // Display any additional photos beneath the main card
      if (user.pet.photos && user.pet.photos.length > 1) {
        const extraContainer = document.createElement('div');
        extraContainer.className = 'pet-extra-photos';
        user.pet.photos.slice(1).forEach(photo => {
          const extraImg = document.createElement('img');
          extraImg.src = photo.data;
          extraImg.alt = user.pet.name;
          extraImg.loading = 'lazy';
          extraContainer.appendChild(extraImg);
        });
        card.appendChild(extraContainer);
      }
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
      // Display any additional photos below the card
      if (user.pet.photos && user.pet.photos.length > 1) {
        const extraContainer = document.createElement('div');
        extraContainer.className = 'pet-extra-photos';
        user.pet.photos.slice(1).forEach(photo => {
          const extraImg = document.createElement('img');
          extraImg.src = photo.data;
          extraImg.alt = user.pet.name;
          extraImg.loading = 'lazy';
          extraContainer.appendChild(extraImg);
        });
        card.appendChild(extraContainer);
      }
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
