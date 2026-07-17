/* ============================================================
   PDF Page Printer – Application Logic
   ============================================================ */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const state = {
  pdfFile: null,
  pdfBytes: null,
  pdfDoc: null,
  fileName: "",
  numPages: 0,
  scale: 1.2,
  rotation: 0,
  currentPage: 1,
  theme: "light",
  footer: {
    enabled: true,
    position: "center",
    style: "Page 1",
    customFmt: "Page {n} of {total}",
    fontFamily: "Helvetica",
    fontSize: 11,
    fontColor: "#000000",
    bold: false,
    italic: false,
    marginBottom: 30
  },
  print: {
    orientation: "portrait",
    paperSize: "a4",
    margins: 20,
    scaling: "fit",
    pages: "all",
    range: "",
    copies: 1,
    currentPage: 1
  }
};

const PAPER = {
  a4: [595.28, 841.89],
  a3: [841.89, 1190.55],
  letter: [612, 792],
  legal: [612, 1008]
};

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const toast = (msg) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove("show"), 2200);
};
const showLoading = v => $("loading").classList.toggle("show", v);
const fmtSize = b => {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b/1024).toFixed(1) + " KB";
  return (b/1048576).toFixed(2) + " MB";
};



/* ---------- File import ---------- */
const fileInput = $("fileInput");
$("btnImport").addEventListener("click", () => { fileInput.value = ""; fileInput.click(); });
$("btnNew").addEventListener("click", () => { fileInput.value = ""; fileInput.click(); });
fileInput.addEventListener("change", e => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

const dz = $("dropzone");
dz.addEventListener("click", () => { fileInput.value = ""; fileInput.click(); });
["dragenter","dragover"].forEach(ev =>
  dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
["dragleave","drop"].forEach(ev =>
  dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
dz.addEventListener("drop", e => {
  const f = e.dataTransfer.files[0];
  if (f && f.type === "application/pdf") loadFile(f);
  else toast("Please drop a PDF file");
});

async function loadFile(file) {
  showLoading(true);
  try {
    state.pdfFile = file;
    state.pdfBytes = null; // Clear any old bytes
    state.fileName = file.name;
    
    // Use object URL for fast loading by pdf.js without reading entire file to JS memory upfront
    const fileUrl = URL.createObjectURL(file);
    state.pdfDoc = await pdfjsLib.getDocument(fileUrl).promise;
    
    state.numPages = state.pdfDoc.numPages;
    state.currentPage = 1;
    state.rotation = 0;

    $("infoName").textContent = file.name;
    $("infoSize").textContent = fmtSize(file.size);
    $("infoPages").textContent = state.numPages;
    $("fileInfo").style.display = "flex";

    dz.style.display = "none";
    ["btnZoomIn","btnZoomOut","btnFitWidth","btnFitPage",
     "btnRotLeft","btnRotRight","btnPreview",
     "btnPrint","btnNew","btnPrintBig","btnDownload", "btnMGlass"].forEach(id => $(id).disabled = false);

    await renderAllPages();
    updateIndicator();
    toast("PDF loaded: " + state.numPages + " pages");
  } catch (err) {
    console.error(err);
    toast("Failed to load PDF");
  } finally {
    showLoading(false);
  }
}

/* ---------- Rendering ---------- */
let pageObserver = null;
const activeRenders = new Map();

async function renderPageCanvas(box) {
  const pageNum = parseInt(box.dataset.page);
  if (activeRenders.has(pageNum)) return;
  
  const renderTaskObj = {};
  activeRenders.set(pageNum, renderTaskObj);
  
  try {
    const page = await state.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: state.scale, rotation: state.rotation });
    
    // Update box dimensions to actual page size dynamically
    box.style.width = viewport.width + "px";
    box.style.height = viewport.height + "px";
    
    if (!box.dataset.rendered) {
      activeRenders.delete(pageNum);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    box.insertBefore(canvas, box.firstChild);

    const ctx = canvas.getContext("2d");
    const renderTask = page.render({ canvasContext: ctx, viewport });
    renderTaskObj.task = renderTask;
    
    await renderTask.promise;
    
    if (mGlassMode > 0 && !magAnimFrame) {
      magAnimFrame = requestAnimationFrame(() => { updateMagnifier(); magAnimFrame = null; });
    }
  } catch (err) {
    if (err.name !== 'RenderingCancelledException') {
      console.error("Render error on page " + pageNum, err);
    }
  } finally {
    activeRenders.delete(pageNum);
  }
}

async function renderAllPages() {
  const viewer = $("viewer");
  const keep = viewer.querySelector(".dropzone");
  viewer.innerHTML = "";
  if (keep) viewer.appendChild(keep);

  if (pageObserver) {
    pageObserver.disconnect();
  }
  
  pageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const box = entry.target;
      if (entry.isIntersecting) {
        if (!box.dataset.rendered) {
          box.dataset.rendered = "true";
          renderPageCanvas(box);
        }
      } else {
        if (box.dataset.rendered) {
           box.dataset.rendered = "";
           const pageNum = parseInt(box.dataset.page);
           const activeObj = activeRenders.get(pageNum);
           if (activeObj && activeObj.task) {
             activeObj.task.cancel();
           }
           const canvas = box.querySelector("canvas");
           if (canvas) {
             canvas.width = 0; canvas.height = 0;
             canvas.remove();
           }
        }
      }
    });
  }, {
    root: viewer,
    rootMargin: '100% 0px 100% 0px',
    threshold: 0
  });

  // Optimize initialization by assuming all pages are roughly the same size as the first page
  // The actual sizes will be updated when the page is rendered
  let firstViewport = null;
  if (state.numPages > 0) {
    const firstPage = await state.pdfDoc.getPage(1);
    firstViewport = firstPage.getViewport({ scale: state.scale, rotation: state.rotation });
  }

  // Use a document fragment for faster DOM insertion
  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= state.numPages; i++) {
    const box = document.createElement("div");
    box.className = "page-box";
    box.dataset.page = i;
    if (firstViewport) {
      box.style.width = firstViewport.width + "px";
      box.style.height = firstViewport.height + "px";
    }

    const ov = document.createElement("div");
    ov.className = "page-number-overlay";
    box.appendChild(ov);

    fragment.appendChild(box);
    pageObserver.observe(box);
  }
  
  viewer.appendChild(fragment);
  
  applyFooterPreview();
}

