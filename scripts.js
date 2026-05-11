document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const fmtPLN = (v) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format((+v) || 0);
  const fmtNum = (v, digits = 2) => new Intl.NumberFormat('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format((+v) || 0);
  const round2 = (n) => Math.round((+n + Number.EPSILON) * 100) / 100;
  const parsePL = (s) => {
    if (typeof s !== 'string') s = String(s ?? '');
    return parseFloat(s.replace(/\u00A0/g, ' ').replace(/\s/g, '').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  };


  const clientType = $('clientType');
  const clientNipLabel = $('clientNipLabel');
  const LICENSE_KEYS = [
    'A7K9P2',
    'X4D8QW',
    'L2M7RT',
    'P9Z3XC',
    'N8V5BH',
    'Q1W2E3',
    'R4T5Y6',
    'U7I8O9',
    'S3D4F5',
    'G6H7J8',
    'K9L1Z2',
    'X3C4V5',
    'B6N7M8',
    'T1Y2U3',
    'I4O5P6',
    'A1S2D3',
    'F4G5H6',
    'J7K8L9',
    'Z1X2C3',
    'V4B5N6'
  ];

  const generateBtn = $('generatePDF');

  function enablePremium() {
    localStorage.setItem('premium_access', 'true');

    if (generateBtn) {
      generateBtn.style.display = 'inline-block';
    }

    const activateBtn = $('activateLicense');

    if (activateBtn) {
      activateBtn.style.display = 'none';
    }
  }

  function askForLicense() {
    const key = prompt('Wpisz kod aktywacyjny:');

    if (!key) return;

    if (LICENSE_KEYS.includes(key.trim().toUpperCase())) {
      enablePremium();
      alert('Aktywacja premium zakończona pomyślnie.');
    } else {
      alert('Nieprawidłowy kod.');
    }
  }

  if (localStorage.getItem('premium_access') === 'true') {
    enablePremium();
  }
  $('activateLicense')?.addEventListener('click', askForLicense);

  const itemsBody = $('itemsBody');
  const addRowBtn = $('addRowBtn');
  const clearRowsBtn = $('clearRowsBtn');

  const sumNetEl = $('sumNet');
  const sumVATEl = $('sumVAT');
  const sumGrossEl = $('sumGross');
  const vatTypeEl = $('vatType');

  const logoFile = $('logoFile');
  const logoImg = $('logoImg');

  if (clientType && clientNipLabel) {
    clientType.addEventListener('change', () => {
      clientNipLabel.style.display = clientType.value === 'company' ? '' : 'none';
    });
    clientType.dispatchEvent(new Event('change'));
  }

  function addRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="right lp"></td>
      <td><input type="text" class="itemName" value="${data.name || ''}"></td>
      <td><input type="text" class="itemUnit" value="${data.unit || 'szt.'}"></td>
      <td><input type="number" class="itemQty" min="0" step="0.01" value="${data.qty || 1}"></td>
      <td><input type="number" class="itemNet" min="0" step="0.01" value="${data.net || 0}"></td>
      <td><input type="number" class="itemVat" min="0" step="1" value="${data.vat ?? 23}"></td>
      <td class="right netTotal">0,00 zł</td>
      <td class="right vatTotal">0,00 zł</td>
      <td class="right grossTotal">0,00 zł</td>
      <td class="right"><button class="danger" type="button">Usuń</button></td>
    `.trim();
    itemsBody.appendChild(tr);
    bindRow(tr);
    renumber();
    recalcRow(tr);
    recalcTotals();
  }

  function renumber() {
    [...itemsBody.querySelectorAll('tr')].forEach((tr, i) => tr.querySelector('.lp').textContent = (i + 1) + '.');
  }

  function bindRow(tr) {
    tr.addEventListener('input', () => { recalcRow(tr); recalcTotals(); });
    tr.querySelector('button.danger').addEventListener('click', () => { tr.remove(); renumber(); recalcTotals(); });
  }

  function recalcRow(tr) {
    const qty = parseFloat(tr.querySelector('.itemQty').value) || 0;
    const net = parseFloat(tr.querySelector('.itemNet').value) || 0;
    const vatR = parseFloat(tr.querySelector('.itemVat').value) || 0;
    const netTotal = round2(qty * net);
    const isVatExempt = vatTypeEl?.value !== '';
    const vatTotal = isVatExempt ? 0 : round2(netTotal * (vatR / 100));
    const grossTotal = round2(netTotal + vatTotal);
    tr.querySelector('.netTotal').textContent = fmtPLN(netTotal);
    tr.querySelector('.vatTotal').textContent = fmtPLN(vatTotal);
    tr.querySelector('.grossTotal').textContent = fmtPLN(grossTotal);
  }

  function recalcTotals() {
    let sNet = 0, sVat = 0, sGross = 0;
    [...itemsBody.querySelectorAll('tr')].forEach(tr => {
      sNet += parsePL(tr.querySelector('.netTotal').textContent);
      sVat += parsePL(tr.querySelector('.vatTotal').textContent);
      sGross += parsePL(tr.querySelector('.grossTotal').textContent);
    });
    sumNetEl.textContent = fmtPLN(sNet);
    sumVATEl.textContent = fmtPLN(sVat);
    sumGrossEl.textContent = fmtPLN(sGross);
  }

  if (addRowBtn) addRowBtn.addEventListener('click', () => addRow());
  if (clearRowsBtn) clearRowsBtn.addEventListener('click', () => { itemsBody.innerHTML = ''; recalcTotals(); });
  addRow({ vat: 23 });

  let logoDataURL = '';
  if (logoFile && logoImg) {
    logoFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) { logoDataURL = ''; logoImg.style.display = 'none'; logoImg.src = ''; return; }
      const reader = new FileReader();
      reader.onload = () => { logoDataURL = reader.result; logoImg.src = logoDataURL; logoImg.style.display = 'block'; };
      reader.readAsDataURL(file);
    });
  }

  function writeText(id, val, dash = '—') {
    const el = $(id);
    if (el) el.textContent = (val && String(val).trim()) ? val : dash;
  }

  function formatDateForPrint(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(+d)) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function slowniePL(amount) {
    const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
    const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
    const tens = ['', 'dziesięć', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
    const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];
    const groups = [['złoty', 'złote', 'złotych'], ['tysiąc', 'tysiące', 'tysięcy'], ['milion', 'miliony', 'milionów'], ['miliard', 'miliardy', 'miliardów']];
    const plural = (n, f) => (n === 1 ? f[0] : (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? f[1] : f[2]));
    const trip = (n) => {
      let s = '', h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
      if (h) s += hundreds[h] + ' ';
      if (t === 1) s += teens[u];
      else { if (t) s += tens[t] + ' '; if (u) s += units[u]; }
      return s.trim();
    };
    const zl = Math.floor(amount);
    const gr = Math.round((amount - zl) * 100);
    if (zl === 0) return `zero złotych ${String(gr).padStart(2, '0')}/100`;
    const parts = [];
    let num = zl, i = 0;
    while (num > 0 && i < groups.length) {
      const tr = num % 1000;
      if (tr) {
        let w = trip(tr);
        if (i === 1 && tr === 1) w = groups[i][0];
        else w = w + ' ' + plural(tr, groups[i]);
        parts.unshift(w.trim());
      }
      num = Math.floor(num / 1000);
      i++;
    }
    return `${parts.join(' ')} ${String(gr).padStart(2, '0')}/100`;
  }

  function buildPrintTable() {
    const tbody = $('printItemsBody');
    tbody.innerHTML = '';
    const rows = [...itemsBody.querySelectorAll('tr')];
    rows.forEach((tr, i) => {
      const name = tr.querySelector('.itemName').value || '—';
      const unit = tr.querySelector('.itemUnit').value || '—';
      const qty = parseFloat(tr.querySelector('.itemQty').value) || 0;
      const net = parseFloat(tr.querySelector('.itemNet').value) || 0;
      const vatR = parseFloat(tr.querySelector('.itemVat').value) || 0;

      const netTotal = round2(qty * net);
      const vatTotal = vatTypeEl?.value !== '' ? 0 : round2(netTotal * vatR / 100);
      const grossTotal = round2(netTotal + vatTotal);

      const trp = document.createElement('tr');
      trp.innerHTML = `
        <td class="ta-right">${i + 1}.</td>
        <td>${name}</td>
        <td>${unit}</td>
        <td class="ta-right">${fmtNum(qty)}</td>
        <td class="ta-right col-price">${fmtPLN(net)}</td>
        <td class="ta-right col-value">${fmtPLN(netTotal)}</td>
        <td class="ta-right col-net">${fmtPLN(netTotal)}</td>
        <td class="ta-right col-vat">${fmtNum(vatR, 0)}%</td>
        <td class="ta-right col-vat-amt">${fmtPLN(vatTotal)}</td>
        <td class="ta-right col-gross">${fmtPLN(grossTotal)}</td>
      `.trim();
      tbody.appendChild(trp);
    });
  }

  function fillPrint() {
    const sel = (id) => $(id);
    writeText('pNumber', $('invoiceNumber').value);
    writeText('pIssueDate', formatDateForPrint($('issueDate').value));
    writeText('pSaleDate', formatDateForPrint($('saleDate').value));

    writeText('pSellerName', $('sellerName').value);
    writeText('pSellerAddress', $('sellerAddress').value);
    writeText('pSellerNIP', $('sellerNIP').value);

    writeText('pClientName', $('clientName').value);
    writeText('pClientAddress', $('clientAddress').value);
    const cNIP = $('clientNIP').value;
    const cNipRow = $('pClientNipRow');
    if (clientType?.value === 'company' && cNIP.trim() !== '') {
      $('pClientNIP').textContent = cNIP;
      cNipRow.style.display = '';
    } else {
      cNipRow.style.display = 'none';
    }

    buildPrintTable();

    sel('pSumNet').textContent = sumNetEl.textContent;
    sel('pSumVAT').textContent = sumVATEl.textContent;
    sel('pSumGross').textContent = sumGrossEl.textContent;
    sel('pToPay').textContent = sumGrossEl.textContent;

    writeText('pPaymentMethod', $('paymentMethod').value);
    writeText('pDueDate', formatDateForPrint($('dueDate').value));
    writeText('pPaid', $('paid').value);
    writeText('pBank', $('bankName').value);
    writeText('pIBAN', $('iban').value);

    const notes = $('notes').value.trim();
    $('pNotes').textContent = notes || '—';

    const printRoot = $('invoicePrint');
    if (vatTypeEl?.value !== '') {
      printRoot.classList.add('vat-exempt');
      const vatNotes = {
        art113: 'Zwolniony z VAT na podstawie art. 113 ust. 1 i 9 ustawy o VAT.',
        art43: 'Zwolnienie z VAT na podstawie art. 43 ust. 1 ustawy o VAT.',
      };

      $('pVatNote').textContent = vatNotes[vatTypeEl.value] || '';
      $('pVatNote').style.display = '';
    } else {
      printRoot.classList.remove('vat-exempt');
      $('pVatNote').style.display = 'none';
    }

    if (logoDataURL) {
      logoImg.src = logoDataURL;
      logoImg.style.display = 'block';
    } else {
      logoImg.style.display = 'none';
    }

    const grossVal = parsePL(sumGrossEl.textContent);
    $('pInWords').textContent = slowniePL(grossVal);
  }

  $('refreshPreview')?.addEventListener('click', () => {
    recalcTotals();
    fillPrint();
    scalePreview();
  });
  itemsBody.addEventListener('input', recalcTotals);
  vatTypeEl?.addEventListener('change', () => {
    const isExempt = vatTypeEl.value !== '';

    itemsBody.querySelectorAll('.itemVat').forEach(iv => {
      if (isExempt) {
        iv.dataset.prevVat ??= iv.value || '23';
        iv.value = '0';
      } else {
        iv.value = iv.dataset.prevVat || '23';
        delete iv.dataset.prevVat;
      }
    });

    [...itemsBody.querySelectorAll('tr')].forEach(recalcRow);
    recalcTotals();
  });

  $('generatePDF')?.addEventListener('click', async () => {
    recalcTotals();
    fillPrint();

    const source = document.getElementById('invoicePrint');
    if (!source) { alert('Nie znaleziono sekcji do druku (#invoicePrint).'); return; }

    async function ensure(url, test) {
      if (test()) return true;
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
      });
      return !!test();
    }
    const ok1 = await ensure('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', () => window.html2canvas);
    const ok2 = await ensure('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', () => window.jspdf && window.jspdf.jsPDF);
    if (!ok1 || !ok2) { alert('Nie udało się wczytać html2canvas/jsPDF.'); return; }

    try { if (document.fonts?.ready) await document.fonts.ready; } catch (_) { }
    const imgs = Array.from(source.querySelectorAll('img')).filter(i => !i.complete);
    await Promise.all(imgs.map(img => new Promise(res => { img.onload = img.onerror = () => res(); })));

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const PX_TO_MM = 0.264583;
    const MM_TO_IN = 1 / 25.4;
    const marginX = 20 * PX_TO_MM;
    const marginTop = 30 * PX_TO_MM;
    const marginBottom = 30 * PX_TO_MM;
    const contentW = pageW - 2 * marginX;
    const contentH = pageH - marginTop - marginBottom;

    const DPI_TARGET = 400;
    const cssWidth = Math.ceil(source.getBoundingClientRect().width || source.scrollWidth || source.offsetWidth || 800);
    const targetPxWidth = Math.round(contentW * MM_TO_IN * DPI_TARGET);
    let scale = targetPxWidth / cssWidth;
    scale = Math.max(1.5, Math.min(3, scale));

    const canvas = await window.html2canvas(source, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      scrollX: 0, scrollY: 0,
      windowWidth: 1280
    });

    const mmPerPx = contentW / canvas.width;
    const pageSlicePx = Math.floor(contentH / mmPerPx);

    const sliceCanvas = document.createElement('canvas');
    const sliceCtx = sliceCanvas.getContext('2d');

    const JPEG_QUALITY = 0.80;

    let sy = 0, pageIndex = 0;
    while (sy < canvas.height) {
      const sliceH = Math.min(pageSlicePx, canvas.height - sy);
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;

      sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      sliceCtx.drawImage(canvas, 0, sy, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const dataUrl = sliceCanvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const sliceH_mm = sliceH * mmPerPx;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(dataUrl, 'JPEG', marginX, marginTop, contentW, sliceH_mm);

      sy += sliceH;
      pageIndex += 1;
    }

    const number = (document.getElementById('invoiceNumber')?.value || 'faktura').replace(/[^\dA-Za-z_-]+/g, '_');
    pdf.save(`Faktura-${number}.pdf`);
  });


});


function scalePreview() {
  const el = document.getElementById('invoicePrint');
  if (!el) return;

  const screenWidth = window.innerWidth;
  const a4WidthMm = 210;
  const a4WidthPx = a4WidthMm * 3.78;
  const availableWidth = screenWidth - 32;

  if (screenWidth <= 600) {
    const scale = Math.min(1, availableWidth / a4WidthPx);
    el.style.transform = `scale(${scale})`;
  } else if (screenWidth <= 768) {
    const scale = availableWidth / a4WidthPx;
    el.style.transform = `scale(${scale})`;
  } else {
    el.style.transform = 'none';
  }
}

window.addEventListener('resize', scalePreview);
window.addEventListener('DOMContentLoaded', scalePreview);
