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
        <div>
          <svg class="cover" width="630" height="831" viewBox="0 0 630 831" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path id="journalCoverFill" d="M1.51 1.5V829.44H586.104C609.119 829.44 627.574 810.9 627.574 787.885V43.055C627.574 20.04 609.119 1.5 586.104 1.5H1.5H1.51Z" fill="${journal.coverColor || '#E6BDDC'}" stroke="#030000" stroke-width="3" stroke-linejoin="round"/>
          </svg>
        </div>
        <img src="images/journalspirals.svg" class="spiral" alt="Spiral Binding">
        <img src="images/journalpages.svg" class="journal-pages" alt="Journal Pages">
      </div>
      <h3>${journal.title}</h3>
    `;

    const button = document.createElement('button');
    button.textContent = 'Open';
    button.addEventListener('click', () => openJournal(journal.id));

    el.appendChild(button);
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

// Open a journal in the editor
function openJournal(id) {
  localStorage.setItem('activeJournalId', id);
  window.location.href = 'editor.html';
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadJournals();
  showDashboard();
});

// ---------- Editor Logic ----------
let currentJournal = null;
let currentPageIndex = 0;

function loadEditor() {
  const id = localStorage.getItem('activeJournalId');
  currentJournal = journals.find(j => j.id == id);
  if (!currentJournal) {
    alert("Journal not found!");
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('journal-title').textContent = currentJournal.title;
  loadPage(currentPageIndex);
}

function loadPage(index) {
  const pageDiv = document.getElementById('page');
  if (!currentJournal.pages[index]) return;

  const page = currentJournal.pages[index];
  pageDiv.innerHTML = page.content;
  pageDiv.style.background = page.background;

  // Save page content on change
  pageDiv.oninput = function() {
    currentJournal.pages[index].content = pageDiv.innerHTML;
    saveJournals();
  };
}

function nextPage() {
  if (currentPageIndex < currentJournal.pages.length - 1) {
    currentPageIndex++;
    loadPage(currentPageIndex);
  } else {
    alert("You're on the last page!");
  }
}

function prevPage() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    loadPage(currentPageIndex);
  } else {
    alert("You're on the first page!");
  }
}

function addPage() {
  const newPage = {
    id: Date.now(),
    content: "",
    background: "#fff"
  };
  currentJournal.pages.push(newPage);
  currentPageIndex = currentJournal.pages.length - 1;
  saveJournals();
  loadPage(currentPageIndex);
}

function goHome() {
  saveJournals();
  window.location.href = 'dashboard.html';
}