import odbc from 'odbc'

import assert from 'assert';
import fs from "node:fs";
import {expect} from "chai";
import {report} from "./share.js";

const stressLoad = 50000

// Define your database connection details
const connectionString = "driver={CUBRID Driver};server=localhost;port=33000;uid=dba;pwd=;db_name=demodb;"

let connection;
async function performAction(client, key, action) {
    const start = Date.now();
    await client.beginTransaction()
    await action()
    await client.commit()
    let d = Date.now() - start
    if(!report["odbc"]){
        report["odbc"] = {"auto": {}}
    }else if(!report["odbc"]["auto"]){
        report["odbc"]["auto"] = {}
    }


    report["odbc"]["auto"][key] = d

}
// Mocha test suite for performance testing
describe('ODBC Performance Tests', function() {
    this.timeout(5000000); // Set Mocha timeout to 30 seconds for long-running tests

    before(async function() {
        // Set up the connection before tests start
        connection = await odbc.connect(connectionString);
        console.log('Connected to the database!');

        // Create the test table if it does not exist
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS performance_test (
        id INT PRIMARY KEY,
        name VARCHAR(100),
        age INT
      );
    `;
        await connection.query('DROP TABLE IF EXISTS performance_test');
        await connection.query(createTableQuery);

    });

    after(async function() {
        // Clean up after tests (drop the table)

        await connection.close();
        console.log('Connection closed.');
        fs.writeFileSync('./data.json', JSON.stringify(report), 'utf-8');
    });

    it('should perform an insert operation quickly', async function() {
        this.timeout(1000000); // Limit to 10 seconds for the insert operation

        await performAction(connection, "insert", async function () {
            for (let i = 0; i < stressLoad; i++) {
                await connection.query(`INSERT INTO performance_test (id, name, age)
                                       VALUES (?, ?, ?)`, [i, `Test Name ${i}`, 30 + (i % 50)])
            }
        });

    });

    it('should perform a select operation quickly', async function() {
        this.timeout(500000); // Limit to 5 seconds for the select operation
        const start = Date.now();



        const result = await connection.query(`SELECT *
                                           FROM performance_test limit ${stressLoad}`);
        const duration = Date.now() - start;
        expect(result.length).to.equal(stressLoad);

        report["odbc"]["auto"]["select"] = duration
    });

    it('should perform an update operation quickly', async function() {
        this.timeout(1000000); // Limit to 10 seconds for the update operation
        await performAction(connection, "update", async function () {
            for (let i = 0; i < stressLoad; i++) {
                await connection.query('UPDATE performance_test SET age = age + 1 WHERE id = ?', [i]);
            }
        })
    });

    it('should perform a delete operation quickly', async function() {
        this.timeout(1000000); // Limit to 10 seconds for the delete operation
        await performAction(connection, "delete", async function () {
            for (let i = 0; i < stressLoad; i++) {

                await connection.query(`DELETE
                                     FROM performance_test
                                     WHERE id = ?`, [i]);
            }
        })
    });
});
