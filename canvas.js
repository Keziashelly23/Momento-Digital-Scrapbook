// canvas.js (module) - upgraded: metadata saving, paper saving, delete images, thumbnails, export, cleanup

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* -------------------------
   FIREBASE CONFIG
   ------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBMK3YVY8G159USlVmOT6oEZOzAhkQ27f8",
  authDomain: "scrapbookapp-18607.firebaseapp.com",
  projectId: "scrapbookapp-18607",
  storageBucket: "scrapbookapp-18607.appspot.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage(app);

/* -------------------------
   DOM refs
   ------------------------- */
const rightPage = document.getElementById("rightPage");
const leftPage = document.getElementById("leftPage");
const addTextBtn = document.getElementById("addTextBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const toolbar = document.getElementById('fontToolbar');
const addImgBtn = document.getElementById("addImgBtn");
const imgFile = document.getElementById("imgFile");
const choosePaperBtn = document.getElementById('choosePaperBtn');
const paperPicker = document.getElementById('paperPicker');
const paperOptions = document.querySelectorAll('.paper-option');
const nextPageBtn = document.getElementById('nextPageBtn');
const backBtn = document.getElementById('backBtn');
const pageIndicator = document.getElementById('pageIndicator');
const saveBtn = document.getElementById('saveBtn'); // new explicit save button
const exportBtn = document.getElementById('exportBtn'); // new export button
const generateThumbBtn = document.getElementById('generateThumbBtn'); // optional button to force thumbnail
const addStickers = document.getElementById("addStickersBtn");
const stickerPopup = document.getElementById("stickerPopup");
const stickerArea = document.getElementById("stickerArea");
const stickerTab = document.getElementById("sticker-tab");




/* -------------------------
   App state
   ------------------------- */
let selectedText = null;
let history = [];
let redoStack = [];
let autoSaveTimer = null;
const AUTO_SAVE_DEBOUNCE = 1500;

let currentUser = null;
const journalId = sessionStorage.getItem('activeJournalId') || localStorage.getItem('activeJournalId'); // fallback
const mode = sessionStorage.getItem('journalMode') || localStorage.getItem('journalMode') || 'edit';
let currentPageNumber = 1; // start at page 1

if (!journalId) {
  alert('No active journal found. Go back to dashboard and open a journal.');
}

/* -------------------------
   Auth and initial load
   ------------------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  await loadPage(currentPageNumber);
  saveState(false); // push initial content into history but don't trigger autosave
});


/* -------------------------
   Undo / Redo + History
   ------------------------- */
function saveState(pushToHistory = true) {
  const current = rightPage.innerHTML;
  if (pushToHistory) {
    if (history.length && history[history.length - 1] === current) {
      // no-op
    } else {
      history.push(current);
      if (history.length > 100) history.shift();
    }
    redoStack = [];
    updateButtons();
  }
  scheduleAutoSave();
}

function undo() {
  if (!history.length) return;
  redoStack.push(rightPage.innerHTML);
  const prevState = history.pop();
  rightPage.innerHTML = prevState;
  reinitializeElements();
  reinitializeTextBoxes();
  updateButtons();
  scheduleAutoSave();
}

function redo() {
  if (!redoStack.length) return;
  history.push(rightPage.innerHTML);
  const nextState = redoStack.pop();
  rightPage.innerHTML = nextState;
  reinitializeElements();
  reinitializeTextBoxes();
  updateButtons();
  scheduleAutoSave();
}

function updateButtons() {
  undoBtn.disabled = history.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

// STICKERS
const stickers = {
  food: [
    "stickers/food/sticker-1.png","stickers/food/sticker-2.png",
    "stickers/food/sticker-3.png","stickers/food/sticker-4.png",
    "stickers/food/sticker-5.png","stickers/food/sticker-6.png",
    "stickers/food/sticker-7.png","stickers/food/sticker-8.png",
    "stickers/food/sticker-9.png","stickers/food/sticker-10.png",
    "stickers/food/sticker-11.png","stickers/food/sticker-12.png",
    "stickers/food/sticker-13.png","stickers/food/sticker-14.png",
    "stickers/food/sticker-15.png","stickers/food/sticker-16.png",
    "stickers/food/sticker-17.png","stickers/food/sticker-18.png",
    "stickers/food/sticker-19.png","stickers/food/sticker-20.png",
    "stickers/food/sticker-21.png","stickers/food/sticker-22.png",
    "stickers/food/sticker-23.png","stickers/food/sticker-24.png",
    "stickers/food/sticker-25.png","stickers/food/sticker-26.png",
    "stickers/food/sticker-27.png","stickers/food/sticker-28.png",
    "stickers/food/sticker-29.png","stickers/food/sticker-30.png",
    "stickers/food/sticker-31.png","stickers/food/sticker-32.png",
    "stickers/food/sticker-33.png","stickers/food/sticker-34.png",
    "stickers/food/sticker-35.png"
  ],
  travel: [
    "stickers/travel/sticker-1.png","stickers/travel/sticker-2.png",
    "stickers/travel/sticker-3.png","stickers/travel/sticker-4.png",
    "stickers/travel/sticker-5.png", "stickers/travel/sticker-6.jpg",
    "stickers/travel/sticker-7.jpg","stickers/travel/sticker-8.jpg",
    "stickers/travel/sticker-9.jpg", "stickers/travel/sticker-10.png",
    "stickers/travel/sticker-11.png", "stickers/travel/sticker-12.png",
    "stickers/travel/sticker-13.png","stickers/travel/sticker-14.png",
    "stickers/travel/sticker-15.png","stickers/travel/sticker-16.png",
    "stickers/travel/sticker-17.png","stickers/travel/sticker-18.png",
    "stickers/travel/sticker-19.png"
  ],
  book: [
    "stickers/book/sticker-1.png","stickers/book/sticker-2.png",
    "stickers/book/sticker-3.png","stickers/book/sticker-4.png",
    "stickers/book/sticker-5.png","stickers/book/sticker-6.png",
    "stickers/book/sticker-7.png","stickers/book/sticker-8.png",
    "stickers/book/sticker-9.png","stickers/book/sticker-10.png",
    "stickers/book/sticker-11.png","stickers/book/sticker-12.png",
    "stickers/book/sticker-13.png","stickers/book/sticker-14.png",
    "stickers/book/sticker-15.png"
  ],
  other: [
    "stickers/other/other-1.png", "stickers/other/other-2.png",
    "stickers/other/other-3.png", "stickers/other/other-4.png",
    "stickers/other/other-5.png", "stickers/other/other-6.png",
    "stickers/other/other-7.png", "stickers/other/other-8.png",
    "stickers/other/other-9.png", "stickers/other/other-10.png",
    "stickers/other/other-11.png", "stickers/other/other-12.png",
    "stickers/other/other-13.png", "stickers/other/other-14.png",
    "stickers/other/other-15.png", "stickers/other/other-16.png",
    "stickers/other/other-17.png", "stickers/other/other-18.png",
    "stickers/other/other-19.png",
    "stickers/other/tape-1.png", "stickers/other/tape-2.png",
    "stickers/other/tape-3.png", "stickers/other/tape-4.png",
    "stickers/other/tape-5.png", "stickers/other/tape-6.png",
    "stickers/other/tape-7.png", "stickers/other/tape-8.png",
    "stickers/other/tape-9.png", "stickers/other/tape-10.png"
  ],
  letters: [
    "stickers/letters/a-1.png", "stickers/letters/b-1.png",
    "stickers/letters/c-1.png", "stickers/letters/d-1.png",
    "stickers/letters/e-1.png", "stickers/letters/f-1.png",
    "stickers/letters/g-1.png", "stickers/letters/h-1.png",
    "stickers/letters/i-1.png", "stickers/letters/j-1.png",
    "stickers/letters/k-1.png", "stickers/letters/l-1.png",
    "stickers/letters/m-1.png", "stickers/letters/n-1.png",
    "stickers/letters/o-1.png", "stickers/letters/p-1.png",
    "stickers/letters/q-1.png", "stickers/letters/r-1.png",
    "stickers/letters/s-1.png", "stickers/letters/t-1.png",
    "stickers/letters/u-1.png", "stickers/letters/v-1.png",
    "stickers/letters/w-1.png", "stickers/letters/x-1.png",
    "stickers/letters/y-1.png", "stickers/letters/z-1.png"
  ]
};

addStickers.addEventListener("click", () => {
  if (stickerPopup.style.display === 'none' || stickerPopup.style.display === '') {
    stickerPopup.style.display = 'block';
    const firstTab = document.querySelector(".sticker-tab");
    if (firstTab) {
      loadStickers(firstTab.dataset.id);
    }
  } else {
    stickerPopup.style.display = 'none';
  }
});

document.querySelectorAll(".sticker-tab").forEach(stickerTab => {
  stickerTab.addEventListener("click", () => {
    const label = stickerTab.dataset.id;
    loadStickers(label);
  });
});

function loadStickers(label){
  const area = document.getElementById("stickerArea");
  area.innerHTML = "";

  stickers[label].forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.style.width = "60px";
    img.style.height = "60px";
    img.style.margin = "5px";
    img.style.cursor = "pointer";

    img.addEventListener("click", () => {
      placeSticker(src);
      stickerPopup.style.display = "none";
    });
    area.appendChild(img);
  });
}

