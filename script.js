/* ============================================================
   PDF Page Printer – Application Logic
   ============================================================ */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const state = {
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

/* ---------- Theme ---------- */
$("btnTheme").addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", state.theme);
  $("btnTheme").textContent = state.theme === "light" ? "🌙" : "☀️";
});

/* ---------- File import ---------- */
const fileInput = $("fileInput");
$("btnImport").addEventListener("click", () => fileInput.click());
$("btnNew").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

const dz = $("dropzone");
dz.addEventListener("click", () => fileInput.click());
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
    const buf = await file.arrayBuffer();
    state.pdfBytes = new Uint8Array(buf);
    state.fileName = file.name;
    state.pdfDoc = await pdfjsLib.getDocument({ data: state.pdfBytes.slice() }).promise;
    state.numPages = state.pdfDoc.numPages;
    state.currentPage = 1;
    state.rotation = 0;

    $("infoName").textContent = file.name;
    $("infoSize").textContent = fmtSize(file.size);
    $("infoPages").textContent = state.numPages;
    $("fileInfo").style.display = "flex";

    dz.style.display = "none";
    ["btnZoomIn","btnZoomOut","btnFitWidth","btnFitPage",
     "btnRotLeft","btnRotRight","btnFooter","btnPreview",
     "btnPrint","btnNew","btnPrintBig","btnDownload", "btnMGlass", 
     "btnPreviewMobile", "btnMGlassMobile"].forEach(id => {
       if ($(id)) $(id).disabled = false;
     });

    await renderAllPages();
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
    
    if (!box.dataset.rendered) {
      activeRenders.delete(pageNum);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    box.style.width = viewport.width + "px";
    box.style.height = viewport.height + "px";
    
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

  let firstViewport = null;
  if (state.numPages > 0) {
    const firstPage = await state.pdfDoc.getPage(1);
    firstViewport = firstPage.getViewport({ scale: state.scale, rotation: state.rotation });
  }

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
  }
  
  viewer.appendChild(fragment);

  const boxes = viewer.querySelectorAll(".page-box");
  boxes.forEach(box => pageObserver.observe(box));
  
  applyFooterPreview();
}

/* Track current page on scroll */
let scrollTimeout = null;
$("viewer").addEventListener("scroll", () => {
  if (!state.pdfDoc) return;
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
    const boxes = document.querySelectorAll(".page-box");
    const viewerTop = $("viewer").getBoundingClientRect().top;
    let current = state.currentPage;
    for (let i = 0; i < boxes.length; i++) {
      const r = boxes[i].getBoundingClientRect();
      if (r.top > viewerTop + 150) break; 
      current = parseInt(boxes[i].dataset.page);
    }
    if (current !== state.currentPage) {
      state.currentPage = current;
      $("currentPage").value = current;
    }
  }, 100);
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
$("quickPos").addEventListener("change", e => {
  state.footer.position = e.target.value;
  applyFooterPreview();
});

const adjState = { brightness: 100, contrast: 100, darkness: 0, hue: 0 };
let currentAdj = "brightness";
const adjConfig = {
  brightness: { min: 0, max: 200, def: 100 },
  contrast: { min: 0, max: 200, def: 100 },
  darkness: { min: 0, max: 100, def: 0 },
  hue: { min: 0, max: 360, def: 0 }
};

