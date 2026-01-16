module.exports = function checkEnv(required = []) {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error("❌ Missing ENV:", missing.join(", "));
    return false;
  }

  console.log("✅ ENV loaded");
  return true;
};