function placeSticker(src){
  saveState();

  const container = document.createElement("div");
  container.classList.add("image-frame");
  container.setAttribute('data-id', generateId());
  container.style.left = "100px";
  container.style.top = "100px";

  const sticker = document.createElement("img");
  sticker.src = src;
  sticker.style.width = "80px";
  sticker.style.height = "auto";
  sticker.style.display = "block";
  sticker.style.pointerEvents = "none";

  const resize = document.createElement("div");
  resize.classList.add("resize");
  resize.textContent = "➘";
  resize.title = "Resize";

  const rotate = document.createElement("div");
  rotate.classList.add("rotate");
  rotate.textContent = "↺";
  rotate.title = "Rotate";

  const deleteBtn = document.createElement("div");
  deleteBtn.classList.add("delete");
  deleteBtn.textContent = "✗";
  deleteBtn.title = "Delete";
  deleteBtn.addEventListener("click", () => {
    container.remove();
    saveState();
  });

  container.appendChild(sticker);
  container.appendChild(resize);
  container.appendChild(rotate);
  container.appendChild(deleteBtn);
  rightPage.appendChild(container);

  sticker.ondragstart = () => false;

  move(container);

  saveState();
}

/* -------------------------
   Reinitialize interactive elements (text/image)
   ------------------------- */
