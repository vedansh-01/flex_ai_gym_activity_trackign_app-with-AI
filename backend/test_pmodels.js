async function fetchPollinations() {
  try {
    const res = await fetch("https://text.pollinations.ai/models");
    const data = await res.json();
    console.log("POLLINATIONS MODELS:", data.map(m => m.name || m.id));
  } catch(e) {
    console.error(e);
  }
}
fetchPollinations();