function applyAdjustments() {
  const viewer = $("viewer");
  viewer.style.setProperty("--adj-brightness", adjState.brightness + "%");
  viewer.style.setProperty("--adj-contrast", adjState.contrast + "%");
  viewer.style.setProperty("--adj-darkness", adjState.darkness + "%");
  viewer.style.setProperty("--adj-hue", adjState.hue + "deg");
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

$("quickBg").addEventListener("change", e => {
  const val = e.target.value;
  const viewer = $("viewer");
  viewer.classList.remove("pdf-bg-white", "pdf-bg-black", "pdf-bg-dim", "pdf-bg-yellow");
  viewer.classList.add("pdf-bg-" + val);
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

$("btnFooter").addEventListener("click", () => {
  document.querySelector(".sidebar").scrollIntoView({ behavior: "smooth" });
  toast("Adjust settings in the sidebar");
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
  
  const bgClass = Array.from($("viewer").classList).find(c => c.startsWith("pdf-bg-")) || "pdf-bg-white";
  const needsRaster = bgClass !== "pdf-bg-white" || 
                      adjState.brightness !== 100 || 
                      adjState.contrast !== 100 || 
                      adjState.darkness !== 0 || 
                      adjState.hue !== 0;

  const hex = state.footer.fontColor.replace("#","");
  const r = parseInt(hex.substr(0,2),16)/255;
  const g = parseInt(hex.substr(2,2),16)/255;
  const b = parseInt(hex.substr(4,2),16)/255;

  if (!needsRaster) {
    const pdf = await PDFDocument.load(state.pdfBytes.slice());
    const font = await pdf.embedFont(
      state.footer.fontFamily === "TimesRoman" ? StandardFonts.TimesRoman
      : state.footer.fontFamily === "Courier" ? StandardFonts.Courier
      : StandardFonts.Helvetica
    );
    const pages = pdf.getPages();
    pages.forEach((page, i) => {
      if (!state.footer.enabled) return;
      const text = formatPageNumber(i+1, pages.length);
      if (!text) return;
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, state.footer.fontSize);
      let x, y = state.footer.marginBottom, angle = 0;
      if (state.footer.position === "left") x = 40;
      else if (state.footer.position === "right") x = width - textWidth - 40;
      else if (state.footer.position === "left-vertical") { x = 50; angle = 90; }
      else if (state.footer.position === "right-vertical") { x = width - 40; angle = 90; }
      else x = (width - textWidth) / 2;
      page.drawText(text, { x, y, size: state.footer.fontSize, font, color: rgb(r,g,b), rotate: degrees(angle) });
      if (state.footer.bold) page.drawText(text, { x: x + 0.4, y, size: state.footer.fontSize, font, color: rgb(r,g,b), rotate: degrees(angle) });
    });
    return await pdf.save();
  }

  // Rasterize PDF if adjustments exist
  toast("Baking adjustments into PDF...");
  const newPdf = await PDFDocument.create();
  const font = await newPdf.embedFont(
    state.footer.fontFamily === "TimesRoman" ? StandardFonts.TimesRoman
    : state.footer.fontFamily === "Courier" ? StandardFonts.Courier
    : StandardFonts.Helvetica
  );
  
  let bgColorStr = "#ffffff";
  let baseFilter = "";
  if (bgClass === "pdf-bg-black") { bgColorStr = "#121212"; baseFilter = "invert(1) hue-rotate(180deg)"; }
  else if (bgClass === "pdf-bg-dim") { bgColorStr = "#e0e0e0"; baseFilter = "brightness(0.85)"; }
  else if (bgClass === "pdf-bg-yellow") { bgColorStr = "#fdf6e3"; baseFilter = "sepia(0.5) brightness(0.95)"; }
  
  let finalFilter = `${baseFilter} brightness(${adjState.brightness}%) contrast(${adjState.contrast}%) invert(${adjState.darkness}%) hue-rotate(${adjState.hue}deg)`.trim();

  let renderScale = 2.0;
  if (state.numPages > 30) renderScale = 1.5;
  if (state.numPages > 100) renderScale = 1.2;
  if (state.numPages > 250) renderScale = 1.0;
  
  let jpegQuality = state.numPages > 50 ? 0.8 : 0.92;

  for (let i = 1; i <= state.numPages; i++) {
    if (i % 2 === 1 || i === state.numPages) {
      toast(`Baking PDF: Page ${i} / ${state.numPages}`);
      await new Promise(r => setTimeout(r, 15)); // Yield longer to keep UI smooth and allow GC
    }

    const page = await state.pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: renderScale, rotation: state.rotation });
    
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = bgColorStr;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.filter = finalFilter;
    await page.render({ canvasContext: ctx, viewport: viewport, background: "transparent" }).promise;
    
    const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
    
    // Free canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;

    const pdfImg = await newPdf.embedJpg(imgData);
    
    const pdfWidth = viewport.width / renderScale;
    const pdfHeight = viewport.height / renderScale;
    const newPage = newPdf.addPage([pdfWidth, pdfHeight]);
    
    newPage.drawImage(pdfImg, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });

    if (state.footer.enabled) {
      const text = formatPageNumber(i, state.numPages);
      if (text) {
        const textWidth = font.widthOfTextAtSize(text, state.footer.fontSize);
        let x, y = state.footer.marginBottom, angle = 0;
        if (state.footer.position === "left") x = 40;
        else if (state.footer.position === "right") x = pdfWidth - textWidth - 40;
        else if (state.footer.position === "left-vertical") { x = 50; angle = 90; }
        else if (state.footer.position === "right-vertical") { x = pdfWidth - 40; angle = 90; }
        else x = (pdfWidth - textWidth) / 2;
        
        newPage.drawText(text, { x, y, size: state.footer.fontSize, font, color: rgb(r,g,b), rotate: degrees(angle) });
        if (state.footer.bold) newPage.drawText(text, { x: x + 0.4, y, size: state.footer.fontSize, font, color: rgb(r,g,b), rotate: degrees(angle) });
      }
    }
  }

  return await newPdf.save();
}

