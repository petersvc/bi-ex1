import inquirer from "inquirer";
import pkg from "pg";
const { Client } = pkg;
import 'dotenv/config'

import { importarDados } from "./importarDados.js";

const client = new Client({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT
});

async function executarConsulta(sql) {
  const res = await client.query(sql);
  return res.rows;
}

async function exibirResposta(opcao) {
  let consulta;

  switch (opcao) {
    case 1:
      consulta = `
        SELECT "ClienteNome", SUM("Vendas") AS total_vendas
        FROM vendas
        GROUP BY "ClienteNome"
        ORDER BY total_vendas DESC
        LIMIT 10;
      `;
      break;
    case 2:
      consulta = `
        SELECT "ClientePaís", SUM("Vendas") AS total_vendas
        FROM vendas
        GROUP BY "ClientePaís"
        ORDER BY total_vendas DESC
        LIMIT 3;
      `;
      break;
    case 3:
      consulta = `
        SELECT "CategoriaNome", SUM("Vendas") AS total_vendas
        FROM vendas
        WHERE "ClientePaís" = 'Brazil'
        GROUP BY "CategoriaNome"
        ORDER BY total_vendas DESC;
      `;
      break;
    case 4:
      consulta = `
        SELECT t."TransportadoraNome", SUM(v."Frete") AS total_frete
        FROM vendas v
        JOIN transportadoras t ON t."TransportadoraID" = v."TransportadoraID"
        GROUP BY t."TransportadoraNome"
        ORDER BY total_frete DESC;
      `;
      break;
    case 5: // As questões 5 e 9 estão duplicadas?
      consulta = `
        SELECT "ClienteNome", SUM("Vendas") AS total_vendas
        FROM vendas
        WHERE "CategoriaNome" = 'Men´s Footwear'
          AND "ClientePaís" = 'Germany'
        GROUP BY "ClienteNome"
        ORDER BY total_vendas DESC;
      `;
      break;
    case 6:
      consulta = `
        SELECT v."VendedorID", vd."VendedorNome", SUM(v."Desconto") AS total_desconto
        FROM vendas v
        JOIN vendedores vd ON vd."VendedorID" = v."VendedorID"
        WHERE v."ClientePaís" = 'USA'
        GROUP BY v."VendedorID", vd."VendedorNome"
        ORDER BY total_desconto DESC;
      `;
      break;
    case 7:
      consulta = `
        SELECT f."FornecedorNome", SUM(v."Margem Bruta") AS total_margem
        FROM vendas v
        JOIN fornecedores f ON f."FornecedorID" = v."FornecedorID"
        WHERE v."CategoriaNome" = 'Womens wear'
        GROUP BY f."FornecedorNome"
        ORDER BY total_margem DESC;
      `;
      break;
    case 8:
      consulta = `
        WITH vendas_ano AS (
          SELECT 
            EXTRACT(YEAR FROM "Data") AS ano, 
            SUM("Vendas") AS total_vendas
          FROM vendas
          WHERE EXTRACT(YEAR FROM "Data") BETWEEN 2009 AND 2012
          GROUP BY ano
        )
        SELECT 
          ano, 
          total_vendas,
          CASE 
            WHEN ano = 2009 THEN 'N/A'  -- Para o primeiro ano, não há comparação
            WHEN total_vendas > LAG(total_vendas) OVER (ORDER BY ano) THEN 'vem crescendo'
            WHEN total_vendas = LAG(total_vendas) OVER (ORDER BY ano) THEN 'se mantendo estável'
            WHEN total_vendas < LAG(total_vendas) OVER (ORDER BY ano) THEN 'decaindo'
          END AS situacao_vendas
        FROM vendas_ano
        ORDER BY ano;
      `;
      break;
    case 9: // As questões 5 e 9 estão duplicadas?
      consulta = `
        SELECT "ClienteNome", SUM("Vendas") AS total_vendas
        FROM vendas
        WHERE "CategoriaNome" = 'Men´s Footwear'
          AND "ClientePaís" = 'Germany'
        GROUP BY "ClienteNome"
        ORDER BY total_vendas DESC;
      `;
      break;
    case 10:
      consulta = `
        SELECT "ClientePaís", COUNT(DISTINCT "PedidoID") AS total_pedidos
        FROM vendas
        GROUP BY "ClientePaís"
        ORDER BY total_pedidos DESC;
      `;
      break;
    default:
      console.log("Opção inválida!");
      return;
  }

  const resultado = await executarConsulta(consulta);
  console.log("\nResultado:");
  console.table(resultado);
}

export async function conectarBanco() {
  await client.connect();
  console.log("Conectado ao banco de dados!");
}

export async function mostrarMenu() {
  const choices = [
    "1 - Quem são os 10 maiores clientes, em termos de vendas ($)?",
    "2 - Quais os três maiores países, em termos de vendas ($)?",
    "3 - Quais as categorias de produtos que geram maior faturamento (vendas $) no Brasil?",
    "4 - Qual a despesa com frete envolvendo cada transportadora?",
    "5 - Quais os principais clientes (vendas $) de 'Men''s Footwear' na Alemanha?",
    "6 - Quais vendedores fizeram maiores descontos em vendas para clientes dos EUA?",
    "7 - Quais fornecedores mais lucraram com a categoria 'Womens wear'?",
    "8 - Qual a tendência de vendas entre 2009 e 2012?",
    "9 - Quais os 10 maiores clientes em termos de vendas?",
    "10 - Quantos pedidos foram realizados por país?",
    "11 - Importar dados CSV",
    "12 - Sair"
  ];

  let continuar = true;

  while (continuar) {
    const resposta = await inquirer.prompt([
      {
        type: "list",
        name: "opcao",
        message: "Escolha uma opção:",
        choices
      }
    ]);

    const escolha = resposta.opcao;

    if (escolha.startsWith("12")) {
      continuar = false;
      console.log("Encerrando...");
    } else if (escolha.startsWith("11")) {
      await importarDados();
    } else {
      const index = choices.indexOf(escolha);
      await exibirResposta(index + 1);
    }

    if (continuar) {
      const continuarResposta = await inquirer.prompt([
        {
          type: "confirm",
          name: "continuar",
          message: "Deseja fazer outra pergunta?",
          default: true
        }
      ]);

      continuar = continuarResposta.continuar;
    }
  }

  await client.end();

}