function reinitializeElements() {
  document.querySelectorAll('.image-frame').forEach(frame => {

    // remove old handles if they exist (avoid duplicates)
    frame.querySelectorAll('.resize, .rotate').forEach(el => el.remove());

    // create resize handle
    const resize = document.createElement("div");
    resize.classList.add("resize");
    resize.textContent = "➘";

    // create rotate handle
    const rotate = document.createElement("div");
    rotate.classList.add("rotate");
    rotate.textContent = "↺";

    // ---- DELETE ----
    const deleteBtn = document.createElement("div");
    deleteBtn.classList.add("delete");
    deleteBtn.textContent = "✗";
    deleteBtn.title = "Delete";

    deleteBtn.addEventListener("click", () => {
      frame.remove();
      saveState();
      scheduleAutoSave();   // 🔥 keeps deletion after refresh
    });

    frame.appendChild(resize);
    frame.appendChild(rotate);
    frame.appendChild(deleteBtn);

    // rebind dragging/resizing/rotating
    move(frame);
  });
}


/* -------------------------
   debounce + autosave
   ------------------------- */
function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await autoSaveCurrentPage();
  }, AUTO_SAVE_DEBOUNCE);
}

async function autoSaveCurrentPage() {
  await savePageToFirestore(currentPageNumber);
}

/* -------------------------
   Firestore helpers
   Structure:
   journals/{journalId}/pages/{pageNumber}:
     { leftHTML, rightHTML, paper, images: [{id, url, left, top, width, height, rotation, storagePath}], updatedAt }
   ------------------------- */
function pageDocRef(journalId, pageNumber) {
  return doc(db, "journals", journalId, "pages", String(pageNumber));
}

