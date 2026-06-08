const baseUrl = "http://localhost:3000";
async function main() {
  const supervisorId = "4t9zzuwqq";
  const res = await fetch(baseUrl + "/api/team?supervisorId=" + supervisorId);
  console.log(await res.json());
}
main();
