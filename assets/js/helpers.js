

// Bulma alert modal
// example usage: bulmaAlert('Bounty Validation Error', 'Expiration date is required.', 'is-warning', () => { document.getElementById('bounty-expiration-date').focus(); });
function bulmaAlert(title, message, colorClass = 'is-info', onClose) {
  // Remove existing modal if present
  const existingModal = document.getElementById('bulma-alert-modal');
  if (existingModal) existingModal.remove();

  // Determine title text class
  const titleClass = colorClass === 'is-danger' ? 'has-text-white' : '';

  // Determine icon based on color class
  let icon;
  switch (colorClass) {
    case 'is-success':
      icon = 'check_circle';
      break;
    case 'is-danger':
      icon = 'info';
      break;
    case 'is-warning':
      icon = 'error';
      break;
    case 'is-info':
    default:
      icon = 'info';
      break;
  }

  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'modal is-active micro-5-regular p-6';
  modal.id = 'bulma-alert-modal';
//   modal.style.height = document.getElementById('screen-content').offsetHeight*2 + 'px';
  modal.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-card" style="max-width: 400px;">
      <header class="modal-card-head py-3 has-background-${colorClass.replace('is-', '')}">
        <p class="modal-card-title is-size-4 ${titleClass}">${title}</p>
      </header>
      <section class="modal-card-body is-flex is-align-items-center">
        <span class="material-symbols-outlined is-size-2 mr-4">${icon}</span><p class="is-size-5">${message}</p>
      </section>
      <footer class="modal-card-foot px-3 py-1" style="justify-content: flex-end;">
        <button class="button" id="bulma-alert-close">Close</button>
      </footer>
    </div>
  `;

  // append modal to screen-content
//   document.getElementById('screen-content').appendChild(modal);
  document.body.appendChild(modal);

  // Close modal on button or background click
  modal.querySelector('#bulma-alert-close').onclick = closeModal;
  modal.querySelector('.modal-background').onclick = closeModal;

  function closeModal() {
    modal.classList.remove('is-active');
    setTimeout(() => {
      modal.remove();
      if (typeof onClose === 'function') onClose();
    }, 300);
  }
}

// Bulma Confirm Modal
// example usage: bulmaConfirm('Delete Bounty', 'Are you sure you want to delete this bounty? This action cannot be undone.', 'is-danger', () => { console.log('Confirmed!'); });
function bulmaConfirm(title, message, colorClass = 'is-info', onConfirm, onCancel) {
  // Remove existing modal if present
  const existingModal = document.getElementById('bulma-confirm-modal');
  if (existingModal) existingModal.remove();

  // Determine title text class
  const titleClass = colorClass === 'is-danger' ? 'has-text-white' : '';

  // Determine icon based on color class
  let icon;
  switch (colorClass) {
    case 'is-danger':
      icon = 'warning';
      break;
    case 'is-warning':
      icon = 'error';
      break;
    case 'is-info':
    default:
      icon = 'help';
      break;
  }

  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'modal is-active';
  modal.id = 'bulma-confirm-modal';

  modal.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-card" style="width: 400px;">
      <header class="modal-card-head py-4 has-background-${colorClass.replace('is-', '')}">
        <p class="modal-card-title is-size-5 ${titleClass}">${title}</p>
      </header>
      <section class="modal-card-body is-flex is-align-items-center">
        <span class="material-symbols-outlined is-size-1 mr-4">${icon}</span><p>${message}</p>
      </section>
      <footer class="modal-card-foot px-3 py-1" style="justify-content: flex-end;">
        <button class="button is-light mr-2" id="bulma-confirm-cancel">Cancel</button>
        <button class="button ${colorClass}" id="bulma-confirm-ok">Confirm</button>
      </footer>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal on background or cancel
  modal.querySelector('.modal-background').onclick = closeModal;
  modal.querySelector('#bulma-confirm-cancel').onclick = () => {
    closeModal();
    if (typeof onCancel === 'function') onCancel();
  };

  // Confirm action
  modal.querySelector('#bulma-confirm-ok').onclick = () => {
    closeModal();
    if (typeof onConfirm === 'function') onConfirm();
  };

  function closeModal() {
    modal.classList.remove('is-active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}