async function loadPage(pageNumber) {
  // clear current
  rightPage.innerHTML = '';
  leftPage.innerHTML = '';

  pageIndicator.textContent = `Page ${pageNumber}`;

  try {
    const docRef = pageDocRef(journalId, pageNumber);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      // load saved HTML if present
      rightPage.innerHTML = data.rightHTML || '';
      leftPage.innerHTML = data.leftHTML || '';
      // load paper/background
      if (data.paper) {
        leftPage.style.backgroundImage = `url(${data.paper})`;
        rightPage.style.backgroundImage = `url(${data.paper})`;
        leftPage.style.backgroundSize = 'cover';
        rightPage.style.backgroundSize = 'cover';
      } else {
        leftPage.style.backgroundImage = '';
        rightPage.style.backgroundImage = '';
      }

      // If image metadata saved, rehydrate image frames to ensure controls exist.
      // If your rightHTML includes <img src="..."> already, we'll attach controls to wrappers.
      reinitializeElements();
      reinitializeTextBoxes();

      // If images metadata exist but HTML doesn't include wrappers (older pages),
      // construct image-frame from metadata:
      if (Array.isArray(data.images) && data.images.length) {
        // If there's already an element with same data-id skip
        data.images.forEach(meta => {
          const exists = rightPage.querySelector(`.image-frame[data-id="${meta.id}"]`);
          if (!exists) {
            createImageBoxFromMeta(meta);
          } else {
            // ensure transform & size match metadata
            const el = exists;
            const img = el.querySelector('img');
            if (img) {
              img.src = meta.url;
              img.style.width = meta.width ? `${meta.width}px` : img.style.width;
              img.style.height = meta.height ? `${meta.height}px` : img.style.height;
            }
            el.style.left = meta.left ? `${meta.left}px` : el.style.left;
            el.style.top = meta.top ? `${meta.top}px` : el.style.top;
            if (meta.rotation) el.style.transform = `rotate(${meta.rotation}deg)`;
          }
          if (data.pageColor) {
  leftPage.style.backgroundColor = data.pageColor;
  rightPage.style.backgroundColor = data.pageColor;
  leftPage.style.backgroundBlendMode = "multiply";
  rightPage.style.backgroundBlendMode = "multiply";
}

        });
      }

    } else {
      // initialize new empty page
      rightPage.innerHTML = '';
      leftPage.innerHTML = '';
      await setDoc(docRef, {
        leftHTML: '',
        rightHTML: '',
        paper: '',
        images: [],
        pageNumber: pageNumber,
        owner: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.error('Error loading page', err);
  }

  reinitializeElements();
  reinitializeTextBoxes();
  saveState(false); // push initial content into history but don't trigger autosave
}

/* -------------------------
   Save page to Firestore (saves both left + right + paper + images metadata)
   ------------------------- */
async function savePageToFirestore(pageNumber) {
  try {
    const docRef = pageDocRef(journalId, pageNumber);
    const payload = {
      leftHTML: leftPage.innerHTML,
      rightHTML: rightPage.innerHTML,
      paper: extractPaperFromPages(), // either data-src or ''.
      pageColor: leftPage.style.backgroundColor || "", // save color
      images: collectImagesMetadata(),
      pageNumber,
      owner: currentUser.uid,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });

    // optionally generate and store thumbnail (async, not blocking)
    generateAndSaveThumbnail(pageNumber).catch(err => console.warn("Thumb gen failed:", err));
    // console.log('Saved page', pageNumber);
  } catch (err) {
    console.error('Error saving page', err);
  }
}

/* -------------------------
   Helpers: extract paper, collect image metadata
   ------------------------- */
function extractPaperFromPages() {
  // retrieve background-image from rightPage (prefer)
  const bg = rightPage.style.backgroundImage || leftPage.style.backgroundImage || '';
  // style.backgroundImage is like 'url("...")' or ''
  if (!bg) return '';
  const m = bg.match(/url\(["']?(.*?)["']?\)/);
  return m ? m[1] : '';
}

function collectImagesMetadata() {
  const metas = [];
  document.querySelectorAll('.image-frame').forEach(frame => {
    const img = frame.querySelector('img');
    const id = frame.getAttribute('data-id') || frame.dataset.id || generateId();
    const styleLeft = parseInt(frame.style.left || frame.offsetLeft || 0, 10);
    const styleTop = parseInt(frame.style.top || frame.offsetTop || 0, 10);
    // width stored on img
    const width = img ? img.offsetWidth : parseInt(frame.style.width || 0, 10);
    const height = img ? img.offsetHeight : parseInt(frame.style.height || 0, 10);
    // rotation from transform
    let rotation = 0;
    const tf = frame.style.transform || '';
    const rotMatch = tf.match(/rotate\(([-\d.]+)deg\)/);
    if (rotMatch) rotation = parseFloat(rotMatch[1]);

    const url = img?.getAttribute('src') || '';
    const storagePath = frame.getAttribute('data-storagepath') || '';

    metas.push({
      id,
      url,
      storagePath,
      left: styleLeft,
      top: styleTop,
      width,
      height,
      rotation
    });

    // ensure data-id saved on DOM
    frame.setAttribute('data-id', id);
  });
  return metas;
}

/* -------------------------
   UI: Add text
   ------------------------- */
addTextBtn.addEventListener('click', () => {
  saveState();
  const textBox = document.createElement('div');
  textBox.classList.add('text-box');
  textBox.contentEditable = true;
  textBox.textContent = 'Double-click to edit text';
  Object.assign(textBox.style, {
    position: 'absolute',
    top: '100px',
    left: '100px',
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#000',
    padding: '6px 10px',
    background: 'transparent',
    border: 'none',
    cursor: 'move',
    zIndex: 5,
    userSelect: 'text',
    display: 'inline-block',
    minWidth: '50px',
    maxWidth: '300px'
  });

  // Add delete button for text box
  const deleteBtn = document.createElement('div');
  deleteBtn.classList.add('text-delete');
  deleteBtn.textContent = '✗';
  Object.assign(deleteBtn.style, {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    background: '#f44336',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    textAlign: 'center',
    lineHeight: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10,
    userSelect: 'none',
    boxShadow: '0 0 4px rgba(0,0,0,0.3)'
  });
  deleteBtn.title = 'Delete Text Box';
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    textBox.remove();
    saveState();
  });
  textBox.appendChild(deleteBtn);

  rightPage.appendChild(textBox);

  enableDragging(textBox);
  setupSelection(textBox);
  textBox.addEventListener('input', saveStateWrapper);
  saveState();
});

// Prevent redirect on text input
document.addEventListener('keydown', (e) => {
  if (e.target.classList.contains('text-box') && e.key === 'Enter') {
    e.preventDefault();
    document.execCommand('insertLineBreak');
  }
});

/* -------------------------
   selection toolbar
   ------------------------- */
function setupSelection(textBox) {
  textBox.addEventListener('click', e => {
    e.stopPropagation();
    selectTextBox(textBox, e);
  });
}

function selectTextBox(textBox, e) {
  if (selectedText) selectedText.classList.remove('selected');
  selectedText = textBox;
  selectedText.classList.add('selected');

  toolbar.style.display = 'flex';
  const top = Math.max(10, e.clientY - 60);
  const left = Math.min(window.innerWidth - 220, e.clientX);
  toolbar.style.top = `${top}px`;
  toolbar.style.left = `${left}px`;

  const fontSelect = document.getElementById('fontSelect');
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  const colorPicker = document.getElementById('colorPicker');
  if (fontSelect) fontSelect.value = (textBox.style.fontFamily || 'Arial').split(',')[0].trim();
  if (fontSizeSelect) fontSizeSelect.value = textBox.style.fontSize || '18px';
  if (colorPicker) colorPicker.value = rgbToHex(textBox.style.color || '#000');
}

if (toolbar) {
  toolbar.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => {
    if (selectedText) selectedText.classList.remove('selected');
    toolbar.style.display = 'none';
    selectedText = null;
  });

  // toolbar handlers (guard with existence)
  const fs = document.getElementById('fontSelect');
  const fss = document.getElementById('fontSizeSelect');
  const cp = document.getElementById('colorPicker');
  if (fs) fs.addEventListener('change', e => { if (selectedText) { saveState(); selectedText.style.fontFamily = e.target.value; }});
  if (fss) fss.addEventListener('change', e => { if (selectedText) { saveState(); selectedText.style.fontSize = e.target.value; }});
  if (cp) cp.addEventListener('input', e => { if (selectedText) { saveState(); selectedText.style.color = e.target.value; }});
  const boldBtn = document.getElementById('boldBtn');
  const italicBtn = document.getElementById('italicBtn');
  const underlineBtn = document.getElementById('underlineBtn');
  if (boldBtn) boldBtn.addEventListener('click', () => { if (selectedText) { saveState(); selectedText.style.fontWeight = selectedText.style.fontWeight === 'bold' ? 'normal' : 'bold'; }});
  if (italicBtn) italicBtn.addEventListener('click', () => { if (selectedText) { saveState(); selectedText.style.fontStyle = selectedText.style.fontStyle === 'italic' ? 'normal' : 'italic'; }});
  if (underlineBtn) underlineBtn.addEventListener('click', () => { if (selectedText) { saveState(); selectedText.style.textDecoration = selectedText.style.textDecoration === 'underline' ? 'none' : 'underline'; }});
}

/* -------------------------
   dragging utility for text boxes
   ------------------------- */
function enableDragging(el) {
  let isDragging = false, offsetX, offsetY;

  el.addEventListener('mousedown', e => {
    if (window.getSelection().toString() !== "") return;
    if (e.target === el) {
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      el.classList.add('active');
    }
  });

  document.addEventListener('mousemove', e => {
    if (isDragging) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) saveState();
    isDragging = false;
    el.classList.remove('active');
  });
}

