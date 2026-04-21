const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { safeCreateSystemLog } = require("../utils/systemLog");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      await safeCreateSystemLog({
        level: 'WARNING',
        action: 'AUTH_LOGIN_FAILED',
        message: `Tentative de connexion avec un compte introuvable: ${email}`,
        entity: 'AUTH',
        metadata: { email }
      });
      return res.status(404).json({ message: "User not found" });
    }
    const isMatchedPassword = await bcrypt.compare(password, user.password);
    if (!isMatchedPassword) {
      await safeCreateSystemLog({
        level: 'WARNING',
        action: 'AUTH_LOGIN_FAILED',
        message: `Mot de passe invalide pour ${user.email}`,
        entity: 'AUTH',
        user,
        metadata: { email: user.email }
      });
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 1000,
    });
    res.json({ id: user._id, email: user.email, role: user.role, prenom: user.prenom, nom: user.nom, token });
    await safeCreateSystemLog({
      level: 'INFO',
      action: 'AUTH_LOGIN_SUCCESS',
      message: `Connexion réussie pour ${user.email}`,
      entity: 'AUTH',
      user,
      metadata: { role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login };
