import mysql from "mysql2/promise";

const connect = async () => {
  const conn = await mysql.createPool({
    host: "ID396978_VraagVanDeDag.db.webhosting.be",
    user: "ID396978_VraagVanDeDag",
    password: "S8v58Ty768PZR210X063",
    port: 3306,
    database: "ID396978_VraagVanDeDag",
  });
  return conn;
};

export default connect;