// 
// Image Button // 
// directly opens file picker
addImgBtn.addEventListener("click", () => {
    imgFile.click();
});

// reads file and adds to page
imgFile.addEventListener("change", (f) => {
  const file = f.target.files[0];
  if (!file) {
    return;
  };

  const reader = new FileReader();
  reader.onload = function(event) {
    createImageBox(event.target.result);
  };
  reader.readAsDataURL(file);

  imgFile.value = "";

});

// frame around the image with resize/rotate
function createImageBox(src) {
  const container = document.createElement("div");
  container.classList.add("image-frame");
  container.setAttribute('data-id', generateId());
  container.style.left = `${Math.random() * 300 + 50}px`;
  container.style.top = `${Math.random() * 300 + 50}px`;

  const img = document.createElement("img");
  img.src = src;
  img.style.width = "200px";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.pointerEvents = "none";

  const resize = document.createElement("div");
  resize.classList.add("resize");
  resize.textContent = "➘";

  const rotate = document.createElement("div");
  rotate.classList.add("rotate");
  rotate.textContent = "↺";

  const deleteBtn = document.createElement("div");
  deleteBtn.classList.add("delete");
  deleteBtn.textContent = "✗";
  deleteBtn.title = "Delete";
  deleteBtn.addEventListener("click", () => {
    container.remove();
    saveState();
  });

  container.append(img, resize, rotate, deleteBtn);
  rightPage.appendChild(container);

  move(container); // drag/resize/rotate handler

  saveState(); // save after creation
}



