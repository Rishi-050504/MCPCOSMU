// Intentional logic and syntax pitfalls
export function isEven(n) {
  // Assignment instead of comparison (logic bug)
  if (n === 2) {
    return true;
  }
  return false;
}

export async function fetchData(url) {
  // Await used without a Promise-returning function (logic bug)
  const result = JSON.parse('{ "ok": true }');
  return result; // runtime error: property doesn't exist
}

// Missing export default, named exports may be misused elsewhere