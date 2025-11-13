// Load/save journals from localStorage
function loadJournals() {
  const data = localStorage.getItem('journals');
  if (data) journals = JSON.parse(data);
}

function saveJournals() {
  localStorage.setItem('journals', JSON.stringify(journals));
}

// ---------- Dashboard Logic ----------

// Global journal array
let journals = [];

// Load/save journals from localStorage
function loadJournals() {
  const data = localStorage.getItem('journals');
  if (data) {
    try {
      journals = JSON.parse(data);
    } catch (err) {
      console.error("Error parsing journals from localStorage:", err);
      journals = [];
    }
  } else {
    journals = [];
  }
}

function saveJournals() {
  localStorage.setItem('journals', JSON.stringify(journals));
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
          <button class="overlay-btn view-btn">View</button>
          <button class="overlay-btn edit-btn">Edit</button>
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
    const editBtn = el.querySelector('.edit-btn');
    const pencilBtn = el.querySelector('.pencil-btn');
    const journalDiv = el.querySelector('.journal');

    // Prevent click events from bubbling
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      viewJournal(journal.id);
    });

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openJournalForEdit(journal.id);
    });

    pencilBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editJournalMeta(journal.id);
    });

    // Click journal itself → open in edit mode
    journalDiv.addEventListener('click', () => openJournalForEdit(journal.id));

    dashboard.appendChild(el);
  });
}

// Create a new journal
function createNewJournal() {
  const modal = document.getElementById('createJournalModal');
  const titleInput = document.getElementById('journalTitle');
  const colorInput = document.getElementById('journalColor');
  const confirmBtn = document.getElementById('createJournalConfirm');
  const cancelBtn = document.getElementById('createJournalCancel');

  // Reset modal fields
  titleInput.value = '';
  colorInput.value = '#E6BDDC';

  // Show modal
  modal.style.display = 'flex';

  // Confirm button
  confirmBtn.onclick = () => {
    const title = titleInput.value.trim() || "Untitled Journal";
    const coverColor = colorInput.value;

    const newJournal = {
      id: Date.now(),
      title,
      coverColor,
      coverImage: "https://i.imgur.com/3R9Xn5L.png",
      pages: [
        { id: 1, content: "", background: "#fff" }
      ]
    };

    journals.push(newJournal);
    saveJournals();
    showDashboard();

    modal.style.display = 'none';
  };

  // Cancel button
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };

  // Close modal if user clicks outside it
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Edit journal metadata (title & cover only)
function editJournalMeta(journalId) {
  const modal = document.getElementById('editJournalModal');
  const titleInput = document.getElementById('editJournalTitle');
  const colorInput = document.getElementById('editJournalColor');
  const saveBtn = document.getElementById('editJournalSave');
  const cancelBtn = document.getElementById('editJournalCancel');

  const journal = journals.find(j => j.id === journalId);
  if (!journal) return;

  // Pre-fill inputs
  titleInput.value = journal.title;
  colorInput.value = journal.coverColor || '#E6BDDC';

  modal.style.display = 'flex';

  saveBtn.onclick = () => {
    journal.title = titleInput.value.trim() || "Untitled Journal";
    journal.coverColor = colorInput.value;
    saveJournals();
    showDashboard();
    modal.style.display = 'none';
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Open journal in edit mode (clicking journal or Edit button)
function openJournalForEdit(journalId) {
  localStorage.setItem('activeJournalId', journalId);
  localStorage.setItem('journalMode', 'edit');
  window.location.href = 'canvas.html';
}

// Open journal in view mode (View button)
function viewJournal(journalId) {
  localStorage.setItem('activeJournalId', journalId);
  localStorage.setItem('journalMode', 'view');
  window.location.href = 'canvas.html';
}


// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadJournals();
  showDashboard();
});