function updateIndicator() {
  const el = $("pageIndicator");
  if (el) {
    el.textContent = state.pdfDoc
      ? `Page ${state.currentPage} of ${state.numPages}`
      : "No PDF loaded";
  }
}

/* Track current page on scroll */
$("viewer").addEventListener("scroll", () => {
  if (!state.pdfDoc) return;
  const boxes = document.querySelectorAll(".page-box");
  const viewerTop = $("viewer").getBoundingClientRect().top;
  let current = 1;
  boxes.forEach(b => {
    const r = b.getBoundingClientRect();
    if (r.top < viewerTop + 150) current = parseInt(b.dataset.page);
  });
  if (current !== state.currentPage) {
    state.currentPage = current;
    updateIndicator();
    $("currentPage").value = current;
  }
});

/* ---------- Zoom / Rotate ---------- */
$("btnZoomIn").addEventListener("click", () => {
  if (typeof mGlassMode !== 'undefined' && mGlassMode > 0) {
    magZoom = Math.min(4.0, magZoom + 0.2);
    updateMagnifier();
  } else {
    state.scale = Math.min(4, state.scale + 0.2); renderAllPages();
  }
});
$("btnZoomOut").addEventListener("click", () => {
  if (typeof mGlassMode !== 'undefined' && mGlassMode > 0) {
    magZoom = Math.max(1.0, magZoom - 0.2);
    updateMagnifier();
  } else {
    state.scale = Math.max(0.4, state.scale - 0.2); renderAllPages();
  }
});
$("btnFitWidth").addEventListener("click", () => fitTo("width"));
$("btnFitPage").addEventListener("click", () => fitTo("page"));
$("btnRotLeft").addEventListener("click", () => { state.rotation = (state.rotation - 90) % 360; renderAllPages(); });
$("btnRotRight").addEventListener("click", () => { state.rotation = (state.rotation + 90) % 360; renderAllPages(); });

async function fitTo(mode) {
  if (!state.pdfDoc) return;
  const page = await state.pdfDoc.getPage(1);
  const vp = page.getViewport({ scale: 1, rotation: state.rotation });
  const viewer = $("viewer");
  const availW = viewer.clientWidth - 60;
  const availH = viewer.clientHeight - 60;
  let s = availW / vp.width;
  if (mode === "page") s = Math.min(s, availH / vp.height);
  state.scale = Math.max(0.3, Math.min(4, s));
  renderAllPages();
}

/* ---------- Touch gestures (pinch zoom) ---------- */
let pinchStart = 0, startScale = 1;
const viewer = $("viewer");
viewer.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    pinchStart = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    startScale = state.scale;
  }
}, { passive: true });
viewer.addEventListener("touchmove", e => {
  if (e.touches.length === 2) {
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const ratio = d / pinchStart;
    state.scale = Math.max(0.4, Math.min(4, startScale * ratio));
  }
}, { passive: true });
viewer.addEventListener("touchend", e => {
  if (e.touches.length < 2 && pinchStart > 0) {
    pinchStart = 0;
    renderAllPages();
  }
});

/* ---------- Footer settings UI ---------- */
function bindSeg(id, key) {
  const seg = $(id);
  seg.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      seg.querySelectorAll("button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      state.footer[key] = b.dataset.val;
      applyFooterPreview();
    });
  });
}
bindSeg("quickPos", "position");

const adjState = { brightness: 100, contrast: 100, darkness: 0, darktext: 100 };
let currentAdj = "brightness";
const adjConfig = {
  brightness: { min: 0, max: 200, def: 100 },
  contrast: { min: 0, max: 200, def: 100 },
  darkness: { min: 0, max: 100, def: 0 },
  darktext: { min: 0, max: 200, def: 100 }
};

function applyAdjustments() {
  const viewer = $("viewer");
  viewer.style.setProperty("--adj-brightness", adjState.brightness + "%");
  viewer.style.setProperty("--adj-contrast", adjState.contrast + "%");
  viewer.style.setProperty("--adj-darkness", adjState.darkness + "%");
  viewer.style.setProperty("--adj-darktext", adjState.darktext + "%");
}

