const firstDoor = document.getElementById("door-1");
const firstQuestion = {
  id: 1,
  question: "Hvilken dato feirer vi julaften i Norge?",
  options: ["23. desember", "24. desember", "25. desember", "26. desember"],
  correct_answer: "24. desember",
};

function openFirstDoor() {
  if (!firstDoor || firstDoor.classList.contains("open")) {
    return;
  }

  firstDoor.dataset.closedContent = firstDoor.innerHTML;
  firstDoor.classList.add("open");
  firstDoor.setAttribute("role", "group");
  firstDoor.removeAttribute("tabindex");
  firstDoor.textContent = "";

  const title = document.createElement("h2");
  title.textContent = "Luke " + firstQuestion.id;
  firstDoor.appendChild(title);

  const questionText = document.createElement("p");
  questionText.textContent = firstQuestion.question;
  firstDoor.appendChild(questionText);

  const result = document.createElement("p");
  result.className = "calendar-question-result";
  result.setAttribute("aria-live", "polite");

  const options = document.createElement("div");
  options.className = "calendar-question-options";
  const optionButtons = [];

  firstQuestion.options.forEach(function (answer) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", function () {
      if (answer === firstQuestion.correct_answer) {
        result.textContent = "Riktig!";
        optionButtons.forEach(function (optionButton) {
          optionButton.disabled = true;
        });
      } else {
        result.textContent = "Det var ikke riktig. Prøv igjen.";
      }
    });
    optionButtons.push(button);
    options.appendChild(button);
  });

  firstDoor.appendChild(options);
  firstDoor.appendChild(result);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "calendar-close-button";
  closeButton.dataset.closeDoor = "";
  closeButton.textContent = "Lukk luke";
  firstDoor.appendChild(closeButton);
}

if (firstDoor) {
  firstDoor.addEventListener("click", openFirstDoor);
  firstDoor.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFirstDoor();
    }
  });
}