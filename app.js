async function loadIntel() {
  const q = document.getElementById("search").value;
  const res = await fetch(`/api/intelligence?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  if (!data.length) {
    feed.innerHTML = "<p style='padding:1rem'>No high-signal events detected.</p>";
    return;
  }

  data.forEach(e => {
    feed.innerHTML += `
      <div class="card ${e.level}">
        <strong>${e.level}</strong>
        <h3>${e.title}</h3>
        <p>${e.location}</p>
        <p>${e.summary}</p>
        <small>Sources: ${e.sources} | Score: ${e.score}</small>
      </div>
    `;
  });
}

loadIntel();
