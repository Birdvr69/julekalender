function closeDoor(door) {
  if (!door || !door.classList.contains("open")) {
    return;
  }

  door.innerHTML = door.dataset.closedContent || "";
  delete door.dataset.closedContent;
  door.classList.remove("open");
  door.setAttribute("role", "button");
  door.setAttribute("tabindex", "0");
}

document.addEventListener("click", function (event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const closeButton = target.closest("[data-close-door]");
  if (!closeButton) {
    return;
  }

  const door = closeButton.closest(".calendar-box");
  closeDoor(door);
});