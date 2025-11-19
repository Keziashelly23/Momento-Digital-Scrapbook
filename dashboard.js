// ------------------------
// FIRESTORE VERSION
// ------------------------

let journals = [];
let user = null;

// Wait for login
auth.onAuthStateChanged(u => {
  if (!u) {
    window.location.href = "index.html";
    return;
  }

  user = u;
  document.getElementById('userGreeting').textContent = `${u.displayName || u.email}'s Journals! ⋆𖦹⋆ˎˊ˗`;
  loadJournals();
});

// Load journals from Firestore
function loadJournals() {
  db.collection("journals")
    .where("owner", "==", user.uid)
    .onSnapshot(snapshot => {
      journals = [];
      snapshot.forEach(doc => {
        journals.push({ id: doc.id, ...doc.data() });
      });

      // Sort journals by createdAt ascending
      journals.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt ? b.createdAt.toMillis() : 0;
        return aTime - bTime;
      });

      showDashboard();
    });
}

// Save (update) a journal in Firestore
function saveJournalToFirestore(id, data) {
  return db.collection("journals").doc(id).update({
    ...data,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

document.querySelector(".create-circle-wrapper").addEventListener("click", createNewJournal);

// Create a new journal
function createNewJournal() {
  const modal = document.getElementById('createJournalModal');
  const titleInput = document.getElementById('journalTitle');
  const colorInput = document.getElementById('journalColor');
  const confirmBtn = document.getElementById('createJournalConfirm');
  const cancelBtn = document.getElementById('createJournalCancel');

  titleInput.value = '';
  colorInput.value = '#E6BDDC';
  modal.style.display = 'flex';

  confirmBtn.onclick = async () => {
    const title = titleInput.value.trim() || "Untitled Journal";
    const coverColor = colorInput.value;

    await db.collection("journals").add({
      owner: user.uid,
      title,
      coverColor,
      coverImage: "https://i.imgur.com/3R9Xn5L.png",
      pages: [
        { id: 1, content: "", background: "#fff" }
      ],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    modal.style.display = 'none';
  };

  cancelBtn.onclick = () => modal.style.display = 'none';

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Display the dashboard
function showDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  dashboard.innerHTML = '';

  if (journals.length === 0) {
    dashboard.innerHTML = `<p class="no-journals">No journals yet. Create one to get started!</p>`;
    return;
  }

  journals.forEach(journal => {
    const el = document.createElement('div');
    el.className = 'journal-cover';

    el.innerHTML = `
      <div class="journal">
        <div class="journal-overlay">
          <button class="overlay-btn view-btn" style="font-family: 'nanum';">Open</button>
          <button class="overlay-btn delete-btn" style="font-family: 'nanum';">Delete</button>
        </div>

        <div>
          <svg class="cover" width="630" height="831" viewBox="0 0 630 831" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.51 1.5V829.44H586.104C609.119 829.44 627.574 810.9 627.574 787.885V43.055C627.574 20.04 609.119 1.5 586.104 1.5H1.5H1.51Z"
              fill="${journal.coverColor || '#E6BDDC'}"
              stroke="#030000" stroke-width="3" stroke-linejoin="round"/>
          </svg>
        </div>

        <img src="images/journalspirals.svg" class="spiral" alt="Spiral Binding">
        <img src="images/journalpages.svg" class="journal-pages" alt="Journal Pages">
      </div>

      <div class="journal-title">
        <h3>${journal.title}</h3>
        <button class="pencil-btn" title="Edit Title & Cover">✏️</button>
      </div>
    `;

    // Buttons
    const viewBtn = el.querySelector('.view-btn');
    const pencilBtn = el.querySelector('.pencil-btn');
    const deleteBtn = el.querySelector('.delete-btn');

    // Event listeners
    viewBtn.addEventListener('click', () => openJournal(journal.id));
    pencilBtn.addEventListener('click', () => editJournal(journal));
    deleteBtn.addEventListener('click', () => deleteJournal(journal.id)); // Firestore delete

    dashboard.appendChild(el);
  });
}


// Delete a journal
function deleteJournal(id) {
  if (!confirm("Delete this journal?")) return;
  db.collection("journals").doc(id).delete();
}

// Open journal in canvas
function openJournal(id) {
  sessionStorage.setItem("activeJournalId", id);
  sessionStorage.setItem("journalMode", "view");
  window.location.href = "canvas.html";
}

// Edit journal modal
function editJournal(journal) {
  const modal = document.getElementById('editJournalModal');
  const titleInput = document.getElementById('editJournalTitle');
  const colorInput = document.getElementById('editJournalColor');
  const saveBtn = document.getElementById('editJournalSave');
  const skipBtn = document.getElementById('editJournalSkip');
  const cancelBtn = document.getElementById('editJournalCancel');

  titleInput.value = journal.title;
  colorInput.value = journal.coverColor;
  modal.style.display = 'flex';

  saveBtn.onclick = async () => {
    await saveJournalToFirestore(journal.id, {
      title: titleInput.value.trim() || "Untitled Journal",
      coverColor: colorInput.value
    });

    modal.style.display = 'none';
  };

  skipBtn.onclick = () => {
    sessionStorage.setItem("activeJournalId", journal.id);
    sessionStorage.setItem("journalMode", "edit");
    window.location.href = "canvas.html";
  };

  cancelBtn.onclick = () => modal.style.display = 'none';

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Sign out button (place this in HTML)
function signOut() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
