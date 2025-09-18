const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",     
  user: "root",         
  password: "SS@2006210", 
  database: "terratrade"   
});



module.exports = {db};