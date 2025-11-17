// Make all stickers draggable
makeDraggable(document.querySelectorAll(".sticker"));

function makeDraggable(elements) {
  elements.forEach(elmnt => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const parent = document.getElementById("right-side");

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      // get initial mouse position
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();

      // Calculate new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      // Calculate new sticker position
      let newTop = elmnt.offsetTop - pos2;
      let newLeft = elmnt.offsetLeft - pos1;

      // Constrain inside #right-side
      const parentRect = parent.getBoundingClientRect();
      const elemRect = elmnt.getBoundingClientRect();

      // Boundaries
      if (newTop < 0) newTop = 0;
      if (newLeft < 0) newLeft = 0;

      if (newTop + elemRect.height > parent.clientHeight) {
        newTop = parent.clientHeight - elemRect.height;
      }

      if (newLeft + elemRect.width > parent.clientWidth) {
        newLeft = parent.clientWidth - elemRect.width;
      }

      // Apply movement
      elmnt.style.top = newTop + "px";
      elmnt.style.left = newLeft + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  });
}

