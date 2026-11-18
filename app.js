const express = require("express");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("node:path");
const User = require("./models/user");
require("dotenv").config();

if (!process.env.SECRET_JWT) {
  throw new Error("SECRET_JWT mangler i .env");
}

const app = express();
const cookieSettings = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/js", express.static(path.join(__dirname, "js")));

app.get("/login", function (req, res) {
  res.render("partials/login", { error: "", email: "" });
});

app.post("/login", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).render("partials/login", {
      error: "Skriv inn brukernavn og passord.",
      email: "",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).render("partials/login", {
        error: "Brukernavn eller passord er feil.",
        email: cleanEmail,
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.SECRET_JWT,
      { expiresIn: "1 day" },
    );

    res.cookie("authToken", token, {
      ...cookieSettings,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/");
  } catch (error) {
    console.error("Innlogging feilet:", error.message);
    res.status(500).render("partials/login", {
      error: "Kunne ikke logge inn. Prøv igjen senere.",
      email: cleanEmail,
    });
  }
});

app.get("/register-user", function (req, res) {
  res.render("partials/register", { error: "", email: "" });
});

app.post("/register-user", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const repeatPassword = req.body.repeatpassword;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof repeatPassword !== "string"
  ) {
    return res.status(400).send("Skriv inn brukernavn og passord.");
  }

  const cleanEmail = email.trim().toLowerCase();

  if (password !== repeatPassword) {
    return res.status(400).send("Passordene er ikke like.");
  }

  if (password.length < 8) {
    return res.status(400).send("Passordet må ha minst 8 tegn.");
  }

  try {
    const passwordHash = await argon2.hash(password);
    await User.create({ email: cleanEmail, passwordHash: passwordHash });
    res.redirect("/login");
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send("Brukernavnet er allerede brukt.");
    }

    console.error("Registrering feilet:", error.message);
    res.status(500).send("Kunne ikke opprette konto. Prøv igjen senere.");
  }
});

app.get("/", async function (req, res) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const tokenData = jwt.verify(token, process.env.SECRET_JWT);
    const user = await User.findById(tokenData.userId);

    if (!user) {
      res.clearCookie("authToken", cookieSettings);
      return res.redirect("/login");
    }

    res.render("partials/index", { email: user.email });
  } catch (error) {
    res.clearCookie("authToken", cookieSettings);

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.redirect("/login");
    }

    console.error("Kunne ikke hente brukeren:", error.message);
    res.status(500).send("Kunne ikke hente brukeren.");
  }
});

app.post("/logout", function (req, res) {
  res.clearCookie("authToken", cookieSettings);
  res.redirect("/login");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(function () {
    console.log("Koblet til MongoDB.");

    const port = process.env.PORT || 4000;
    app.listen(port, function () {
      console.log("Serveren kjører på port " + port);
    });
  })
  .catch(function (error) {
    console.error("Kunne ikke koble til MongoDB:", error.message);
    process.exit(1);
  });