// dragging - resizing - rotating
function move(box){
  let isDragging = false, offsetX, offsetY;
  let isResizing = false, startWidth, startHeight, startX, startY;
  let isRotating = false, startAngle, centerX, centerY, startRotation;

  const resize = box.querySelector(".resize");
  const rotate = box.querySelector(".rotate");


  //highlights box and on click starts dragging
  box.addEventListener("mousedown", (e) => {
    if (e.target === resize || e.target === rotate) return;
    isDragging = true;
    offsetX = e.clientX - box.offsetLeft;
    offsetY = e.clientY - box.offsetTop;
    box.classList.add("active");
  });




  // box moves with mouse
  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      box.style.left = `${e.clientX - offsetX}px`;
      box.style.top = `${e.clientY - offsetY}px`;

    // keeps image from squishing and updates the width anf height
    } else if (isResizing) {
    const img = box.querySelector("img");
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const scale = Math.max(dx, dy) / 100;
    const newWidth = Math.max(50, startWidth + dx);
    const aspectRatio = startWidth / startHeight;
    const newHeight = newWidth / aspectRatio;

    img.style.width = `${newWidth}px`;
    img.style.height = `${newHeight}px`;

    // rotate
    } else if (isRotating) {
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const deg = (angle - startAngle) * (180 / Math.PI) + startRotation;
      box.style.transform = `rotate(${deg}deg)`;
    }
  });

  //stop everything when un clicking and saves
  window.addEventListener("mouseup", () => {
    if (isDragging || isResizing || isRotating) {
      saveState();
    }
    isDragging = isResizing = isRotating = false;
  });

  resize.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    startWidth = box.querySelector("img").offsetWidth;
    startHeight = box.querySelector("img").offsetHeight;
    startX = e.clientX;
    startY = e.clientY;
  });

  rotate.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isRotating = true;
    const rect = box.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const transform = box.style.transform.match(/rotate\(([-\d.]+)deg\)/);
    startRotation = transform ? parseFloat(transform[1]) : 0;
  });

  //clicking off box removes it
  document.addEventListener("click", (e) => {
    if (!box.contains(e.target)) box.classList.remove("active");
  });
}

