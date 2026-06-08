const baseUrl = "http://localhost:3000";

async function main() {
  const supervisorId = "4t9zzuwqq";
  
  // Create a dummy user
  const res = await fetch(baseUrl + "/api/register", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "To Delete",
      email: "del@solar.com",
      role: 'promoter',
      password: "pass",
      supervisorId: "s1"
    })
  });
  const user = await res.json();
  console.log("Created user:", user);
  
  const res2 = await fetch(baseUrl + "/api/users/" + user.id, {
    method: 'DELETE'
  });
  console.log("Deleted user:", await res2.text());
}
main().catch(console.error);
