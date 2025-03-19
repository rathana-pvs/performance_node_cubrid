import odbc from 'odbc'

import assert from 'assert';
import fs from "node:fs";
import {expect} from "chai";
import {report} from "./common.js";


const tableName = "stress_test_odbc";
// Define your database connection details
const connectionString = "driver={CUBRID Driver};server=localhost;port=33000;uid=dba;pwd=;db_name=demodb;"
const connection = await odbc.connect(connectionString);

async function performAction(client, key, action) {
    const start = Date.now();
    // await client.beginTransaction()
    await action()
    // await client.commit()
    let d = Date.now() - start
    if (!report["odbc"]) {
        report["odbc"] = {[key]: []}
    }else if (!report["odbc"][key]){
        report["odbc"][key] = []
    }

    report["odbc"][key].push(d)
}

export async function initODBC(){
    console.log('Connected to the database!');

    // Create the test table if it does not exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT PRIMARY KEY,
        name VARCHAR(100),
        age INT
      );
    `;
    await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
    await connection.query(createTableQuery);
}
export async function insertODBC(stressLoad, sampling) {
    await performAction(connection, "insert", async function () {
        for (let i = 0; i < stressLoad; i++) {
i
            await connection.query(`INSERT INTO ${tableName} (id, name, age)
                                    VALUES (?, ?, ?)`, [i, `Test Name ${i}`, 30 + (i % 50)])
        }
    });
}


export async function selectODBC(stressLoad, sampling) {
    await performAction(connection, "select", async function () {

        await connection.query(`select * from ${tableName} limit ${stressLoad}`);

    });
}

export async function updateODBC(stressLoad, sampling) {
    await performAction(connection, "update", async function () {
        for (let i = 0; i < stressLoad; i++) {

            await connection.query(`UPDATE ${tableName} SET age = age + 1 WHERE id = ?`, [i]);
        }
    });
}

export async function deleteODBC(stressLoad, sampling) {
    await performAction(connection, "delete", async function () {
        for (let i = 0; i < stressLoad; i++) {

            await connection.query(`DELETE
                                    FROM ${tableName}
                                    WHERE id = ?`, [i]);
        }
    });
}