//for pc/laptop, ctrl v pastes images
document.addEventListener("paste", (e) =>{
  const items = e.clipboardData.items;
  for (let i = 0; i <items.length; i++){
    if (items[i].type.indexOf("image") !== -1){
      const file = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = function(event) {
        createImageBox(event.target.result);
      };
      reader.readAsDataURL(file);
      e.preventDefault();
    }
  }
})



/* -------------------------
   Paper picker behavior + save paper
   ------------------------- */
choosePaperBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  paperPicker.classList.toggle('show');
});

document.addEventListener('click', () => {
  paperPicker.classList.remove('show');
});

paperOptions.forEach(option => {
  option.addEventListener('mouseenter', () => {
    const previewSrc = option.getAttribute('data-src') || '';
    leftPage.style.backgroundImage = previewSrc ? `url(${previewSrc})` : 'none';
    rightPage.style.backgroundImage = previewSrc ? `url(${previewSrc})` : 'none';
    leftPage.style.backgroundSize = 'cover';
    rightPage.style.backgroundSize = 'cover';
  });

  option.addEventListener('mouseleave', () => {
    // do nothing (persist on click)
  });

  option.addEventListener('click', () => {
    const selectedPaper = option.getAttribute('data-src') || '';
    leftPage.style.backgroundImage = selectedPaper ? `url(${selectedPaper})` : 'none';
    rightPage.style.backgroundImage = selectedPaper ? `url(${selectedPaper})` : 'none';
    paperPicker.classList.remove('show');
    saveState();
  });
});

const colorWheelBtn = document.getElementById("colorWheelBtn");
const colorWheelPopup = document.getElementById("colorWheelPopup");

// Show/hide popup
colorWheelBtn.addEventListener("click", () => {
  const isVisible = colorWheelPopup.style.display === "block";
  colorWheelPopup.style.display = isVisible ? "none" : "block";
});

// Create color wheel
let colorPicker = new iro.ColorPicker("#colorWheel", {
  width: 160,
  color: "#ffffff",
  borderWidth: 1,
  borderColor: "#ddd",
});

// Update page color
colorPicker.on("color:change", (color) => {
  // make sure these match your actual page element variables
  leftPage.style.backgroundColor = color.hexString;
  rightPage.style.backgroundColor = color.hexString;

  leftPage.style.backgroundBlendMode = "multiply";
  rightPage.style.backgroundBlendMode = "multiply";

  // schedule autosave so color is remembered
  scheduleAutoSave();
});

// Close popup when clicking elsewhere
document.addEventListener("click", (e) => {
  if (!colorWheelPopup.contains(e.target) && e.target !== colorWheelBtn) {
    colorWheelPopup.style.display = "none";
  }
});


/* -------------------------
   Page navigation
   ------------------------- */