/* ---------- Print Preview Modal ---------- */
const handlePreviewClick = async () => {
  if (!state.pdfDoc) return;
  $("previewModal").classList.add("open");
  await renderPrintPreview();
};
$("btnPreview").addEventListener("click", handlePreviewClick);
if ($("btnPreviewMobile")) $("btnPreviewMobile").addEventListener("click", handlePreviewClick);
$("closePreview").addEventListener("click", () => $("previewModal").classList.remove("open"));
$("closePreview2").addEventListener("click", () => $("previewModal").classList.remove("open"));
["orient","paperSize","margins","scaling"].forEach(id =>
  $(id).addEventListener("change", renderPrintPreview));

async function renderPrintPreview() {
  const area = $("previewArea");
  area.innerHTML = "";
  const [pw, ph] = PAPER[state.print.paperSize] || [595, 842];
  const orient = state.print.orientation;
  const paperW = orient === "landscape" ? ph : pw;
  const paperH = orient === "landscape" ? pw : ph;
  const margin = state.print.margins;

  const displayScale = Math.min(0.5, 300 / paperW);

  for (let i = 1; i <= state.numPages; i++) {
    const page = await state.pdfDoc.getPage(i);
    const vp = page.getViewport({ scale: 1, rotation: state.rotation });

    const innerW = paperW - margin*2;
    const innerH = paperH - margin*2 - state.footer.marginBottom;
    let s = Math.min(innerW / vp.width, innerH / vp.height);
    if (state.print.scaling === "actual") s = 1;
    else if (state.print.scaling === "fill") s = Math.max(innerW / vp.width, innerH / vp.height);

    const renderW = vp.width * s;
    const renderH = vp.height * s;

    const wrap = document.createElement("div");
    wrap.className = "print-page";
    wrap.style.width = dispW(paperW, displayScale) + "px";
    wrap.style.height = dispH(paperH, displayScale) + "px";

    const canvas = document.createElement("canvas");
    canvas.width = renderW; canvas.height = renderH;
    canvas.style.width = (renderW * displayScale) + "px";
    canvas.style.height = (renderH * displayScale) + "px";
    canvas.style.position = "absolute";
    canvas.style.left = ((paperW - renderW)/2 * displayScale) + "px";
    canvas.style.top = (margin * displayScale) + "px";
    wrap.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: s, rotation: state.rotation }) }).promise;

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
    area.appendChild(wrap);
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

const toggleMGlassDropdown = (e, btnId, dropId) => {
  if ($(btnId).disabled) return;
  e.stopPropagation();
  $(dropId).classList.toggle("show");
};

$("btnMGlass").addEventListener("click", (e) => toggleMGlassDropdown(e, "btnMGlass", "mGlassDropdown"));
if ($("btnMGlassMobile")) $("btnMGlassMobile").addEventListener("click", (e) => toggleMGlassDropdown(e, "btnMGlassMobile", "mGlassDropdownMobile"));

document.addEventListener("click", () => {
  if ($("mGlassDropdown")) $("mGlassDropdown").classList.remove("show");
  if ($("mGlassDropdownMobile")) $("mGlassDropdownMobile").classList.remove("show");
});

