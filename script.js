
// ==========================================
// EARTH INFORMATION JUKEBOX
// NASA Temperature + NOAA Ocean + Forest Data
// ==========================================

const series = {
  temperature: {
    title: "Temperature soundscape",
    label: "NASA GISTEMP · LOADING DATA",
    years: ["2020", "2021", "2022", "2023", "2024", "2025"],
    values: [0.8, 0.9, 1.0, 1.2, 1.4, 1.5],
    unit: "°C",
    description: "NASA global temperature anomaly data."
  },

  ocean: {
    title: "Ocean soundscape",
    label: "NOAA ERSST v5 · LOADING DATA",
    years: ["2020", "2021", "2022", "2023", "2024", "2025"],
    values: [18.440, 18.440, 18.483, 18.713, 18.767, 18.681],
    unit: "°C",
    description: "NOAA global ocean temperature data."
  },

  forest: {
    title: "Forest soundscape",
    label: "GLOBAL FOREST AREA · LOADING DATA",
    years: ["2020", "2021", "2022", "2023", "2024"],
    values: [0, 0, 0, 0, 0],
    unit: "km²",
    description: "Global forest area from Our World in Data."
  }
};

let topic = "temperature";
let audioContext = null;
let activeOscillator = null;
let activeGain = null;
let playbackTimer = null;
let pointIndex = 0;

const $ = id => document.getElementById(id);

const canvas = $("data-chart");
const ctx = canvas ? canvas.getContext("2d") : null;


// ==========================================
// CURRENT SERIES
// ==========================================

function currentSeries() {
  return series[topic];
}


// ==========================================
// GRAPH
// ==========================================

function drawChart() {
  if (!canvas || !ctx) return;

  const data = currentSeries();
  const values = data.values;

  if (!values.length) return;

  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, rect.width * dpr);
  canvas.height = Math.max(1, rect.height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  const pad = { l: 40, r: 15, t: 20, b: 32 };

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const extra = (max - min) * 0.18;
    min -= extra;
    max += extra;
  }

  const x = i =>
    pad.l + i * (w - pad.l - pad.r) /
    Math.max(1, values.length - 1);

  const y = value =>
    h - pad.b -
    ((value - min) / (max - min)) *
    (h - pad.t - pad.b);

  // Grid
  ctx.strokeStyle = "rgba(150,150,150,0.2)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 5; i++) {
    const gy = pad.t + i * (h - pad.t - pad.b) / 4;

    ctx.beginPath();
    ctx.moveTo(pad.l, gy);
    ctx.lineTo(w - pad.r, gy);
    ctx.stroke();
  }

  // Gradient
  const gradient = ctx.createLinearGradient(0, pad.t, 0, h);

  gradient.addColorStop(0, "rgba(30,180,160,0.35)");
  gradient.addColorStop(1, "rgba(30,180,160,0.02)");

  // Area
  ctx.beginPath();
  ctx.moveTo(x(0), y(values[0]));

  values.forEach((value, i) => {
    ctx.lineTo(x(i), y(value));
  });

  ctx.lineTo(x(values.length - 1), h - pad.b);
  ctx.lineTo(x(0), h - pad.b);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();

  values.forEach((value, i) => {
    if (i === 0) {
      ctx.moveTo(x(i), y(value));
    } else {
      ctx.lineTo(x(i), y(value));
    }
  });

  ctx.strokeStyle = "#20b9a5";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Data points
  values.forEach((value, i) => {
    ctx.beginPath();
    ctx.arc(x(i), y(value), 4, 0, Math.PI * 2);
    ctx.fillStyle = "#20b9a5";
    ctx.fill();
  });

  // Year labels
  ctx.fillStyle = "#888";
  ctx.font = "11px Arial";
  ctx.textAlign = "center";

  data.years.forEach((year, i) => {
    ctx.fillText(year, x(i), h - 8);
  });
}


