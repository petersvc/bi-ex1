const danfo = require("danfojs-node");
const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  host: "postgres-bi",
  user: "postgres",
  password: "postgres",
  database: "bi",
  port: 5432,
});

const definicoesTabelas = {
  fornecedores: `
    CREATE TABLE IF NOT EXISTS fornecedores (
      "FornecedorID" TEXT PRIMARY KEY,
      "FornecedorNome" TEXT
    );
  `,
  transportadoras: `
    CREATE TABLE IF NOT EXISTS transportadoras (
      "TransportadoraID" TEXT PRIMARY KEY,
      "TransportadoraNome" TEXT
    );
  `,
  vendedores: `
    CREATE TABLE IF NOT EXISTS vendedores (
      "VendedorID" TEXT PRIMARY KEY,
      "VendedorNome" TEXT
    );
  `,
  vendas: `
    CREATE TABLE IF NOT EXISTS vendas (
      "VendaID" SERIAL PRIMARY KEY,
      "PedidoID" TEXT,
      "CategoriaID" TEXT,
      "CategoriaNome" TEXT,
      "CategoriaDescrição" TEXT,
      "ClienteID" TEXT,
      "ClienteNome" TEXT,
      "ClienteContato" TEXT,
      "ClienteCidade" TEXT,
      "ClientePaísID" TEXT,
      "ClientePaís" TEXT,
      "Vendas Custo" NUMERIC,
      "Margem Bruta" NUMERIC,
      "Vendas" NUMERIC,
      "Desconto" NUMERIC,
      "Frete" NUMERIC,
      "Qtde" INTEGER,
      "Data" DATE,
      "VendedorID" TEXT REFERENCES vendedores("VendedorID"),
      "ProdutoID" TEXT,
      "ProdutoNome" TEXT,
      "TransportadoraID" TEXT REFERENCES transportadoras("TransportadoraID"),
      "FornecedorID" TEXT REFERENCES fornecedores("FornecedorID")
    );
  `
};

async function criarTabelas() {
  for (const [nome, ddl] of Object.entries(definicoesTabelas)) {
    console.log(`🛠️  Criando tabela: ${nome}`);
    await client.query(ddl);
  }
}

function limparColunas(colunas) {
  return colunas.map(c => c.trim().replace(/\uFEFF/, ""));
}

async function inserirDados(nomeTabela, caminhoCSV) {
  const df = await danfo.readCSV(caminhoCSV);
  const colunasOriginais = limparColunas(df.columns);
  const colunas = colunasOriginais.filter(c => c !== "VendaID");

  for (let i = 0; i < df.shape[0]; i++) {
    const row = df.iloc({ rows: [i] }).values[0];
    if (row.every(val => val === null || val === undefined || val.toString().trim() === "")) continue;

    const values = row.slice(0, colunas.length).map((val, idx) => {
      let v = val?.toString().trim();
      const colName = colunas[idx];

      if (colName.toLowerCase() === "data" && v && v.includes("/")) {
        const [dia, mes, ano] = v.split("/");
        v = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      }

      return v ? v.replace(/'/g, "''") : null;
    });

    const insertQuery = `
      INSERT INTO ${nomeTabela} (${colunas.map(c => `"${c}"`).join(", ")})
      VALUES (${values.map(v => v === null ? "NULL" : `'${v}'`).join(", ")})
      ON CONFLICT DO NOTHING;
    `;
    await client.query(insertQuery);
  }

  console.log(`✅ Dados inseridos: ${nomeTabela}`);
}

async function importarDados() {
  await client.connect();
  await criarTabelas();

  const tabelas = Object.keys(definicoesTabelas);
  for (const tabela of tabelas) {
    const arquivo = `./csv_data/${tabela}.csv`;
    if (fs.existsSync(arquivo)) {
      await inserirDados(tabela, arquivo);
    } else {
      console.warn(`⚠️  Arquivo não encontrado: ${arquivo}`);
    }
  }

  await client.end();
}

module.exports = { importarDados };
