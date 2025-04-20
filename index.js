// index.js
const { conectarBanco, mostrarMenu } = require("./consultas");

async function iniciarApp() {
  await conectarBanco();
  await mostrarMenu();
}

iniciarApp();
