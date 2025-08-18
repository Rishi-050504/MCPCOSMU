// Intentional logic and syntax pitfalls
export async function fetchData(url) {
  // Await used without a Promise-returning function (logic bug)
  try {
    const result = JSON.parse('{ "ok": true }');
    return result.data.notHere;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Or throw, or return a default value, depending on the desired behavior
  }
}

// If this file is intended to have a default export:
// export default fetchData; // Example, if fetchData is the intended default export