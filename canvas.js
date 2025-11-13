


const rightPage = document.getElementById("rightPage");
const addTextBtn = document.getElementById("addTextBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const toolbar = document.getElementById('fontToolbar');
const addImgBtn = document.getElementById("addImgBtn");
const imgFile = document.getElementById("imgFile");

let selectedText = null;
let history = [];
let redoStack = [];

// --- Mode detection ---
const journalId = localStorage.getItem('activeJournalId');
const mode = localStorage.getItem('journalMode'); // 'edit' or 'view'
const journals = JSON.parse(localStorage.getItem('journals')) || [];
let activeJournal = null;

if (journalId) {
  activeJournal = journals.find(j => j.id == journalId);
}

// Apply mode restrictions
if (mode === 'view') {
  disableEditing();
} else {
  enableEditing();
}

function enableEditing() {
  addTextBtn.style.display = 'inline-block';
  undoBtn.disabled = false;
  redoBtn.disabled = false;
}

function disableEditing() {
  addTextBtn.style.display = 'none';
  undoBtn.disabled = true;
  redoBtn.disabled = true;
  document.querySelectorAll(".text-box").forEach(box => box.contentEditable = false);
}

// -------- Undo/Redo --------
function saveState() {
  const current = rightPage.innerHTML;
  if (history.length && history[history.length - 1] === current) return; // avoid duplicates
  history.push(current);
  redoStack = [];
  updateButtons();
}

function undo() {
  if (!history.length) return;
  redoStack.push(rightPage.innerHTML);
  const prevState = history.pop();
  rightPage.innerHTML = prevState;
  reinitializeElements();
  updateButtons();
}

function redo() {
  if (!redoStack.length) return;
  history.push(rightPage.innerHTML);
  const nextState = redoStack.pop();
  rightPage.innerHTML = nextState;
  reinitializeElements();
  updateButtons();
}

function updateButtons() {
  undoBtn.disabled = history.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function reinitializeElements() {
  // Reinitialize text boxes
  document.querySelectorAll('.text-box').forEach(textBox => {
    enableDragging(textBox);
    setupSelection(textBox);
    textBox.addEventListener('input', saveState);
  });

  // Reinitialize image frames
  document.querySelectorAll('.image-frame').forEach(container => {
    move(container);
  });

  // Reset selection
  selectedText = null;
  toolbar.style.display = 'none';
}

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
    e.preventDefault();
    redo();
  }
});


// -------- Text Boxes --------
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
    cursor: 'move'
  });
  rightPage.appendChild(textBox);

  enableDragging(textBox);
  setupSelection(textBox);
  textBox.addEventListener('input', saveState);
  updateButtons();
});

// -------- Selection & Toolbar --------
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
  toolbar.style.top = `${e.clientY - 60}px`;
  toolbar.style.left = `${e.clientX}px`;

  document.getElementById('fontSelect').value = (textBox.style.fontFamily || 'Arial').split(',')[0].trim();
  document.getElementById('fontSizeSelect').value = textBox.style.fontSize || '18px';
  document.getElementById('colorPicker').value = rgbToHex(textBox.style.color || '#000');
}

toolbar.addEventListener('click', e => e.stopPropagation());
document.addEventListener('click', () => {
  if (selectedText) selectedText.classList.remove('selected');
  toolbar.style.display = 'none';
  selectedText = null;
});

// -------- Toolbar Controls --------
document.getElementById('fontSelect').addEventListener('change', e => {
  if (selectedText) { saveState(); selectedText.style.fontFamily = e.target.value; }
});
document.getElementById('fontSizeSelect').addEventListener('change', e => {
  if (selectedText) { saveState(); selectedText.style.fontSize = e.target.value; }
});
document.getElementById('colorPicker').addEventListener('input', e => {
  if (selectedText) { saveState(); selectedText.style.color = e.target.value; }
});
document.getElementById('boldBtn').addEventListener('click', () => {
  if (selectedText) {
    saveState();
    selectedText.style.fontWeight = selectedText.style.fontWeight === 'bold' ? 'normal' : 'bold';
  }
});
document.getElementById('italicBtn').addEventListener('click', () => {
  if (selectedText) {
    saveState();
    selectedText.style.fontStyle = selectedText.style.fontStyle === 'italic' ? 'normal' : 'italic';
  }
});
document.getElementById('underlineBtn').addEventListener('click', () => {
  if (selectedText) {
    saveState();
    selectedText.style.textDecoration = selectedText.style.textDecoration === 'underline' ? 'none' : 'underline';
  }
});

// -------- Dragging for Text --------
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

// Image Button
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
function createImageBox(src){
  saveState();
  const container = document.createElement("div");
  container.classList.add("image-frame");
  container.style.left = "80px";
  container.style.top = "80px";

  const img = document.createElement("img");
  img.src = src;
  img.style.width = "200px";
  img.style.height = 'auto';
  img.style.display = "block";
  img.style.pointerEvents = "none";

  // creates a resize and rotate symbol for image
  const resize = document.createElement("div");
  resize.classList.add("resize");
  resize.textContent = "➘";

  const rotate = document.createElement("div");
  rotate.classList.add("rotate");
  rotate.textContent = "↺";

  container.appendChild(img);
  container.appendChild(resize);
  container.appendChild(rotate);
  rightPage.appendChild(container);

  move(container);
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

    // keeps image from squishing and updates the width and height
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

//Choose Paper Button
const choosePaperBtn = document.getElementById('choosePaperBtn');
const paperPicker = document.getElementById('paperPicker');
const paperOptions = document.querySelectorAll('.paper-option');
const leftPageEl = document.getElementById('leftPage');
const rightPageEl = document.getElementById('rightPage');

let selectedPaper = null;

// Toggle paper picker visibility
choosePaperBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  paperPicker.classList.toggle('show');
});

// Hide picker when clicking elsewhere
document.addEventListener('click', () => {
  paperPicker.classList.remove('show');
});

// Hover preview
paperOptions.forEach(option => {
  option.addEventListener('mouseenter', () => {
    const previewSrc = option.getAttribute('data-src');
    leftPageEl.style.backgroundImage = `url(${previewSrc})`;
    rightPageEl.style.backgroundImage = `url(${previewSrc})`;
    leftPageEl.style.backgroundSize = 'cover';
    rightPageEl.style.backgroundSize = 'cover';
  });

  option.addEventListener('mouseleave', () => {
    // revert to selected paper or none
    if (selectedPaper) {
      leftPageEl.style.backgroundImage = `url(${selectedPaper})`;
      rightPageEl.style.backgroundImage = `url(${selectedPaper})`;
    } else {
      leftPageEl.style.backgroundImage = 'none';
      rightPageEl.style.backgroundImage = 'none';
    }
  });

  // Click to select paper permanently
  option.addEventListener('click', () => {
    selectedPaper = option.getAttribute('data-src');
    leftPageEl.style.backgroundImage = `url(${selectedPaper})`;
    rightPageEl.style.backgroundImage = `url(${selectedPaper})`;
    leftPageEl.style.backgroundSize = 'cover';
    rightPageEl.style.backgroundSize = 'cover';
    paperPicker.classList.remove('show');
  });
});



// Initial save
saveState();
