// consultas.js
const { Client } = require("pg");

const client = new Client({
  host: "postgres-bi",
  user: "postgres",
  password: "postgres",
  database: "bi",
  port: 5432,
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
        WHERE "ClientePaís" = 'Brasil'
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
    case 5:
      consulta = `
        SELECT "ClienteNome", SUM("Vendas") AS total_vendas
        FROM vendas
        WHERE "CategoriaNome" = 'Men''s Footwear'
          AND "ClientePaís" = 'Alemanha'
        GROUP BY "ClienteNome"
        ORDER BY total_vendas DESC;
      `;
      break;
    case 6:
      consulta = `
        SELECT v."VendedorID", vd."VendedorNome", SUM(v."Desconto") AS total_desconto
        FROM vendas v
        JOIN vendedores vd ON vd."VendedorID" = v."VendedorID"
        WHERE v."ClientePaís" = 'Estados Unidos'
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
        SELECT EXTRACT(YEAR FROM "Data") AS ano, SUM("Vendas") AS total_vendas
        FROM vendas
        WHERE EXTRACT(YEAR FROM "Data") BETWEEN 2009 AND 2012
        GROUP BY ano
        ORDER BY ano;
      `;
      break;
    case 9:
      consulta = `
        SELECT "ClienteNome", SUM("Vendas") AS total_vendas
        FROM vendas
        WHERE "CategoriaNome" = 'Men''s Footwear'
          AND "ClientePaís" = 'Alemanha'
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

  // Executar a consulta e exibir os resultados
  const resultado = await executarConsulta(consulta);
  console.log("\nResultado:");
  console.table(resultado);
}

async function conectarBanco() {
  await client.connect();
  console.log("Conectado ao banco de dados!");
}

async function mostrarMenu() {
  const inquirer = require("inquirer");

  const resposta = await inquirer.prompt([
    {
      type: "list",
      name: "opcao",
      message: "Escolha uma opção:",
      choices: [
        "Importar dados CSV",
        "Quem são os 10 maiores clientes, em termos de vendas ($)?",
        "Quais os três maiores países, em termos de vendas ($)?",
        "Quais as categorias de produtos que geram maior faturamento (vendas $) no Brasil?",
        "Qual a despesa com frete envolvendo cada transportadora?",
        "Quais os principais clientes (vendas $) de 'Men''s Footwear' na Alemanha?",
        "Quais vendedores fizeram maiores descontos em vendas para clientes dos EUA?",
        "Quais fornecedores mais lucraram com a categoria 'Womens wear'?",
        "Qual a tendência de vendas entre 2009 e 2012?",
        "Quais os 10 maiores clientes em termos de vendas?",
        "Quantos pedidos foram realizados por país?"
      ]
    }
  ]);

  if (resposta.opcao === "Importar dados CSV") {
    const { importarDados } = require("./importarDados");
    await importarDados();
  } else {
    await exibirResposta(Object.keys(choices).indexOf(resposta.opcao) + 1);
  }

  await client.end();
}

module.exports = { conectarBanco, mostrarMenu };