nextPageBtn.addEventListener('click', async () => {
  await savePageToFirestore(currentPageNumber);
  currentPageNumber += 1;
  await loadPage(currentPageNumber);
});

backBtn.addEventListener('click', async () => {
  if (currentPageNumber > 1) {
    await savePageToFirestore(currentPageNumber);
    currentPageNumber -= 1;
    await loadPage(currentPageNumber);
  }
});

/* -------------------------
   Keyboard shortcuts
   ------------------------- */
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
});

/* -------------------------
   Explicit Save button
   ------------------------- */
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    await savePageToFirestore(currentPageNumber);
    // quick feedback
    saveBtn.textContent = 'Saved ✓';
    setTimeout(()=> saveBtn.textContent = 'Save', 1200);
  });
}

/* -------------------------
   Export current page as single HTML
   ------------------------- */
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const html = buildExportHTML(currentPageNumber);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${journalId}-page-${currentPageNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function buildExportHTML(pageNumber) {
  // Simple export: left + right combined into one HTML file; external images referenced by URL
  const docHtml = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Journal ${journalId} - Page ${pageNumber}</title>
<style>
  body { margin:0; font-family: Arial, sans-serif; }
  .page { width: 1200px; height: 800px; display:inline-block; vertical-align:top; box-sizing:border-box; padding:20px; }
  .left, .right { width: 50%; display:inline-block; vertical-align:top; }
  .content { position: relative; min-height: 760px; }
  .image-frame { position:absolute; }
  .text-box { position:absolute; white-space: pre-wrap; }
</style>
</head>
<body>
  <div class="page left">
    <div class="content">${leftPage.innerHTML}</div>
  </div>
  <div class="page right">
    <div class="content">${rightPage.innerHTML}</div>
  </div>
</body>
</html>
`;
  return docHtml;
}

/* -------------------------
   Thumbnail generation (creates small PNG data URL and saves to Firestore)
   - Implementation: render page HTML into SVG foreignObject then draw into canvas
   - Note: this can fail on some browsers if CSS is complex or external fonts blocked.
   ------------------------- */
async function generateAndSaveThumbnail(pageNumber) {
  try {
    const width = 480;
    const height = 320;
    const htmlContent = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:1200px;height:800px;padding:10px;background:white;">${rightPage.innerHTML}</div>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>
      <foreignObject width='100%' height='100%'>
        ${htmlContent}
      </foreignObject>
    </svg>`;
    const svgBlob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,width,height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataURL = canvas.toDataURL('image/png');
      // save thumbnail string to Firestore (careful about size; small PNG okay)
      const docRef = pageDocRef(journalId, pageNumber);
      await updateDoc(docRef, { thumbnail: dataURL, thumbnailAt: serverTimestamp() });
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); console.warn('Thumb image load error', e); };
    img.src = url;
  } catch (err) {
    console.warn('Thumbnail generation failed', err);
  }
}

/* optional: button to force thumbnail now */
if (generateThumbBtn) generateThumbBtn.addEventListener('click', () => generateAndSaveThumbnail(currentPageNumber));

/* -------------------------
   Helpers
   ------------------------- */
function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return rgb;
  return "#" + ((1 << 24) + (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3])).toString(16).slice(1);
}

function saveStateWrapper() { saveState(); }

function generateId(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

/* -------------------------
   Reinitialize text boxes to restore draggable and selection behavior after loading or undo/redo
   ------------------------- */
function reinitializeTextBoxes() {
  const textBoxes = rightPage.querySelectorAll('.text-box');
  textBoxes.forEach(textBox => {

    // Add delete button if doesn't exist already
    if (!textBox.querySelector('.text-delete')) {
      const deleteBtn = document.createElement('div');
      deleteBtn.classList.add('text-delete');
      deleteBtn.textContent = '✗';
      Object.assign(deleteBtn.style, {
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        background: '#f44336',
        color: 'white',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        textAlign: 'center',
        lineHeight: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: 10,
        userSelect: 'none',
        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
      });
      deleteBtn.title = 'Delete Text Box';
      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        textBox.remove();
        saveState();
      });
      textBox.appendChild(deleteBtn);
    }

    enableDragging(textBox);
    setupSelection(textBox);
  });
}