const setupMGlassButtons = (dropdownId) => {
  const dropdown = $(dropdownId);
  if (!dropdown) return;
  dropdown.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      mGlassMode = parseInt(b.dataset.mode);
      dropdown.classList.remove("show");
      
      const btn = $("btnMGlass");
      const btnMob = $("btnMGlassMobile");
      
      if (mGlassMode === 0) {
        if (btn) { btn.classList.remove("primary"); btn.querySelector(".label").textContent = "M-Glass"; }
        if (btnMob) { btnMob.classList.remove("primary"); btnMob.querySelector(".label").textContent = "M-Glass Options"; }
        $("magnifierRect").style.display = "none";
        $("magController").classList.remove("active");
        lastTargetCanvas = null;
        lastBoxRect = null;
        magMouseX = 0;
        magMouseY = 0;
      } else if (mGlassMode === 1) {
        if (btn) { btn.classList.add("primary"); btn.querySelector(".label").textContent = "M-Glass: Rect"; }
        if (btnMob) { btnMob.classList.add("primary"); btnMob.querySelector(".label").textContent = "M-Glass: Rect"; }
        $("magController").classList.add("active");
        if (magMouseX === 0 && magMouseY === 0) {
          const viewerRect = $("viewer").getBoundingClientRect();
          magMouseX = viewerRect.left + viewerRect.width / 2;
          magMouseY = viewerRect.top + viewerRect.height / 2;
        }
        updateMagnifier();
      } else if (mGlassMode === 2) {
        if (btn) { btn.classList.add("primary"); btn.querySelector(".label").textContent = "M-Glass: Circle"; }
        if (btnMob) { btnMob.classList.add("primary"); btnMob.querySelector(".label").textContent = "M-Glass: Circle"; }
        $("magController").classList.add("active");
        if (magMouseX === 0 && magMouseY === 0) {
          const viewerRect = $("viewer").getBoundingClientRect();
          magMouseX = viewerRect.left + viewerRect.width / 2;
          magMouseY = viewerRect.top + viewerRect.height / 2;
        }
        updateMagnifier();
      }
    });
  });
};