$("adjType").querySelectorAll("button").forEach(b => {
  b.addEventListener("click", () => {
    $("adjType").querySelectorAll("button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    currentAdj = b.dataset.val;
    const slider = $("adjSlider");
    slider.min = adjConfig[currentAdj].min;
    slider.max = adjConfig[currentAdj].max;
    slider.value = adjState[currentAdj];
  });
});

$("adjSlider").addEventListener("input", (e) => {
  adjState[currentAdj] = e.target.value;
  applyAdjustments();
});

$("quickBg").querySelectorAll("button").forEach(b => {
  b.addEventListener("click", () => {
    $("quickBg").querySelectorAll("button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    
    const val = b.dataset.val;
    const viewer = $("viewer");
    viewer.classList.remove("pdf-bg-white", "pdf-bg-black", "pdf-bg-dim", "pdf-bg-yellow");
    viewer.classList.add("pdf-bg-" + val);
  });
});

$("quickEnable").addEventListener("change", e => {
  state.footer.enabled = e.target.checked;
  applyFooterPreview();
});
$("quickStyle").addEventListener("change", e => {
  state.footer.style = e.target.value;
  $("customFmtWrap").style.display = e.target.value === "custom" ? "" : "none";
  applyFooterPreview();
});
$("customFmt").addEventListener("input", e => {
  state.footer.customFmt = e.target.value;
  applyFooterPreview();
});
["fontFamily","fontSize","fontColor","fontBold","fontItalic","marginBottom"].forEach(id => {
  $(id).addEventListener("input", e => {
    const v = e.target.type === "checkbox" ? e.target.checked
          : (e.target.type === "number" || e.target.type === "range" ? parseFloat(e.target.value) : e.target.value);
    const map = {
      fontFamily:"fontFamily", fontSize:"fontSize", fontColor:"fontColor",
      fontBold:"bold", fontItalic:"italic", marginBottom:"marginBottom"
    };
    state.footer[map[id]] = v;
    if (id === "marginBottom") $("marginVal").textContent = v;
    applyFooterPreview();
  });
});


/* ---------- Format page number text (FIXED for 100+ pages) ---------- */
function formatPageNumber(n, total) {
  if (!state.footer.enabled) return "";
  const s = state.footer.style;
  const nStr = String(n);
  const nPad = nStr.padStart(2, "0");
  const totalStr = String(total);

  switch (s) {
    case "1":
      return nStr;
    case "01":
      return nPad;
    case "Page 1":
      return "Page " + nStr;
    case "Page 1 of 25":
      return "Page " + nStr + " of " + totalStr;
    case "1 / 25":
      return nStr + " / " + totalStr;
    case "custom":
      return state.footer.customFmt
        .split("{total}").join(totalStr)
        .split("{n}").join(nStr);
    default:
      return nStr;
  }
}

/* ---------- Live footer preview (HTML overlay) ---------- */
function applyFooterPreview() {
  const boxes = document.querySelectorAll(".page-box");
  boxes.forEach(box => {
    const ov = box.querySelector(".page-number-overlay");
    if (!state.footer.enabled) { ov.textContent = ""; return; }
    const n = parseInt(box.dataset.page);
    const text = formatPageNumber(n, state.numPages);
    ov.textContent = text;

    ov.style.fontSize = state.footer.fontSize + "px";
    ov.style.fontFamily = state.footer.fontFamily === "TimesRoman" ? "Times New Roman, serif"
                        : state.footer.fontFamily === "Courier" ? "Courier New, monospace"
                        : "Helvetica, Arial, sans-serif";
    ov.style.color = state.footer.fontColor;
    ov.style.fontWeight = state.footer.bold ? "bold" : "normal";
    ov.style.fontStyle = state.footer.italic ? "italic" : "normal";
    ov.style.bottom = (state.footer.marginBottom / state.scale) + "px";

    ov.style.left = "auto";
    ov.style.right = "auto";
    ov.style.writingMode = "horizontal-tb";
    ov.style.transform = "none";
    
    if (state.footer.position === "left") {
      ov.style.left = "20px"; ov.style.textAlign = "left";
    } else if (state.footer.position === "right") {
      ov.style.right = "20px"; ov.style.textAlign = "right";
    } else if (state.footer.position === "left-vertical") {
      ov.style.left = "20px";
      ov.style.writingMode = "vertical-rl";
      ov.style.transform = "rotate(180deg)";
      ov.style.textAlign = "left";
    } else if (state.footer.position === "right-vertical") {
      ov.style.right = "20px";
      ov.style.writingMode = "vertical-rl";
      ov.style.textAlign = "left";
    } else {
      ov.style.left = "0"; ov.style.right = "0"; ov.style.textAlign = "center";
    }
  });
}

/* ---------- Build modified PDF with pdf-lib ---------- */
async function buildModifiedPdf() {
  const { PDFDocument, StandardFonts, rgb, degrees } = PDFLib;
  let pdf;
  
  const bgBtn = document.querySelector("#quickBg button.active");
  const bgVal = bgBtn ? bgBtn.dataset.val : "white";
  const hasAdjustments = adjState.brightness != 100 || 
                         adjState.contrast != 100 || 
                         adjState.darkness != 0 || 
                         adjState.darktext != 100 || 
                         bgVal !== "white";

  if (hasAdjustments) {
    pdf = await PDFDocument.create();
    const scale = 2; // ~150 DPI for good balance of quality and size
    for (let i = 1; i <= state.numPages; i++) {
      const pdfPage = await state.pdfDoc.getPage(i);
      const viewport = pdfPage.getViewport({ scale: scale, rotation: state.rotation });
      
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const tempCtx = tempCanvas.getContext("2d");
      await pdfPage.render({ canvasContext: tempCtx, viewport }).promise;
      
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = viewport.width;
      finalCanvas.height = viewport.height;
      const finalCtx = finalCanvas.getContext("2d");
      
      if (bgVal === "black") { finalCtx.fillStyle = "#1e1e1e"; }
      else if (bgVal === "dim") { finalCtx.fillStyle = "#e0e0e0"; }
      else if (bgVal === "yellow") { finalCtx.fillStyle = "#fdf6e3"; }
      else { finalCtx.fillStyle = "#ffffff"; }
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      finalCtx.filter = `brightness(${adjState.brightness}%) contrast(${adjState.contrast}%) invert(${adjState.darkness}%) brightness(${adjState.darktext}%)`;
      finalCtx.drawImage(tempCanvas, 0, 0);
      finalCtx.filter = "none";
      
      const imgData = finalCanvas.toDataURL("image/jpeg", 0.9);
      const pdfImage = await pdf.embedJpg(imgData);
      
      const newPage = pdf.addPage([viewport.width / scale, viewport.height / scale]);
      newPage.drawImage(pdfImage, {
        x: 0, y: 0,
        width: viewport.width / scale,
        height: viewport.height / scale
      });
      
      // Cleanup to free memory aggressively
      tempCanvas.width = 0; tempCanvas.height = 0;
      finalCanvas.width = 0; finalCanvas.height = 0;
    }
  } else {
    if (!state.pdfBytes) {
      const buf = await state.pdfFile.arrayBuffer();
      state.pdfBytes = new Uint8Array(buf);
    }
    pdf = await PDFDocument.load(state.pdfBytes.slice());
  }

  const font = await pdf.embedFont(
    state.footer.fontFamily === "TimesRoman" ? StandardFonts.TimesRoman
    : state.footer.fontFamily === "Courier" ? StandardFonts.Courier
    : StandardFonts.Helvetica
  );

  const hex = state.footer.fontColor.replace("#","");
  const r = parseInt(hex.substr(0,2),16)/255;
  const g = parseInt(hex.substr(2,2),16)/255;
  const b = parseInt(hex.substr(4,2),16)/255;

  const pages = pdf.getPages();
  pages.forEach((page, i) => {
    if (!state.footer.enabled) return;
    const text = formatPageNumber(i+1, pages.length);
    if (!text) return;
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, state.footer.fontSize);
    let x;
    let y = state.footer.marginBottom;
    let angle = 0;
    
    if (state.footer.position === "left") {
      x = 40;
    } else if (state.footer.position === "right") {
      x = width - textWidth - 40;
    } else if (state.footer.position === "left-vertical") {
      x = 50;
      y = state.footer.marginBottom;
      angle = 90;
    } else if (state.footer.position === "right-vertical") {
      x = width - 40;
      y = state.footer.marginBottom;
      angle = 90;
    } else {
      x = (width - textWidth) / 2;
    }

    page.drawText(text, { x, y, size: state.footer.fontSize, font, color: rgb(r,g,b), rotate: degrees(angle) });
    if (state.footer.bold) {
      page.drawText(text, { x: x + 0.4, y, size: state.footer.fontSize, font, color: rgb(r,g,b), rotate: degrees(angle) });
    }
  });

  return await pdf.save();
}

/* ---------- Print Preview Modal ---------- */
$("btnPreview").addEventListener("click", async () => {
  if (!state.pdfDoc) return;
  $("previewModal").classList.add("open");
  await renderPrintPreview();
});
$("closePreview").addEventListener("click", () => $("previewModal").classList.remove("open"));
$("closePreview2").addEventListener("click", () => $("previewModal").classList.remove("open"));
["orient","paperSize","margins","scaling"].forEach(id =>
  $(id).addEventListener("change", renderPrintPreview));

let previewObserver = null;
const activePreviewRenders = new Map();

async function renderPrintPreview() {
  const area = $("previewArea");
  area.innerHTML = "";
  const [pw, ph] = PAPER[state.print.paperSize] || [595, 842];
  const orient = state.print.orientation;
  const paperW = orient === "landscape" ? ph : pw;
  const paperH = orient === "landscape" ? pw : ph;
  const margin = state.print.margins;

  const maxAvailableHeight = (window.innerHeight * 0.55) - 60; // 55vh minus padding/gap
  const maxAvailableWidth = Math.min(720, window.innerWidth) - 80; // modal width minus padding
  
  const displayScale = Math.min(1.0, maxAvailableWidth / paperW, maxAvailableHeight / paperH);

  if (previewObserver) {
    previewObserver.disconnect();
  }

  previewObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const wrap = entry.target;
      if (entry.isIntersecting) {
        if (!wrap.dataset.rendered) {
          wrap.dataset.rendered = "true";
          renderPreviewCanvas(wrap, paperW, paperH, margin, displayScale);
        }
      } else {
        if (wrap.dataset.rendered) {
           wrap.dataset.rendered = "";
           const pageNum = parseInt(wrap.dataset.page);
           const activeObj = activePreviewRenders.get(pageNum);
           if (activeObj && activeObj.task) {
             activeObj.task.cancel();
           }
           const canvas = wrap.querySelector("canvas");
           if (canvas) {
             canvas.width = 0; canvas.height = 0;
             canvas.remove();
           }
        }
      }
    });
  }, {
    root: area,
    rootMargin: '100% 0px 100% 0px',
    threshold: 0
  });

  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= state.numPages; i++) {
    const wrap = document.createElement("div");
    wrap.className = "print-page";
    wrap.dataset.page = i;
    wrap.style.width = dispW(paperW, displayScale) + "px";
    wrap.style.height = dispH(paperH, displayScale) + "px";

    const bgBtn = document.querySelector("#quickBg button.active");
    const bgVal = bgBtn ? bgBtn.dataset.val : "white";
    if (bgVal === "black") { wrap.style.backgroundColor = "#1e1e1e"; }
    else if (bgVal === "dim") { wrap.style.backgroundColor = "#e0e0e0"; }
    else if (bgVal === "yellow") { wrap.style.backgroundColor = "#fdf6e3"; }
    else { wrap.style.backgroundColor = "#ffffff"; }
    
    if (state.footer.enabled) {
      const text = formatPageNumber(i, state.numPages);
      const fp = document.createElement("div");
      fp.className = "footer-preview";
      fp.textContent = text;
      fp.style.fontSize = (state.footer.fontSize * displayScale) + "px";
      fp.style.fontFamily = state.footer.fontFamily === "TimesRoman" ? "Times New Roman, serif"
                          : state.footer.fontFamily === "Courier" ? "Courier New, monospace"
                          : "Helvetica, Arial, sans-serif";
      fp.style.color = state.footer.fontColor;
      fp.style.fontWeight = state.footer.bold ? "bold" : "normal";
      fp.style.fontStyle = state.footer.italic ? "italic" : "normal";
      fp.style.bottom = (state.footer.marginBottom * displayScale) + "px";
      fp.style.left = "auto";
      fp.style.right = "auto";
      fp.style.writingMode = "horizontal-tb";
      fp.style.transform = "none";
      
      if (state.footer.position === "left") { 
        fp.style.left = "10px"; fp.style.textAlign = "left"; 
      } else if (state.footer.position === "right") { 
        fp.style.right = "10px"; fp.style.textAlign = "right"; 
      } else if (state.footer.position === "left-vertical") {
        fp.style.left = "10px";
        fp.style.writingMode = "vertical-rl";
        fp.style.transform = "rotate(180deg)";
        fp.style.textAlign = "left";
      } else if (state.footer.position === "right-vertical") {
        fp.style.right = "10px";
        fp.style.writingMode = "vertical-rl";
        fp.style.textAlign = "left";
      } else { 
        fp.style.left = "0"; fp.style.right = "0"; fp.style.textAlign = "center"; 
      }
      wrap.appendChild(fp);
    }
    fragment.appendChild(wrap);
    previewObserver.observe(wrap);
  }
  area.appendChild(fragment);
}

