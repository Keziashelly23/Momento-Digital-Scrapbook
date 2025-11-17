
function savePage() {
  if (!currentUser) return alert("Please sign in to save.");
  const pageId = document.getElementById("pageSelector").value;
  const layout = {
    images: imagesOnCanvas.map(img => ({
      src: img.src, x: img.x, y: img.y, width: img.width, height: img.height
    })),
    texts: textItems.map(text => ({
      content: text.content, x: text.x, y: text.y,
      fontSize: text.fontSize, color: text.color
    }))
  };
  db.collection("users").doc(currentUser.uid).collection("scrapbook").doc(pageId)
    .set({ layout })
    .then(() => alert("✅ Page saved!"))
    .catch(err => console.error("❌ Save failed:", err));
}

function loadPage() {
  if (!currentUser) return alert("Please sign in to load.");
  const pageId = document.getElementById("pageSelector").value;
  db.collection("users").doc(currentUser.uid).collection("scrapbook").doc(pageId)
    .get()
    .then(doc => {
      const data = doc.data();
      if (!data) return;
      imagesOnCanvas = [];
      textItems = [];
      data.layout.images.forEach(imgData => {
        const img = new Image();
        img.onload = () => {
          imagesOnCanvas.push({ ...imgData, img });
          redrawCanvas();
        };
        img.src = imgData.src;
      });
      textItems = data.layout.texts;
      redrawCanvas();
    });
}

function loadUserPages() {
  const selector = document.getElementById("pageSelector");
  selector.innerHTML = "";
  db.collection("users").doc(currentUser.uid).collection("scrapbook")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = doc.id;
        selector.appendChild(option);
      });
    });
}

function createNewPage() {
  const newId = prompt("Enter new page name:");
  if (!newId || !currentUser) return;
  db.collection("users").doc(currentUser.uid).collection("scrapbook").doc(newId)
    .set({ layout: { images: [], texts: [] } })
    .then(() => {
      loadUserPages();
      document.getElementById("pageSelector").value = newId;
      loadPage();
    });
}

function deletePage() {
  const pageId = document.getElementById("pageSelector").value;
  if (!pageId || !currentUser) return;
  if (confirm(`Delete page "${pageId}"?`)) {
    db.collection("users").doc(currentUser.uid).collection("scrapbook").doc(pageId)
      .delete()
      .then(() => {
        alert("🗑️ Page deleted");
        loadUserPages();
      });
  }
}

function exportToPNG() {
  const canvas = document.getElementById("scrapCanvas");
  const link = document.createElement("a");
  link.download = "scrapbook.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