// ==========================================
// TIMELINE + VALUE DISPLAY
// ==========================================

function updateSelection() {
  const data = currentSeries();
  const slider = $("timeline");

  if (!slider || !data.years.length) return;

  let i = Number(slider.value);

  i = Math.max(0, Math.min(i, data.years.length - 1));

  const selectedYear = data.years[i];
  const selectedValue = data.values[i];

  if ($("current-year")) {
    $("current-year").textContent = selectedYear;
  }

  if ($("timeline-output")) {
    $("timeline-output").textContent = selectedYear;
  }

  if ($("audio-description")) {
    $("audio-description").textContent =
      data.description +
      " | Year: " + selectedYear +
      " | Value: " + selectedValue.toFixed(3) +
      " " + data.unit;
  }

  drawChart();
}


// ==========================================
// SELECT TOPIC
// ==========================================

function selectTopic(next) {
  if (!series[next]) return;

  stopSound();

  topic = next;

  const data = currentSeries();

  if ($("story-title")) {
    $("story-title").textContent = data.title;
  }

  if ($("visual-label")) {
    $("visual-label").textContent = data.label;
  }

  document.querySelectorAll(".topic-card").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.topic === topic
    );
  });

  const slider = $("timeline");

  if (slider) {
    slider.min = 0;
    slider.max = Math.max(0, data.values.length - 1);
    slider.value = 0;
  }

  updateSelection();

  if ($("status")) {
    $("status").textContent =
      "Selected " + topic + ". Press Play series to listen.";
  }
}


// ==========================================
// IMPROVED AUDIO FREQUENCY MAPPING
// ==========================================

function frequencyForValue(value, values) {

  // Valid data values only
  const validValues = values.filter(Number.isFinite);

  if (!validValues.length || !Number.isFinite(value)) {
    return 440;
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  // Same values = reference tone
  if (min === max) return 440;

  // Normalize data between 0 and 1
  const normalized = Math.max(
    0,
    Math.min(1, (value - min) / (max - min))
  );

  // Logarithmic pitch mapping
  // Lowest value = 220 Hz
  // Highest value = 880 Hz

  return 220 * Math.pow(2, normalized * 2);
}


// ==========================================
// STOP CURRENT TONE
// ==========================================

function stopCurrentTone() {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
    } catch (error) {}

    activeOscillator.disconnect();
    activeOscillator = null;
  }

  if (activeGain) {
    activeGain.disconnect();
    activeGain = null;
  }
}


// ==========================================
// PLAY ONE DATA POINT
// ==========================================

function playPoint(i) {
  const data = currentSeries();

  if (i < 0 || i >= data.values.length) return;

  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  stopCurrentTone();

  // Calculate frequency from actual data value
  const frequency = frequencyForValue(
    data.values[i],
    data.values
  );

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  const volumeSlider = $("volume");

  let volume = volumeSlider
    ? Number(volumeSlider.value)
    : 0.5;

  if (volume > 1) volume = volume / 100;

  volume = Math.max(0, Math.min(1, volume));

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime
  );

  gain.gain.linearRampToValueAtTime(
    volume * 0.15,
    audioContext.currentTime + 0.05
  );

  gain.gain.setTargetAtTime(
    0.0001,
    audioContext.currentTime + 0.5,
    0.1
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.8);

  activeOscillator = oscillator;
  activeGain = gain;

  const slider = $("timeline");

  if (slider) slider.value = i;

  updateSelection();
}


// ==========================================
// PLAY SERIES
// ==========================================

function playSeries() {
  stopSound();

  const data = currentSeries();

  if (!data.values.length) return;

  pointIndex = 0;

  playPoint(pointIndex);

  playbackTimer = setInterval(() => {
    pointIndex++;

    if (pointIndex >= data.values.length) {
      stopSound();

      if ($("status")) {
        $("status").textContent = "Playback completed!";
      }

      return;
    }

    playPoint(pointIndex);

  }, 900);

  if ($("status")) {
    $("status").textContent =
      "Playing " + topic + " soundscape...";
  }
}


