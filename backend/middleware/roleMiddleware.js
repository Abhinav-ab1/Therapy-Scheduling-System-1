function checkRole(requiredRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
      }

      // Normalize case for both sides
      const userRole = req.user.role.toLowerCase();
      const allowed = requiredRoles.map(r => r.toLowerCase());

      if (!allowed.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden. Access denied." });
      }

      //  check practitioners admin ke baad
     // if (userRole === "practitioner" && !req.user.isVerified) {
      //  return res.status(403).json({ message: "Practitioner not verified." });
      //}

      next();
    } catch (error) {
      console.error("Role Middleware Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default checkRole;
