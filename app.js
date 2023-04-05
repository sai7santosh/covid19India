const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message} `);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (DbObject) => {
  return {
    stateId: DbObject.state_id,
    stateName: DbObject.state_name,
    population: DbObject.population,
  };
};

//Get States

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM
    state;`;
  const statesDetails = await db.all(getStatesQuery);
  response.send(
    statesDetails.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

// Get Specific State
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT * FROM 
    state
    WHERE
    state_id = ${stateId};`;
  const stateDetails = await db.get(getStateDetailsQuery);
  response.send(convertDbObjectToResponseObject(stateDetails));
});

// Create District
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `
    INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

const convertDistrictDbObjectToResponseObject = (DbObject) => {
  return {
    districtId: DbObject.district_id,
    districtName: DbObject.district_name,
    stateId: DbObject.state_id,
    cases: DbObject.cases,
    cured: DbObject.cured,
    active: DbObject.active,
    deaths: DbObject.deaths,
  };
};

//Get District
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM
    district
    WHERE
    district_id = ${districtId};`;
  const districtDetails = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(districtDetails));
});

//Delete District
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
    district
    WHERE
    district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update District
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE 
    district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE 
    district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get Stats
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM
    district
    WHERE 
    state_id = ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//Get State Name
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
    SELECT state_id FROM
    district
    WHERE
    district_id = ${districtId};`;
  const stateIdResponse = await db.get(getStateIdQuery);

  const getStateNameQuery = `
    SELECT state_name as stateName FROM
    state
    WHERE
    state_id = ${stateIdResponse.state_id};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});
module.exports = app;
