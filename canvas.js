const rightPage = document.getElementById("rightPage");
const addTextBtn = document.getElementById("addTextBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const toolbar = document.getElementById('fontToolbar');
let selectedText = null;
const addImgBtn = document.getElementById("addImgBtn");
const imgFile = document.getElementById("imgFile");

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

// Functions to enable/disable editing
function enableEditing() {
  addTextBtn.style.display = 'inline-block';
  undoBtn.disabled = false;
  redoBtn.disabled = false;
}

function disableEditing() {
  addTextBtn.style.display = 'none';
  undoBtn.disabled = true;
  redoBtn.disabled = true;

  // Make existing text boxes read-only
  document.querySelectorAll(".text-box").forEach(box => {
    box.contentEditable = false;
  });
}

// Save current state
function saveState() {
  history.push(rightPage.innerHTML);
  redoStack = [];
  updateButtons();
}

// Undo function
function undo() {
  if (history.length > 0) {
    redoStack.push(rightPage.innerHTML);
    const prevState = history.pop();
    rightPage.innerHTML = prevState;
  }
  updateButtons();
}

// Redo function
function redo() {
  if (redoStack.length > 0) {
    history.push(rightPage.innerHTML);
    const nextState = redoStack.pop();
    rightPage.innerHTML = nextState;
  }
  updateButtons();
}

// Enable/disable buttons based on history
function updateButtons() {
  undoBtn.disabled = history.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

// Add new text box
addTextBtn.addEventListener('click', () => {
  saveState();

  const textBox = document.createElement('div');
  textBox.classList.add('text-box');
  textBox.contentEditable = true;
  textBox.textContent = 'Double-click to edit text';
  textBox.style.position = 'absolute';
  textBox.style.top = '100px';
  textBox.style.left = '100px';
  textBox.style.fontFamily = 'Arial';
  textBox.style.fontSize = '18px';
  textBox.style.color = '#000';
  textBox.style.padding = '6px 10px';
  textBox.style.background = 'transparent';
  textBox.style.border = 'none';
  textBox.style.cursor = 'move';
  rightPage.appendChild(textBox);

  enableDragging(textBox);
  setupSelection(textBox);
  updateButtons();
});

// Handle selecting text boxes
function setupSelection(textBox) {
  textBox.addEventListener('click', (e) => {
    e.stopPropagation();
    selectTextBox(textBox, e);
  });
}

// Select text box and show floating toolbar
function selectTextBox(textBox, e) {
  if (selectedText) selectedText.classList.remove('selected');
  selectedText = textBox;
  selectedText.classList.add('selected');

  toolbar.style.display = 'flex';
  toolbar.style.top = `${e.clientY - 60}px`;
  toolbar.style.left = `${e.clientX}px`;

  // Match toolbar values to current text
  document.getElementById('fontSelect').value = (textBox.style.fontFamily || 'Arial').split(',')[0].trim();
  document.getElementById('fontSizeSelect').value = textBox.style.fontSize || '18px';
  document.getElementById('colorPicker').value = rgbToHex(textBox.style.color || '#000');
}

// Prevent toolbar from hiding when clicking inside it
toolbar.addEventListener('click', (e) => {
  e.stopPropagation();
});

document.addEventListener('click', () => {
  if (selectedText) selectedText.classList.remove('selected');
  toolbar.style.display = 'none';
  selectedText = null;
});

// Toolbar controls
document.getElementById('fontSelect').addEventListener('change', (e) => {
  if (selectedText) {
    saveState();
    selectedText.style.fontFamily = e.target.value;
  }
});

document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
  if (selectedText) {
    saveState();
    selectedText.style.fontSize = e.target.value;
  }
});

document.getElementById('colorPicker').addEventListener('input', (e) => {
  if (selectedText) {
    saveState();
    selectedText.style.color = e.target.value;
  }
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

// Dragging functionality
function enableDragging(el) {
  let isDragging = false;
  let offsetX, offsetY;

  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    e.preventDefault(); // prevent text selection
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      saveState();
      isDragging = false;
    }
  });
}

// Convert rgb() to hex
function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return '#000000';
  return `#${match.map(x => (+x).toString(16).padStart(2, '0')).join('')}`;
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

// Initial state save
saveState();