async function renderPreviewCanvas(wrap, paperW, paperH, margin, displayScale) {
  const pageNum = parseInt(wrap.dataset.page);
  if (activePreviewRenders.has(pageNum)) return;
  
  const renderTaskObj = {};
  activePreviewRenders.set(pageNum, renderTaskObj);

  try {
    const page = await state.pdfDoc.getPage(pageNum);
    const vp = page.getViewport({ scale: 1, rotation: state.rotation });

    const innerW = paperW - margin*2;
    const innerH = paperH - margin*2 - state.footer.marginBottom;
    let s = Math.min(innerW / vp.width, innerH / vp.height);
    if (state.print.scaling === "actual") s = 1;
    else if (state.print.scaling === "fill") s = Math.max(innerW / vp.width, innerH / vp.height);

    const renderW = vp.width * s;
    const renderH = vp.height * s;

    if (!wrap.dataset.rendered) {
      activePreviewRenders.delete(pageNum);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = renderW; canvas.height = renderH;
    canvas.style.width = (renderW * displayScale) + "px";
    canvas.style.height = (renderH * displayScale) + "px";
    canvas.style.position = "absolute";
    canvas.style.left = ((paperW - renderW)/2 * displayScale) + "px";
    canvas.style.top = (margin * displayScale) + "px";
    canvas.style.filter = `brightness(${adjState.brightness}%) contrast(${adjState.contrast}%) invert(${adjState.darkness}%) brightness(${adjState.darktext}%)`;

    wrap.insertBefore(canvas, wrap.firstChild);

    const ctx = canvas.getContext("2d");
    const renderTask = page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: s, rotation: state.rotation }) });
    renderTaskObj.task = renderTask;
    await renderTask.promise;
  } catch (err) {
    if (err.name !== 'RenderingCancelledException') {
      console.error("Render preview error on page " + pageNum, err);
    }
  } finally {
    activePreviewRenders.delete(pageNum);
  }
}
function dispW(w, s) { return w * s; }
function dispH(h, s) { return h * s; }

