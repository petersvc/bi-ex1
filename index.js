import { mostrarMenu, conectarBanco } from "./consultas.js";

async function iniciarApp() {
  await conectarBanco();
  await mostrarMenu();
}

iniciarApp();
