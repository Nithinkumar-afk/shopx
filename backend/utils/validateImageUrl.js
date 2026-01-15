module.exports = function validateImageUrl(url) {
  if (!url) return false;

  const allowedDomains = [
    "res.cloudinary.com",
    "ik.imagekit.io",
  ];

  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain =>
      parsed.hostname.includes(domain)
    );
  } catch {
    return false;
  }
};
