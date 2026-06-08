const baseUrl = "http://localhost:3000";

async function main() {
  const supervisorId = "s1";
  const res = await fetch(baseUrl + "/api/register", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Tets Prom",
      email: "test.prom@solar.com",
      role: 'promoter',
      password: "pass",
      supervisorId: "s1",
      storeId: "st1"
    })
  });
  
  if(!res.ok) {
    console.log("FAIL", res.status, await res.text());
  } else {
    console.log("OK", await res.json());
  }
}
main().catch(console.error);
