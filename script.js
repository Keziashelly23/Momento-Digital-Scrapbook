
//Landing Page functions
makeDraggable(document.querySelectorAll(".sticker"));

function makeDraggable(elements) {
  elements.forEach(elmnt => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const parent = elmnt.parentElement; // this is the #right-side div

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      let newTop = elmnt.offsetTop - pos2;
      let newLeft = elmnt.offsetLeft - pos1;

      // parent boundaries
      const parentRect = parent.getBoundingClientRect();
      const elemRect = elmnt.getBoundingClientRect();

      const minLeft = 0;
      const maxLeft = parent.clientWidth - elemRect.width;
      const minTop = 0;
      const maxTop = parent.clientHeight - elemRect.height;

      // keep inside parent
      if (newLeft < minLeft) newLeft = minLeft;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop < minTop) newTop = minTop;
      if (newTop > maxTop) newTop = maxTop;

      elmnt.style.top = newTop + "px";
      elmnt.style.left = newLeft + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  });
}

function handleCredentialResponse(response) {
  //Google sends the ID token in 'response .creditional'
  const credential = response.creditional;
}

function handleCredentialResponse(response) {
  console.log("login successful", response);
  localStorage.setItem("googleCredential", response.credential);

  window.location.href = "dashboard.html";
}