// ==========================================
// STOP SOUND
// ==========================================

function stopSound() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }

  stopCurrentTone();

  if ($("status")) {
    $("status").textContent = "Playback stopped.";
  }
}


// ==========================================
// CSV PARSER
// ==========================================

function parseCSVLine(line) {
  const result = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  result.push(value.trim());

  return result;
}


// ==========================================
// NASA TEMPERATURE DATA
// ==========================================

async function loadNASATemperature() {
  try {
    if ($("status")) {
      $("status").textContent = "Loading NASA temperature data...";
    }

    const response = await fetch(
      "data/GLB.Ts+dSST.csv",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("NASA CSV error: HTTP " + response.status);
    }

    const csvText = await response.text();

    const lines = csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter(line => line.trim() !== "");

    const headerIndex = lines.findIndex(line =>
      line.trim().startsWith("Year,") ||
      line.trim().startsWith('"Year",')
    );

    if (headerIndex === -1) {
      throw new Error("NASA CSV header not found.");
    }

    const headers = parseCSVLine(lines[headerIndex]);

    const annualIndex = headers.findIndex(
      h => h.trim() === "J-D"
    );

    const monthIndexes = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
      .map(month => headers.indexOf(month))
      .filter(index => index !== -1);

    if (annualIndex === -1 && monthIndexes.length === 0) {
      throw new Error("Temperature columns not found.");
    }

    const nasaYears = [];
    const nasaValues = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);

      const year = Number(row[0]);

      if (!Number.isInteger(year)) continue;

      let value = NaN;

      if (annualIndex !== -1) {
        value = Number(row[annualIndex]);
      }

      if (!Number.isFinite(value) && monthIndexes.length > 0) {
        const monthlyValues = monthIndexes
          .map(index => Number(row[index]))
          .filter(number => Number.isFinite(number));

        if (monthlyValues.length > 0) {
          value = monthlyValues.reduce((a, b) => a + b, 0) /
            monthlyValues.length;
        }
      }

      if (Number.isFinite(value)) {
        nasaYears.push(String(year));
        nasaValues.push(value);
      }
    }

    if (!nasaYears.length) {
      throw new Error("No NASA records found.");
    }

    const start = Math.max(0, nasaYears.length - 12);

    series.temperature.years = nasaYears.slice(start);
    series.temperature.values = nasaValues.slice(start);

    series.temperature.label =
      "NASA GISTEMP · GLOBAL ANNUAL ANOMALY";

    series.temperature.description =
      "NASA GISTEMP global annual temperature anomalies.";

    if (topic === "temperature") {
      selectTopic("temperature");
    }

    if ($("status")) {
      $("status").textContent =
        "NASA temperature data loaded successfully!";
    }

  } catch (error) {
    console.error("NASA temperature error:", error);

    if ($("status")) {
      $("status").textContent =
        "NASA temperature loading failed: " + error.message;
    }
  }
}


// ==========================================
// NOAA OCEAN DATA
// ==========================================

async function loadOceanData() {
  try {
    if ($("status")) {
      $("status").textContent = "Loading NOAA ocean data...";
    }

    const response = await fetch(
      "data/ocean_temperature.csv",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Ocean CSV error: HTTP " + response.status);
    }

    const csv = await response.text();

    const lines = csv
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter(line => line.trim() !== "");

    const years = [];
    const values = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);

      const year = Number(columns[0]);
      const value = Number(columns[1]);

      if (
        Number.isFinite(year) &&
        Number.isFinite(value)
      ) {
        years.push(String(year));
        values.push(value);
      }
    }

    if (!years.length) {
      throw new Error("No valid ocean records found.");
    }

    series.ocean.years = years;
    series.ocean.values = values;

    series.ocean.label =
      "NOAA ERSST v5 · GLOBAL OCEAN TEMPERATURE";

    series.ocean.description =
      "NOAA global ocean temperature data.";

    if (topic === "ocean") {
      selectTopic("ocean");
    }

    if ($("status")) {
      $("status").textContent =
        "NOAA ocean data loaded successfully!";
    }

  } catch (error) {
    console.error("Ocean data error:", error);

    if ($("status")) {
      $("status").textContent =
        "Ocean data loading failed: " + error.message;
    }
  }
}


