async function listOpenRouterModels() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    const data = await response.json();
    const freeModels = data.data.filter(m => m.pricing.prompt === "0" && m.pricing.completion === "0");
    console.log("FREE MODELS:");
    freeModels.forEach(m => console.log(m.id));
  } catch(e) {
    console.error("Fetch failed", e);
  }
}
listOpenRouterModels();
