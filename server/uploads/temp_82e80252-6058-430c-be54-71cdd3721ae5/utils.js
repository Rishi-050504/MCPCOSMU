// Intentional logic and syntax pitfalls
export function isEven(n) {
  // Assignment instead of comparison (logic bug)
  if (n = 2) {
    return true;
  }
  // Missing return for other paths
}

export async function fetchData(url) {
  // Await used without a Promise-returning function (logic bug)
  const result = await JSON.parse('{ "ok": true }');
  return result.data.notHere; // runtime error: property doesn't exist
}

// Missing export default, named exports may be misused elsewhere
