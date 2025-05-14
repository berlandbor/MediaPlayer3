let stations = [];
const playlistGrid = document.getElementById("playlistGrid");
const fileInput = document.getElementById("fileInput");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("visible");
});

window.onload = () => {
  const saved = localStorage.getItem("media_autoload");
  if (saved) {
    try {
      stations = JSON.parse(saved);
      renderGrid();
    } catch (e) {
      console.error("Ошибка чтения базы:", e);
    }
  }
};

fileInput.addEventListener("change", handleFile);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    stations = parsePlaylist(reader.result, file.name);
    if (stations.length) {
      localStorage.setItem("media_autoload", JSON.stringify(stations));
      renderGrid();
    } else {
      alert("Плейлист пуст или нераспознан.");
    }
  };

  reader.readAsText(file);
  sidebar.classList.remove("visible");
}

function parsePlaylist(text, fileName) {
  const isM3U = fileName.endsWith(".m3u");
  const lines = text.split(/\r?\n/);
  const stations = [];

  let lastName = "", lastLogo = "", lastGroup = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.+)$/);
      lastName = nameMatch ? nameMatch[1].trim() : "Без названия";

      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      lastLogo = logoMatch && logoMatch[1].startsWith("http") ? logoMatch[1] : "";

      const groupMatch = line.match(/group-title="(.*?)"/);
      lastGroup = groupMatch ? groupMatch[1].trim() : "";

    } else if (line && !line.startsWith("#")) {
      const url = line;
      const name = lastName || url.split("/").pop();
      const logo = lastLogo || "https://via.placeholder.com/140x80?text=Канал";
      const group = lastGroup || null;
      stations.push({ name, url, logo, group });

      lastName = ""; lastLogo = ""; lastGroup = "";
    }
  }

  if (!isM3U) {
    lines.forEach(line => {
      const parts = line.split(" - ");
      if (parts.length === 2) {
        const [name, url] = parts;
        stations.push({
          name: name.trim(),
          url: url.trim(),
          logo: "https://via.placeholder.com/140x80?text=Канал",
          group: null
        });
      } else if (line.startsWith("http")) {
        stations.push({
          name: line.split("/").pop(),
          url: line,
          logo: "https://via.placeholder.com/140x80?text=Канал",
          group: null
        });
      }
    });
  }

  return stations;
}

function renderGrid() {
  playlistGrid.innerHTML = "";
  stations.forEach((station, i) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.onclick = () => openPlayer(station, i);

    const img = document.createElement("img");
    img.src = station.logo || "https://via.placeholder.com/140x80?text=Канал";
    img.alt = station.name;

    const nameEl = document.createElement("span");
    nameEl.textContent = station.name;

    const groupEl = document.createElement("span");
    groupEl.style.fontSize = "12px";
    groupEl.style.opacity = "0.7";
    groupEl.textContent = station.group || "";

    tile.appendChild(img);
    tile.appendChild(nameEl);
    if (station.group) tile.appendChild(groupEl);

    playlistGrid.appendChild(tile);
  });
}

function openPlayer(station, index) {
  const encodedName = encodeURIComponent(station.name);
  const encodedUrl = encodeURIComponent(station.url);
  const encodedLogo = encodeURIComponent(station.logo || "");
  window.open(`player.html?name=${encodedName}&url=${encodedUrl}&logo=${encodedLogo}&index=${index}`, "_blank");
}

function clearAutoload() {
  localStorage.removeItem("media_autoload");
  stations = [];
  playlistGrid.innerHTML = "";
  alert("Плейлист очищен.");
}