setupMGlassButtons("mGlassDropdown");
setupMGlassButtons("mGlassDropdownMobile");

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
    
    clampAndScrollMag(0, 0, false);
    
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
    
    clampAndScrollMag(0, 0, false);
    
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
      targetCanvas = box.querySelector("canvas");
      boxRect = rect;
      break;
    }
  }
  
  if (targetCanvas) {
    lastTargetCanvas = targetCanvas;
    lastBoxRect = boxRect;
  } else if (lastTargetCanvas) {
    targetCanvas = lastTargetCanvas;
    // Always fetch fresh coordinates if falling back, so scrolling updates correctly!
    boxRect = targetCanvas.parentElement.getBoundingClientRect();
    lastBoxRect = boxRect;
  } else {
    targetCanvas = lastTargetCanvas;
    boxRect = lastBoxRect;
  }
  
  const magRect = $("magnifierRect");
  const mCanvas = $("magnifierCanvas");
  const mCtx = mCanvas.getContext("2d");
  
  if (!targetCanvas) {
    if (boxes.length > 0) {
      targetCanvas = boxes[0].querySelector("canvas");
      boxRect = boxes[0].getBoundingClientRect();
      lastTargetCanvas = targetCanvas;
      lastBoxRect = boxRect;
    } else {
      magRect.style.display = "none";
      return;
    }
  }
  
  magRect.style.display = "block";
  
  const dpr = window.devicePixelRatio || 1;
  let magWidth, magHeight, drawLeft, drawTop;
  let localMouseX = magMouseX;
  let localMouseY = magMouseY;

  if (mGlassMode === 1) {
    magRect.className = "magnifier-wrapper rect";
    const isLandscape = window.innerWidth > window.innerHeight;
    magHeight = Math.round(window.innerHeight * (isLandscape ? 0.35 : 0.15));
    magWidth = boxRect.width;
    
    let minY = boxRect.top + magHeight / 2;
    let maxY = boxRect.bottom - magHeight / 2;
    localMouseY = (minY > maxY) ? boxRect.top + boxRect.height / 2 : Math.max(minY, Math.min(magMouseY, maxY));
    
    drawLeft = boxRect.left;
    drawTop = localMouseY;
  } else {
    magRect.className = "magnifier-wrapper circle";
    const size = 200; // 200px diameter
    magWidth = size;
    magHeight = size;
    
    let minY = boxRect.top + magHeight / 2;
    let maxY = boxRect.bottom - magHeight / 2;
    localMouseY = (minY > maxY) ? boxRect.top + boxRect.height / 2 : Math.max(minY, Math.min(magMouseY, maxY));
    
    let minX = boxRect.left + magWidth / 2;
    let maxX = boxRect.right - magWidth / 2;
    localMouseX = (minX > maxX) ? boxRect.left + boxRect.width / 2 : Math.max(minX, Math.min(magMouseX, maxX));

    drawLeft = localMouseX;
    drawTop = localMouseY;
  }
  
  mCanvas.width = magWidth * dpr;
  mCanvas.height = magHeight * dpr;
  magRect.style.width = magWidth + "px";
  magRect.style.height = magHeight + "px";
  
  magRect.style.left = drawLeft + "px";
  magRect.style.top = drawTop + "px";
  
  mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
  
  const scaleX = targetCanvas.width / boxRect.width;
  const scaleY = targetCanvas.height / boxRect.height;
  
  let sWidth, sHeight, sx, sy, startY, startX;
  
  if (mGlassMode === 1) {
    let panFactor = (localMouseX - boxRect.left) / boxRect.width;
    if (isNaN(panFactor)) panFactor = 0.5;
    if (panFactor < 0) panFactor = 0;
    if (panFactor > 1) panFactor = 1;
    
    sWidth = (magWidth / magZoom) * scaleX;
    sHeight = (magHeight / magZoom) * scaleY;
    
    sx = (targetCanvas.width - sWidth) * panFactor;
    sy = (localMouseY - boxRect.top) * scaleY;
    startY = sy - (sHeight / 2);
    startX = sx;
  } else {
    sWidth = (magWidth / magZoom) * scaleX;
    sHeight = (magHeight / magZoom) * scaleY;
    
    const canvasX = localMouseX - boxRect.left;
    const canvasY = localMouseY - boxRect.top;
    
    sx = canvasX * scaleX;
    sy = canvasY * scaleY;
    startX = sx - (sWidth / 2);
    startY = sy - (sHeight / 2);
  }
  
  try {
    const clampLeft = Math.max(0, -startX);
    const clampTop = Math.max(0, -startY);
    const clampRight = Math.max(0, (startX + sWidth) - targetCanvas.width);
    const clampBottom = Math.max(0, (startY + sHeight) - targetCanvas.height);
    
    if (clampLeft < sWidth && clampTop < sHeight) {
      const adjSx = startX + clampLeft;
      const adjSy = startY + clampTop;
      const adjSW = sWidth - clampLeft - clampRight;
      const adjSH = sHeight - clampTop - clampBottom;
      const scaleDX = (magWidth * dpr) / sWidth;
      const scaleDY = (magHeight * dpr) / sHeight;
      const adjDx = clampLeft * scaleDX;
      const adjDy = clampTop * scaleDY;
      const adjDW = adjSW * scaleDX;
      const adjDH = adjSH * scaleDY;
      
      if (adjSW > 0 && adjSH > 0 && adjDW > 0 && adjDH > 0) {
        mCtx.drawImage(targetCanvas, adjSx, adjSy, adjSW, adjSH, adjDx, adjDy, adjDW, adjDH);
      }
    }
  } catch (e) {
    console.error(e);
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

function openSidebarTab(tab) {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar.classList.contains("open") && sidebar.classList.contains("show-" + tab)) {
    sidebar.classList.remove("open");
    return;
  }
  sidebar.classList.remove("show-adjustment", "show-font", "show-quick", "show-option");
  sidebar.classList.add("show-" + tab);
  sidebar.classList.add("open");
}

/* ---------- Init ---------- */
applyFooterPreview();