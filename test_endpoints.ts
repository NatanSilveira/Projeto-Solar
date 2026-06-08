const baseUrl = "http://localhost:3000";

async function main() {
  const supervisorId = "4t9zzuwqq";
  const endpoints = [
    "/api/products",
    `/api/expirations?supervisorId=${supervisorId}`,
    "/api/forms",
    `/api/form-responses?supervisorId=${supervisorId}`,
    `/api/team?supervisorId=${supervisorId}`,
    `/api/requests?supervisorId=${supervisorId}`,
    `/api/stores?supervisorId=${supervisorId}`
  ];

  for(const ep of endpoints) {
    try {
      const res = await fetch(baseUrl + ep);
      if(!res.ok) {
        console.log("FAILED:", ep, res.status, await res.text());
      } else {
        const data = await res.json();
        console.log("OK:", ep, "count:", Array.isArray(data) ? data.length : "not array");
      }
    } catch(e) {
      console.error("ERROR for", ep, e.message);
    }
  }
}

main().catch(console.error);
