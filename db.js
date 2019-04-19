const url = require("url");
const pg = require("pg");
const dbConnectionString = process.env.DATABASE_URL;
const dbConfig = getDBconfigFromString(dbConnectionString);
const pool = new pg.Pool(dbConfig);
const uuidv1 = require("uuid/v1");

function getDBconfigFromString(connectionString) {
    if (connectionString == null || connectionString == "") {
        throw "Must have a DATABASE_URL environment variable set.";
    }

    const params = url.parse(connectionString);
    const auth = params.auth.split(":");

    const config = {
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        database: params.pathname.split("/")[1],
        ssl: true
    };
    return config;
}

exports.getPrice = function (vehicle) {
    var price = 0;

    switch (vehicle.model__c) {
        case "Flint":
            price = 30000;
            break;
        case "Flare":
            price = 40000;
            break;
        case "Flash":
            price = 50000;
            break;
    }

    switch (vehicle.battery__c) {
        case "75 kWh":
            price = price + 5000;
            break;
        case "100 kWh":
            price = price + 10000;
            break;
        case "100P kWh":
            price = price + 12000;
            break;
    }

    if (vehicle.self_driving__c == "true") {
        price = price + 3000;
    }

    if (vehicle.autopilot__c == "true") {
        price = price + 5000;
    }

    if (vehicle.sunroof__c == "true") {
        price = price + 1500;
    }

    if (vehicle.spoiler__c == "true") {
        price = price + 775;
    }

    if (vehicle.rear_seats__c == "true") {
        price = price + 1300;
    }

    if (vehicle.hydraulic_system__c == "true") {
        price = price + 1100;
    }

    return price;
};

exports.getAccountAndVehicleByUsername = function (username, callbackFunction) {
    var data = {
        account: {},
        vehicle: {
            model__c: "Flash",
            battery__c: "75 kWh",
            paint__c: "0",
            status__c: "Evaluation"
        }
    };

    if (!username) {
        callbackFunction(data);
        return;
    }

    exports.getAccountByUsername(username, account => {
        if (!account) {
            callbackFunction(data);
            return;
        }
        var names = account.name.split(" ");
        account.firstname = names[0];
        account.lastname = names[1];
        data.account = account;

        exports.getVehicleByUsername(username, vehicle => {
            if (vehicle) {
                console.log('Found vehicle');
                data.vehicle = vehicle;
            } else {
                console.log('No vehicle found');
                data.vehicle.account__c = data.account.sfid;
            }
            callbackFunction(data);
            return;
        });
    });
};

exports.getAccountByUsername = function (username, callbackFunction) {
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
            callbackFunction(null);
            return;
        }
        var query = {
            name: "fetch-account",
            text:
                "SELECT salesforce.Account.sfid, salesforce.Account.Name, salesforce.Account.Username__c " +
                "FROM salesforce.Account " +
                "WHERE username__c = $1",
            values: [username]
        };
        client.query(query, function (err, result) {
            done();
            if (err) {
                console.log(err);
                callbackFunction();
                return;
            }
            if (result.rowCount > 0) {
                callbackFunction(result.rows[0]);
            } else {
                callbackFunction();
            }
            return;
        });
    });
};

exports.getVehicleByUsername = function (username, callbackFunction) {
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
            callbackFunction(null);
            return;
        }
        var query = {
            name: "fetch-vehicle",
            text:
                "SELECT salesforce.Vehicle__c.sfid, salesforce.Vehicle__c.web_id__c, salesforce.Vehicle__c.Account__c, salesforce.Vehicle__c.Model__c, salesforce.Vehicle__c.Paint__c, salesforce.Vehicle__c.Autopilot__c, salesforce.Vehicle__c.Battery__c, salesforce.Vehicle__c.Rear_Seats__c, salesforce.Vehicle__c.Self_Driving__c, salesforce.Vehicle__c.Spoiler__c, salesforce.Vehicle__c.Hydraulic_System__c, salesforce.Vehicle__c.Sunroof__c, salesforce.Vehicle__c.Price__c, salesforce.Vehicle__c.Status__c, Salesforce.Vehicle__c.Year__c " +
                "FROM salesforce.Vehicle__c " +
                "INNER JOIN salesforce.Account ON (salesforce.Vehicle__c.Account__c = salesforce.Account.sfid) WHERE salesforce.Account.username__c = $1",
            values: [username]
        };
        client.query(query, function (err, result) {
            done();
            if (err) {
                console.log(err);
                callbackFunction();
                return;
            }
            if (result.rowCount > 0) {
                callbackFunction(result.rows[0]);
            } else {
                callbackFunction();
            }
            return;
        });
    });
};

exports.updateVehicle = function (vehicle, callbackFunction) {
    vehicle.price__c = exports.getPrice(vehicle);
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
            callbackFunction(null);
            return;
        }
        var query;
        if (vehicle.sfid || vehicle.web_id__c) {
            console.log("Updating " + vehicle.sfid);
            query = {
                name: "update-vehicle",
                text:
                    "UPDATE salesforce.Vehicle__c SET Model__c = $1, Paint__c = $2, Autopilot__c = $3, Battery__c = $4, Rear_Seats__c = $5, Self_Driving__c = $6, Spoiler__c = $7, Hydraulic_System__c = $8, Sunroof__c = $9, Price__c = $10, Status__c = $11 WHERE (sfid = $12 OR web_id__c = $13)",
                values: [
                    vehicle.model__c,
                    vehicle.paint__c,
                    vehicle.autopilot__c,
                    vehicle.battery__c,
                    vehicle.rear_seats__c,
                    vehicle.self_driving__c,
                    vehicle.spoiler__c,
                    vehicle.hydraulic_system__c,
                    vehicle.sunroof__c,
                    vehicle.price__c,
                    vehicle.status__c,
                    vehicle.sfid,
                    vehicle.web_id__c
                ]
            };
        } else {
            vehicle.web_id__c = uuidv1();
            console.log("Inserting " + vehicle.web_id__c);
            query = {
                name: "insert-vehicle",
                text:
                    "INSERT into salesforce.Vehicle__c(Web_ID__c, Account__c, Model__c, Year__c, Paint__c, Autopilot__c, Battery__c, Rear_Seats__c, Self_Driving__c, Spoiler__c, Hydraulic_System__c, Sunroof__c, Price__c, Status__c) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
                values: [
                    vehicle.web_id__c,
                    vehicle.account__c,
                    vehicle.model__c,
                    new Date().getFullYear().toString(),
                    vehicle.paint__c,
                    vehicle.autopilot__c,
                    vehicle.battery__c,
                    vehicle.rear_seats__c,
                    vehicle.self_driving__c,
                    vehicle.spoiler__c,
                    vehicle.hydraulic_system__c,
                    vehicle.sunroof__c,
                    vehicle.price__c,
                    vehicle.status__c
                ]
            };
        }
        client.query(query, function (err, result) {
            done();
            if (err) {
                console.log(err);
                callbackFunction();
                return;
            }
            callbackFunction(vehicle);
        });
    });
};
