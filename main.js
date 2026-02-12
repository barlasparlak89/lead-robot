const form = document.getElementById("leadForm");
const successMessage = document.getElementById("successMessage");
const formError = document.getElementById("formError");

const validators = {
  fullName: (value) => value.trim().length >= 3,
  email: (value) => /\S+@\S+\.\S+/.test(value),
  phone: (value) => value.trim().length >= 6,
  lossAmount: (value) => Number(value) >= 0,
  lossWhere: (value) => value.trim().length >= 2,
};

const errorMessages = {
  fullName: "Inserisci nome e cognome.",
  email: "Inserisci un indirizzo email valido.",
  phone: "Inserisci un numero di telefono valido.",
  lossAmount: "Inserisci un importo valido.",
  lossWhere: "Indica dove è avvenuta la perdita.",
};

const setError = (field, message) => {
  const error = document.querySelector(`[data-error-for="${field}"]`);
  if (error) {
    error.textContent = message || "";
  }
};

const validateField = (field) => {
  const input = form.elements[field];
  if (!input) return true;
  const isValid = validators[field](input.value);
  setError(field, isValid ? "" : errorMessages[field]);
  return isValid;
};

const validateForm = () => {
  return Object.keys(validators).every(validateField);
};

form.addEventListener("input", (event) => {
  if (validators[event.target.name]) {
    validateField(event.target.name);
  }
});

const submitLead = async (payload) => {
  const response = await fetch("/api/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Errore di invio");
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (formError) {
    formError.hidden = true;
  }

  const honeypot = form.elements.company;
  if (honeypot && honeypot.value) {
    return;
  }

  const consent = form.elements.consent;
  if (!consent.checked) {
    consent.focus();
    return;
  }

  if (!validateForm()) {
    return;
  }

  const payload = {
    fullName: form.elements.fullName.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    lossAmount: form.elements.lossAmount.value.trim(),
    lossWhere: form.elements.lossWhere.value.trim(),
    notes: form.elements.notes.value.trim(),
  };

  try {
    await submitLead(payload);
    form.reset();
    successMessage.hidden = false;
    successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    if (formError) {
      formError.textContent = error.message;
      formError.hidden = false;
    }
  }
});
