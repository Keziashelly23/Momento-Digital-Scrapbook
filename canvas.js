const rightPage = document.getElementById("rightPage");
const addTextBtn = document.getElementById("addTextBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const fontPopup = document.getElementById("fontPopup");
const fontSizeInput = document.getElementById("fontSize");
const fontFamilySelect = document.getElementById("fontFamily");
const applyFontBtn = document.getElementById("applyFontBtn");
const cancelFontBtn = document.getElementById("cancelFontBtn");

let history = [];
let redoStack = [];

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

// Show font popup when T button is clicked
addTextBtn.addEventListener("click", () => {
  fontPopup.style.display = "flex";
});

// Apply font settings and add text box
applyFontBtn.addEventListener("click", () => {
  saveState();

  const textBox = document.createElement("div");
  textBox.contentEditable = true;
  textBox.textContent = "Double-click to edit text";
  textBox.classList.add("text-box");

  textBox.style.position = "absolute";
  textBox.style.left = "50px";
  textBox.style.top = "50px";
  textBox.style.padding = "6px 10px";
  textBox.style.background = "transparent";
  textBox.style.border = "none";
  textBox.style.cursor = "move";
  textBox.style.fontSize = `${fontSizeInput.value}px`;
  textBox.style.fontFamily = fontFamilySelect.value;

  makeDraggable(textBox);
  rightPage.appendChild(textBox);
  updateButtons();

  fontPopup.style.display = "none";
});

// Cancel font popup
cancelFontBtn.addEventListener("click", () => {
  fontPopup.style.display = "none";
});

// Drag functionality for text boxes
function makeDraggable(el) {
  let offsetX, offsetY, isDragging = false;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = 1000;
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      saveState();
      el.style.zIndex = "";
    }
  });
}

// Update font for selected text boxes
function updateSelectedTextBoxFont() {
  const selectedTextBox = document.querySelector(".text-box:focus");
  if (selectedTextBox) {
    saveState();
    selectedTextBox.style.fontSize = `${fontSizeInput.value}px`;
    selectedTextBox.style.fontFamily = fontFamilySelect.value;
  }
}

// Connect buttons
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// Font controls event listeners
fontSizeInput.addEventListener("input", updateSelectedTextBoxFont);
fontFamilySelect.addEventListener("change", updateSelectedTextBoxFont);

// Initial state save
saveState();
