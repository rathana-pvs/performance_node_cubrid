import {insertCubrid, initCubrid, updateCubrid, deleteCubrid, selectCubrid} from "./cubrid.js";
import {initODBC, insertODBC,selectODBC, updateODBC, deleteODBC} from "./odbc_driver.js";
import {report} from "./common.js";
import CUBRID from "node-cubrid";

const stressLoad = 1000
const sampling = 20
const dbConfig = {
    host: 'localhost',      // CUBRID server address
    port: 33000,            // CUBRID port (default: 33000)
    user: 'dba',            // CUBRID user (default: dba)
    password: '',           // CUBRID password (empty for dba)
    database: 'demodb',     // Name of your database
};

const client = new CUBRID.createConnection(dbConfig);






async function insertTest() {
    for (let i = 0; i < sampling; i++) {
        await Promise.all([insertCubrid(stressLoad, sampling), insertODBC(stressLoad, sampling)]);
        await Promise.all([selectCubrid(stressLoad, sampling), selectODBC(stressLoad, sampling)]);
        await Promise.all([updateCubrid(stressLoad, sampling), updateODBC(stressLoad, sampling)]);
        await Promise.all([deleteCubrid(stressLoad, sampling), deleteODBC(stressLoad, sampling)]);

    }

}

// async function selectTest() {
//     for (let i = 0; i < sampling; i++) {
//         await Promise.all([selectCubrid(stressLoad), selectODBC(stressLoad)]);
//
//     }
// }

Promise.all([initCubrid(), initODBC()]).then(res=>{
    insertTest().then(res=>{
        console.log(report)
    })
});

