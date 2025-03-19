import CUBRID from 'node-cubrid';
import Query from 'node-cubrid/src/query/Query.js'
import {expect} from 'chai'
import * as fs from "node:fs";
import {report} from "./share.js";


const dbConfig = {
    host: 'localhost',      // CUBRID server address
    port: 33000,            // CUBRID port (default: 33000)
    user: 'dba',            // CUBRID user (default: dba)
    password: '',           // CUBRID password (empty for dba)
    database: 'demodb',     // Name of your database
};

const stressLoad = 50000
const client = new CUBRID.createConnection(dbConfig);


async function performAction(client, key, action) {
    const start = Date.now();
    await action()

    let d = Date.now() - start
    if(!report["cubrid"]){
        report["cubrid"] = {"auto": {}}
    }else if(!report["cubrid"]["auto"]){
        report["cubrid"]["auto"] = {}
    }

    report["cubrid"]["auto"][key] = d

}

describe('CUBRID Performance Tests Auto', function() {
    this.timeout(3000000); // Set Mocha timeout to 30 seconds for long-running tests

    before(async function() {
        // Setup before all tests (create table if not exists)
        await client.connect();
        await client.query('DROP TABLE IF EXISTS performance_test');
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS performance_test (
        id INT PRIMARY KEY,
        name VARCHAR(100),
        age INT
      );
    `;
        await client.query(createTableQuery);
    });

    after(async function() {
        // Cleanup after tests (drop table)

        await client.close();

        fs.writeFileSync('./data.json', JSON.stringify(report), 'utf-8');
    });

    it('should perform an insert operation quickly', async function() {
        this.timeout(1000000); // Limit to 10 seconds for the insert operation
        const start = Date.now();
        // Insert 1000 rows
        client.beginTransaction()
        let preData = []

        await performAction(client, "insert", async function () {
            for (let i = 0; i < stressLoad; i++) {

                await client.execute(`INSERT INTO performance_test (id, name, age)
                                       VALUES (?, ?, ?)`, [i, `Test Name ${i}`, 30 + (i % 50)])

            }
        });
    });

    it('should perform a select operation quickly', async function() {
        this.timeout(50000); // Limit to 5 seconds for the select operation
        const start = Date.now();



        const result = await client.query(`SELECT *
                                               FROM performance_test limit ${stressLoad}`);
        const duration = Date.now() - start;
        expect(result.result.RowsCount).equal(stressLoad)

        report["cubrid"]["auto"]["select"] = duration
    });

    it('should perform an update operation quickly', async function() {
        this.timeout(100000); // Limit to 10 seconds for the update operation

        await performAction(client, "update", async function () {
            for (let i = 0; i < stressLoad; i++) {
                await client.execute('UPDATE performance_test SET age = age + 1 WHERE id = ?', i);
            }
        })

    });

    it('should perform a delete operation quickly', async function() {
        this.timeout(100000); // Limit to 10 seconds for the delete operation

        await performAction(client, "delete", async function () {
            for (let i = 0; i < stressLoad; i++) {
                await client.execute(`DELETE
                                     FROM performance_test
                                     WHERE id = ?`, i);
            }
        })
        // assert(duration < 5000, 'Delete operation took too long!');
    });
});
