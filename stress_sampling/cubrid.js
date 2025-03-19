import CUBRID from 'node-cubrid';
import Query from 'node-cubrid/src/query/Query.js'
import {expect} from 'chai'
import * as fs from "node:fs";
import {report} from "./common.js";

const tableName = "stress_test_cubrid"


const dbConfig = {
    host: 'localhost',      // CUBRID server address
    port: 33000,            // CUBRID port (default: 33000)
    user: 'dba',            // CUBRID user (default: dba)
    password: '',           // CUBRID password (empty for dba)
    database: 'demodb',     // Name of your database
};

const client = new CUBRID.createConnection(dbConfig);


async function performAction(client, key, action) {
    const start = Date.now();
    // await client.beginTransaction()
    await action()
    // await client.commit()
    let d = Date.now() - start
    if(!report["cubrid"]){
        report["cubrid"] = {[key]: []}
    }else if(!report["cubrid"][key]){
        report["cubrid"][key] = []
    }
    report["cubrid"][key].push(d);

}

export async function initCubrid() {
    await client.connect();
    await client.query(`DROP TABLE IF EXISTS ${tableName}`);
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName}
        (
            id
            INT PRIMARY KEY,
            name
            VARCHAR
        (
            100
        ),
            age INT
            );
    `;
    await client.query(createTableQuery);
}


export async function insertCubrid(stressLoad, sampling) {
    await performAction(client, "insert", async function () {
        for (let i = 0; i < stressLoad; i++) {
            await client.execute(`INSERT INTO ${tableName} (id, name, age)
                                  VALUES (?, ?, ?)`, [i, `Test Name ${i}`, 30 + (i % 50)])

        }
    });
}

export async function selectCubrid(stressLoad, sampling) {
    await performAction(client, "select", async function () {
        await client.query(`SELECT *
                            FROM ${tableName} limit ${stressLoad}`);
    });
}

export async function updateCubrid(stressLoad, sampling) {
    await performAction(client, "update", async function () {
        for (let i = 0; i < stressLoad; i++) {
            await client.execute(`UPDATE  ${tableName} SET age = age + 1 WHERE id = ?`, i);
        }
    })
}

export async function deleteCubrid(stressLoad, sampling) {
    await performAction(client, "delete", async function () {
        for (let i = 0; i < stressLoad; i++) {
            await client.execute(`DELETE FROM ${tableName} WHERE id = ?`, i);
        }
    })
}