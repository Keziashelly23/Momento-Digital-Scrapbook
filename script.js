// Load/save journals from localStorage
function loadJournals() {
  const data = localStorage.getItem('journals');
  if (data) journals = JSON.parse(data);
}

function saveJournals() {
  localStorage.setItem('journals', JSON.stringify(journals));
}

// ---------- Dashboard Logic ----------

// Load existing journals from localStorage or start with an empty array
let journals = JSON.parse(localStorage.getItem('journals')) || [];

// Save journals to localStorage
function saveJournals() {
  localStorage.setItem('journals', JSON.stringify(journals));
}

// Display all journals on the dashboard
function showDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  // Clear previous content
  dashboard.innerHTML = '';

  // If no journals exist, show a message
  if (journals.length === 0) {
    dashboard.innerHTML = `<p class="no-journals">No journals yet. Create one to get started!</p>`;
    return;
  }

  // Loop through each journal and display it
  journals.forEach(journal => {
    const el = document.createElement('div');
    el.className = 'journal-cover';
    el.innerHTML = `
      <div class="cover" style="background-image: url('${journal.coverImage}')">
        <h3>${journal.title}</h3>
      </div>
    `;

    // Create the "Open" button
    const button = document.createElement('button');
    button.textContent = 'Open';
    button.addEventListener('click', () => openJournal(journal.id));

    el.appendChild(button);
    dashboard.appendChild(el);
  });
}

// Create a new journal
function createNewJournal() {
  const title = prompt("Enter journal title:");

  // Stop if user cancels
  if (title === null) return;

  const newJournal = {
    id: Date.now(),
    title: title.trim() || "Untitled Journal",
    coverImage: "https://i.imgur.com/3R9Xn5L.png", // default cover
    pages: [
      { id: 1, content: "", background: "#fff" }
    ]
  };

  journals.push(newJournal);
  saveJournals();
  showDashboard();
}

// Open a journal and go to the editor page
function openJournal(id) {
  localStorage.setItem('activeJournalId', id);
  window.location.href = 'editor.html';
}

// Call this when the page loads to show existing journals
document.addEventListener('DOMContentLoaded', showDashboard);


// ---------- Editor Logic ----------
let currentJournal = null;
let currentPageIndex = 0;

function loadEditor() {
  const id = localStorage.getItem('activeJournalId');
  currentJournal = journals.find(j => j.id == id);
  if (!currentJournal) {
    alert("Journal not found!");
    window.location.href = 'index.html';
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
  window.location.href = 'index.html';
}