// ==========================================
// GLOBAL FOREST DATA
// ==========================================

async function loadForestData() {
  try {
    if ($("status")) {
      $("status").textContent = "Loading global forest data...";
    }

    const response = await fetch(
      "data/forest/forest_data.csv",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Forest CSV error: HTTP " + response.status);
    }

    const csv = await response.text();

    const lines = csv
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter(line => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("Forest CSV has no data rows.");
    }

    const headers = parseCSVLine(lines[0]).map(h =>
      h.trim().toLowerCase()
    );

    const yearIndex = headers.indexOf("year");
    const valueIndex = headers.indexOf("forest_area_km2");

    if (yearIndex === -1 || valueIndex === -1) {
      throw new Error(
        "Forest CSV must contain Year and Forest_Area_km2 columns."
      );
    }

    const years = [];
    const values = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);
      const year = Number(columns[yearIndex]);
      const value = Number(columns[valueIndex]);

      if (Number.isFinite(year) && Number.isFinite(value)) {
        years.push(String(year));
        values.push(value);
      }
    }

    if (!years.length) {
      throw new Error("No valid forest records found.");
    }

    series.forest.years = years;
    series.forest.values = values;
    series.forest.unit = "km²";

    series.forest.label =
      "OUR WORLD IN DATA · GLOBAL FOREST AREA";

    series.forest.description =
      "Global forest area in square kilometres. Source: Our World in Data, based on FAO data.";

    if (topic === "forest") {
      selectTopic("forest");
    }

    if ($("status")) {
      $("status").textContent =
        "Global forest data loaded successfully!";
    }

  } catch (error) {
    console.error("Forest data error:", error);

    if ($("status")) {
      $("status").textContent =
        "Forest data loading failed: " + error.message;
    }
  }
}


// ==========================================
// EVENT LISTENERS
// ==========================================

document.querySelectorAll(".topic-card").forEach(btn => {
  btn.addEventListener("click", () => {
    selectTopic(btn.dataset.topic);
  });
});

if ($("timeline")) {
  $("timeline").addEventListener("input", updateSelection);
}

if ($("play-button")) {
  $("play-button").addEventListener("click", playSeries);
}

if ($("stop-button")) {
  $("stop-button").addEventListener("click", stopSound);
}

window.addEventListener("resize", drawChart);


// ==========================================
// START PROJECT
// ==========================================

selectTopic("temperature");

loadNASATemperature();
loadOceanData();
loadForestData();

// EARTH JUKEBOX - Complete Voice Description

const voiceButton = document.getElementById("voice-button");

if (voiceButton) {
  voiceButton.addEventListener("click", function () {

    if (!("speechSynthesis" in window)) {
      alert("Voice is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const title =
      document.getElementById("story-title")?.textContent || "Earth data";

    const year =
      document.getElementById("current-year")?.textContent || "";

    const value =
      document.getElementById("audio-description")?.textContent || "";

    const chartDescription =
      document.getElementById("chart-note")?.textContent || "";

    const description = [
      "Welcome to Earth Information Jukebox.",
      "Selected module: " + title,
      "Selected year: " + year,
      "Data description: " + value,
      chartDescription
    ].filter(text => text.trim().length > 0).join(". ");

    const speech = new SpeechSynthesisUtterance(description);

    speech.lang = "en-US";
    speech.rate = 0.85;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
  });
}
