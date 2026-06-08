const baseUrl = "http://localhost:3000";

async function main() {
  const supervisorId = "4t9zzuwqq";
  const res = await fetch(baseUrl + "/api/team?supervisorId=" + supervisorId);
  const team = await res.json();
  console.log("Team:", team);

  if (team && team.length > 0) {
    const res2 = await fetch(baseUrl + "/api/users/" + team[0].id, {
      method: "DELETE"
    });
    console.log("Delete status for", team[0].id, ":", res2.status, await res2.text());
  }

  const res3 = await fetch(baseUrl + "/api/stores?supervisorId=" + supervisorId);
  const stores = await res3.json();
  console.log("Stores:", stores);

  if (stores && stores.length > 0) {
    const res4 = await fetch(baseUrl + "/api/stores/" + stores[0].id, {
      method: "DELETE"
    });
    console.log("Delete status for store", stores[0].id, ":", res4.status, await res4.text());
  }
}
main().catch(console.error);
