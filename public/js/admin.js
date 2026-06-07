document.addEventListener('DOMContentLoaded', () => {
  initFeatureRows();
  initEditToggles();
});

function initFeatureRows() {
  document.querySelectorAll('[data-feature-list]').forEach((list) => {
    const addBtn = list.parentElement.querySelector('[data-add-feature]');
    if (addBtn) {
      addBtn.addEventListener('click', () => addFeatureRow(list));
    }
  });
}

function addFeatureRow(list) {
  const row = document.createElement('div');
  row.className = 'feature-row';
  row.innerHTML = `
    <input type="text" name="featureTexts[]" placeholder="Özellik metni">
    <label class="form-check">
      <input type="checkbox" name="featureIncluded[]" value="true" checked>
      Dahil
    </label>
    <button type="button" class="btn btn-danger btn-sm" data-remove-feature>Kaldır</button>
  `;
  list.appendChild(row);
  bindRemoveFeature(row);
}

function bindRemoveFeature(row) {
  const btn = row.querySelector('[data-remove-feature]');
  if (btn) {
    btn.addEventListener('click', () => row.remove());
  }
}

document.querySelectorAll('[data-remove-feature]').forEach((btn) => {
  btn.addEventListener('click', () => btn.closest('.feature-row').remove());
});

function initEditToggles() {
  document.querySelectorAll('[data-edit-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.editToggle;
      const form = document.getElementById(targetId);
      if (form) form.classList.toggle('open');
    });
  });
}
