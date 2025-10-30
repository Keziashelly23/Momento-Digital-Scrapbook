let journals = [];

// Load/save journals from localStorage
function loadJournals() {
  const data = localStorage.getItem('journals');
  if (data) journals = JSON.parse(data);
}

function saveJournals() {
  localStorage.setItem('journals', JSON.stringify(journals));
}

// ---------- Dashboard Logic ----------
function showDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  dashboard.innerHTML = '';

  journals.forEach(journal => {
    const el = document.createElement('div');
    el.className = 'journal-cover';
    el.innerHTML = `
      <div class="cover" style="background-image: url('${journal.coverImage}')">
        <h3>${journal.title}</h3>
      </div>
      <button onclick="openJournal(${journal.id})">Open</button>
    `;
    dashboard.appendChild(el);
  });
}

function createNewJournal() {
  const title = prompt("Enter journal title:");
  const newJournal = {
    id: Date.now(),
    title: title || "Untitled Journal",
    coverImage: "https://i.imgur.com/3R9Xn5L.png", // default cover
    pages: [
      { id: 1, content: "", background: "#fff" }
    ]
  };

  journals.push(newJournal);
  saveJournals();
  showDashboard();
}

function openJournal(id) {
  localStorage.setItem('activeJournalId', id);
  window.location.href = 'editor.html';
}

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