/* ---------- Print options modal ---------- */
$("btnPrint").addEventListener("click", () => {
  if (!state.pdfDoc) return;
  $("currentPage").value = state.currentPage;
  $("printModal").classList.add("open");
});
$("btnPrintBig").addEventListener("click", () => {
  if (!state.pdfDoc) return;
  state.footer.enabled = true;
  $("quickEnable").checked = true;
  $("currentPage").value = state.currentPage;
  $("printModal").classList.add("open");
});
$("closePrint").addEventListener("click", () => $("printModal").classList.remove("open"));
$("closePrint2").addEventListener("click", () => $("printModal").classList.remove("open"));

$("pageRange").querySelectorAll("button").forEach(b => {
  b.addEventListener("click", () => {
    $("pageRange").querySelectorAll("button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    state.print.pages = b.dataset.val;
    $("rangeWrap").style.display = b.dataset.val === "range" ? "" : "none";
  });
});
$("rangeInput").addEventListener("input", e => state.print.range = e.target.value);
$("copies").addEventListener("input", e => state.print.copies = parseInt(e.target.value) || 1);
$("currentPage").addEventListener("input", e => state.print.currentPage = parseInt(e.target.value) || 1);
$("orient").addEventListener("change", e => state.print.orientation = e.target.value);
$("paperSize").addEventListener("change", e => state.print.paperSize = e.target.value);
$("margins").addEventListener("change", e => {
  state.print.margins = e.target.value === "custom" ? 20 : parseInt(e.target.value);
});
$("scaling").addEventListener("change", e => state.print.scaling = e.target.value);

function parseRange(str, total) {
  const set = new Set();
  str.split(",").forEach(part => {
    part = part.trim();
    if (!part) return;
    if (part.includes("-")) {
      const [a,b] = part.split("-").map(x => parseInt(x.trim()));
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = Math.max(1,a); i <= Math.min(total,b); i++) set.add(i);
      }
    } else {
      const n = parseInt(part);
      if (!isNaN(n) && n >= 1 && n <= total) set.add(n);
    }
  });
  return [...set].sort((a,b)=>a-b);
}

function getPagesToPrint() {
  const total = state.numPages;
  switch (state.print.pages) {
    case "current": return [state.print.currentPage];
    case "range": return parseRange(state.print.range, total);
    case "odd": return Array.from({length: total}, (_,i)=>i+1).filter(i => i%2===1);
    case "even": return Array.from({length: total}, (_,i)=>i+1).filter(i => i%2===0);
    default: return Array.from({length: total}, (_,i)=>i+1);
  }
}

/* ---------- Confirm Print ---------- */
$("confirmPrint").addEventListener("click", async () => {
  $("printModal").classList.remove("open");
  showLoading(true);
  try {
    const bytes = await buildModifiedPdf();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) toast("Please allow pop-ups to print");
    else {
      setTimeout(() => { try { win.print(); } catch(e){} }, 1200);
    }
    toast("Opening print dialog…");
  } catch (err) {
    console.error(err);
    toast("Error preparing PDF");
  } finally {
    showLoading(false);
  }
});

$("doPrint").addEventListener("click", () => {
  $("previewModal").classList.remove("open");
  $("printModal").classList.add("open");
});

/* ---------- Download modified PDF ---------- */
$("btnDownload").addEventListener("click", async () => {
  if (!state.pdfDoc) return;
  showLoading(true);
  try {
    const bytes = await buildModifiedPdf();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.fileName.replace(/\.pdf$/i, "") + "_numbered.pdf";
    a.click();
    URL.revokeObjectURL(url);
    toast("Downloaded modified PDF");
  } catch (err) {
    console.error(err);
    toast("Error generating PDF");
  } finally {
    showLoading(false);
  }
});

/* ---------- Magnifier Glass Logic ---------- */
let mGlassMode = 0; // 0 = off, 1 = rect, 2 = circle
let magZoom = 1.5;
let magMouseX = 0;
let magMouseY = 0;
let magAnimFrame = null;
let isDraggingHandle = false;
let handleOffsetX = 0;
let handleOffsetY = 0;
let lastTargetCanvas = null;
let lastBoxRect = null;

$("btnMGlass").addEventListener("click", () => {
  mGlassMode = (mGlassMode + 1) % 3;
  const btn = $("btnMGlass");
  if (mGlassMode === 0) {
    btn.classList.remove("primary");
    btn.textContent = "M-Glass";
    $("magnifierRect").style.display = "none";
    $("magController").classList.remove("active");
    lastTargetCanvas = null;
    lastBoxRect = null;
    magMouseX = 0;
    magMouseY = 0;
  } else if (mGlassMode === 1) {
    btn.classList.add("primary");
    btn.textContent = "M-Glass: Rect";
    $("magController").classList.add("active");
    $("magController").classList.add("active");
    if (magMouseX === 0 && magMouseY === 0) centerMagnifierOnVisibleCanvas();
    updateMagnifier();
  } else if (mGlassMode === 2) {
    btn.classList.add("primary");
    btn.textContent = "M-Glass: Circle";
    $("magController").classList.add("active");
    if (magMouseX === 0 && magMouseY === 0) centerMagnifierOnVisibleCanvas();
    updateMagnifier();
  }
});

function centerMagnifierOnVisibleCanvas() {
  const boxes = document.querySelectorAll(".page-box");
  const viewerRect = $("viewer").getBoundingClientRect();
  for (let box of boxes) {
    const c = box.querySelector("canvas");
    if (c) {
      const rect = box.getBoundingClientRect();
      if (rect.bottom > viewerRect.top && rect.top < viewerRect.bottom) {
        magMouseX = rect.left + rect.width / 2;
        magMouseY = Math.max(rect.top, viewerRect.top) + (Math.min(rect.bottom, viewerRect.bottom) - Math.max(rect.top, viewerRect.top)) / 2;
        return;
      }
    }
  }
  magMouseX = viewerRect.left + viewerRect.width / 2;
  magMouseY = viewerRect.top + viewerRect.height / 2;
}

let edgeScrollInterval = null;

function clampAndScrollMag(dx = 0, dy = 0, checkEdge = false) {
  const viewer = $("viewer");
  const viewerRect = viewer.getBoundingClientRect();
  const isLandscape = window.innerWidth > window.innerHeight;
  const magHeight = mGlassMode === 1 ? Math.round(window.innerHeight * (isLandscape ? 0.35 : 0.15)) : 200;
  const magWidth = mGlassMode === 1 ? (lastBoxRect ? lastBoxRect.width : viewerRect.width) : 200;
  
  const minY = viewerRect.top + (magHeight / 2);
  const maxY = Math.max(minY, viewerRect.bottom - (magHeight / 2));
  const minX = mGlassMode === 1 ? viewerRect.left : viewerRect.left + (magWidth / 2);
  const maxX = mGlassMode === 1 ? viewerRect.right : Math.max(minX, viewerRect.right - (magWidth / 2));

  let didScroll = false;

  if (checkEdge) {
    const scrollMarginY = (magHeight / 2) + 20;
    const scrollMarginX = mGlassMode === 1 ? 40 : (magWidth / 2) + 20;
    const speed = (dx !== 0 || dy !== 0) ? 15 : 12;
    
    const checkDy = dy !== 0 ? dy : (magMouseY > viewerRect.bottom - scrollMarginY ? 1 : (magMouseY < viewerRect.top + scrollMarginY ? -1 : 0));
    const checkDx = dx !== 0 ? dx : (magMouseX > viewerRect.right - scrollMarginX ? 1 : (magMouseX < viewerRect.left + scrollMarginX ? -1 : 0));

    if (checkDy > 0 && magMouseY > viewerRect.bottom - scrollMarginY) {
      viewer.scrollTop += speed; didScroll = true;
    } else if (checkDy < 0 && magMouseY < viewerRect.top + scrollMarginY) {
      viewer.scrollTop -= speed; didScroll = true;
    }
    
    if (checkDx > 0 && magMouseX > viewerRect.right - scrollMarginX) {
      viewer.scrollLeft += speed; didScroll = true;
    } else if (checkDx < 0 && magMouseX < viewerRect.left + scrollMarginX) {
      viewer.scrollLeft -= speed; didScroll = true;
    }
  }

  magMouseX = Math.max(minX, Math.min(maxX, magMouseX));
  magMouseY = Math.max(minY, Math.min(maxY, magMouseY));
  
  return didScroll;
}

function startEdgeScroll() {
  if (edgeScrollInterval) return;
  edgeScrollInterval = setInterval(() => {
    if (!isDraggingHandle) {
      stopEdgeScroll();
      return;
    }
    if (clampAndScrollMag(0, 0, true)) {
      if (!magAnimFrame) {
        magAnimFrame = requestAnimationFrame(() => {
          updateMagnifier();
          magAnimFrame = null;
        });
      }
    }
  }, 16);
}

function stopEdgeScroll() {
  if (edgeScrollInterval) {
    clearInterval(edgeScrollInterval);
    edgeScrollInterval = null;
  }
}

const magRectEl = $("magnifierRect");

magRectEl.addEventListener("mousedown", (e) => {
  if (mGlassMode > 0) {
    isDraggingHandle = true;
    handleOffsetX = magMouseX - e.clientX;
    handleOffsetY = magMouseY - e.clientY;
    e.preventDefault();
    startEdgeScroll();
  }
});

magRectEl.addEventListener("touchstart", (e) => {
  if (mGlassMode > 0 && e.touches.length === 1) {
    isDraggingHandle = true;
    handleOffsetX = magMouseX - e.touches[0].clientX;
    handleOffsetY = magMouseY - e.touches[0].clientY;
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener("mousemove", (e) => {
  if (isDraggingHandle) {
    magMouseX = e.clientX + handleOffsetX;
    magMouseY = e.clientY + handleOffsetY;
    
    clampAndScrollMag(0, 0, true);
    
    if (!magAnimFrame) {
      magAnimFrame = requestAnimationFrame(() => {
        updateMagnifier();
        magAnimFrame = null;
      });
    }
  }
});
document.addEventListener("touchmove", (e) => {
  if (isDraggingHandle && e.touches.length === 1) {
    magMouseX = e.touches[0].clientX + handleOffsetX;
    magMouseY = e.touches[0].clientY + handleOffsetY;
    e.preventDefault();
    
    clampAndScrollMag(0, 0, true);
    
    if (!magAnimFrame) {
      magAnimFrame = requestAnimationFrame(() => {
        updateMagnifier();
        magAnimFrame = null;
      });
    }
  }
}, { passive: false });

document.addEventListener("mouseup", () => { isDraggingHandle = false; });
document.addEventListener("touchend", () => { isDraggingHandle = false; });

magRectEl.addEventListener("wheel", (e) => {
  e.preventDefault();
  $("viewer").scrollTop += e.deltaY;
  $("viewer").scrollLeft += e.deltaX;
}, { passive: false });

$("viewer").addEventListener("scroll", () => {
  if (mGlassMode > 0) {
    if (!magAnimFrame) {
      magAnimFrame = requestAnimationFrame(() => {
        updateMagnifier();
        magAnimFrame = null;
      });
    }
  }
});

function updateMagnifier() {
  if (mGlassMode === 0) return;
  
  const boxes = document.querySelectorAll(".page-box");
  let targetCanvas = null;
  let boxRect = null;
  
  for (let box of boxes) {
    const rect = box.getBoundingClientRect();
    if (magMouseX >= rect.left && magMouseX <= rect.right &&
        magMouseY >= rect.top && magMouseY <= rect.bottom) {
      const c = box.querySelector("canvas");
      if (c) {
        targetCanvas = c;
        boxRect = rect;
      }
      break;
    }
  }
  
  if (!targetCanvas) {
    for (let box of boxes) {
      const c = box.querySelector("canvas");
      if (c) {
        targetCanvas = c;
        boxRect = box.getBoundingClientRect();
        break;
      }
    }
  }
  
  const magRect = $("magnifierRect");
  if (!targetCanvas) {
    magRect.style.display = "none";
    return;
  }
  
  lastTargetCanvas = targetCanvas;
  lastBoxRect = boxRect;
  
  const mCanvas = $("magnifierCanvas");
  const mCtx = mCanvas.getContext("2d");
  
  magRect.style.display = "block";
  
  const dpr = window.devicePixelRatio || 1;
  let magWidth, magHeight, drawLeft, drawTop;

  if (mGlassMode === 1) {
    magRect.className = "magnifier-wrapper rect";
    const isLandscape = window.innerWidth > window.innerHeight;
    magHeight = Math.round(window.innerHeight * (isLandscape ? 0.35 : 0.15));
    magWidth = boxRect.width;
    drawLeft = boxRect.left;
    drawTop = magMouseY;
  } else {
    magRect.className = "magnifier-wrapper circle";
    const size = 200; // 200px diameter
    magWidth = size;
    magHeight = size;
    drawLeft = magMouseX;
    drawTop = magMouseY;
  }
  
  mCanvas.width = magWidth * dpr;
  mCanvas.height = magHeight * dpr;
  magRect.style.width = magWidth + "px";
  magRect.style.height = magHeight + "px";
  
  magRect.style.left = drawLeft + "px";
  magRect.style.top = drawTop + "px";
  
  mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
  
  let baseSrcCenterX, baseSrcCenterY;
  if (mGlassMode === 1) {
    let panFactor = (magMouseX - boxRect.left) / boxRect.width;
    panFactor = Math.max(0, Math.min(1, panFactor));
    const srcW = magWidth / magZoom;
    baseSrcCenterX = boxRect.left + (srcW / 2) + (boxRect.width - srcW) * panFactor;
    baseSrcCenterY = magMouseY;
  } else {
    baseSrcCenterX = magMouseX;
    baseSrcCenterY = magMouseY;
  }

  const renderMagLayer = (zoom, targetCtx) => {
    const srcW = magWidth / zoom;
    const srcH = magHeight / zoom;
    
    let layerSrcCenterX = baseSrcCenterX;
    if (mGlassMode === 1) {
      let panFactor = (magMouseX - boxRect.left) / boxRect.width;
      panFactor = Math.max(0, Math.min(1, panFactor));
      layerSrcCenterX = boxRect.left + (srcW / 2) + (boxRect.width - srcW) * panFactor;
    }
    const layerSrcCenterY = baseSrcCenterY;

    for (let box of document.querySelectorAll(".page-box")) {
      const r = box.getBoundingClientRect();
      if (r.right < layerSrcCenterX - srcW/2 || r.left > layerSrcCenterX + srcW/2 ||
          r.bottom < layerSrcCenterY - srcH/2 || r.top > layerSrcCenterY + srcH/2) {
        continue;
      }
      
      const c = box.querySelector("canvas");
      if (c) {
        const scaleX = c.width / r.width;
        const scaleY = c.height / r.height;
        const interLeft = Math.max(r.left, layerSrcCenterX - srcW/2);
        const interTop = Math.max(r.top, layerSrcCenterY - srcH/2);
        const interRight = Math.min(r.right, layerSrcCenterX + srcW/2);
        const interBottom = Math.min(r.bottom, layerSrcCenterY + srcH/2);
        
        const interW = interRight - interLeft;
        const interH = interBottom - interTop;
        
        if (interW > 0 && interH > 0) {
          const sx = (interLeft - r.left) * scaleX;
          const sy = (interTop - r.top) * scaleY;
          const sWidth = interW * scaleX;
          const sHeight = interH * scaleY;
          
          const idx = (interLeft - (layerSrcCenterX - srcW/2)) * zoom * dpr;
          const idy = (interTop - (layerSrcCenterY - srcH/2)) * zoom * dpr;
          const idWidth = interW * zoom * dpr;
          const idHeight = interH * zoom * dpr;
          
          targetCtx.filter = window.getComputedStyle(c).filter;
          targetCtx.drawImage(c, sx, sy, sWidth, sHeight, idx, idy, idWidth, idHeight);
          targetCtx.filter = "none";
        }
      }
    }
  };

  renderMagLayer(magZoom, mCtx);

  if (mGlassMode === 2) {
    const offCanvas = document.createElement("canvas");
    offCanvas.width = mCanvas.width;
    offCanvas.height = mCanvas.height;
    const offCtx = offCanvas.getContext("2d");
    
    renderMagLayer(magZoom * 1.08, offCtx);
    
    const innerRadius = (magWidth / 2) * 0.8 * dpr;
    const blurAmount = innerRadius * 0.05; 
    
    offCtx.globalCompositeOperation = "destination-in";
    const grad = offCtx.createRadialGradient(
      mCanvas.width / 2, mCanvas.height / 2, Math.max(0, innerRadius - blurAmount),
      mCanvas.width / 2, mCanvas.height / 2, innerRadius + blurAmount
    );
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    
    offCtx.fillStyle = grad;
    offCtx.beginPath();
    offCtx.arc(mCanvas.width / 2, mCanvas.height / 2, mCanvas.width, 0, Math.PI * 2);
    offCtx.fill();
    
    mCtx.drawImage(offCanvas, 0, 0);
  }
}

let magPanInterval = null;
const PAN_SPEED = 8; // pixels per frame

function startMagPan(dx, dy) {
  if (magPanInterval) return;
  magPanInterval = setInterval(() => {
    magMouseX += dx * PAN_SPEED;
    magMouseY += dy * PAN_SPEED;
    
    clampAndScrollMag(dx, dy, true);
    
    if (!magAnimFrame) {
      magAnimFrame = requestAnimationFrame(() => {
        updateMagnifier();
        magAnimFrame = null;
      });
    }
  }, 16);
}

function stopMagPan() {
  if (magPanInterval) {
    clearInterval(magPanInterval);
    magPanInterval = null;
  }
}

document.querySelectorAll('.mag-btn').forEach(btn => {
  const dir = btn.dataset.dir;
  if (!dir) return;
  
  const handleStart = (e) => {
    e.preventDefault();
    if (dir === 'up') startMagPan(0, -1);
    if (dir === 'down') startMagPan(0, 1);
    if (dir === 'left') startMagPan(-1, 0);
    if (dir === 'right') startMagPan(1, 0);
    // Center button resets to center of screen
    if (dir === 'center') {
      const viewerRect = $("viewer").getBoundingClientRect();
      magMouseX = viewerRect.left + viewerRect.width / 2;
      magMouseY = viewerRect.top + viewerRect.height / 2;
      if (!magAnimFrame) {
        magAnimFrame = requestAnimationFrame(() => { updateMagnifier(); magAnimFrame = null; });
      }
    }
  };
  
  btn.addEventListener('mousedown', handleStart);
  btn.addEventListener('touchstart', handleStart, {passive: false});
  
  btn.addEventListener('mouseup', stopMagPan);
  btn.addEventListener('mouseleave', stopMagPan);
  btn.addEventListener('touchend', stopMagPan);
});

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("open");
}

document.getElementById("btnNavScrollUp").addEventListener("click", () => {
  const viewer = document.getElementById("viewer");
  if (viewer) {
    viewer.scrollBy({ top: -window.innerHeight * 0.4, behavior: 'smooth' });
  }
});

document.getElementById("btnNavScrollDown").addEventListener("click", () => {
  const viewer = document.getElementById("viewer");
  if (viewer) {
    viewer.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
  }
});

/* ---------- Init ---------- */
updateIndicator();