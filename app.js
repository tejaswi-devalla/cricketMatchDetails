const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
};
initializeDBAndServer();

const dBObjResponse = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const dbObjResponseMatch = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayers = `
    select * from player_details;`;
  const finalData = await db.all(getPlayers);
  response.send(finalData.map((eachPlayer) => dBObjResponse(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `
    select * from player_details where player_id = ${playerId};`;
  const player = await db.get(playerDetails);
  response.send(dBObjResponse(player));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDetails = `
    update player_details set player_name='${playerName}'
    where 
    player_id = ${playerId};`;
  await db.run(updateDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    select * from match_details where match_id = ${matchId};`;
  const dbResponse = await db.all(getMatchDetails);
  response.send(
    dbResponse.map((eachDetail) => dbObjResponseMatch(eachDetail))[0]
  );
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const allDetails = `
  select match_id,match,year from player_match_score natural join match_details where player_id = ${playerId};`;
  const dbDetails = await db.all(allDetails);
  response.send(dbDetails.map((eachDetail) => dbObjResponseMatch(eachDetail)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const MatchDetails = `
    select * from player_match_score natural join player_details where match_id = ${matchId};`;
  const dbMatchDetails = await db.all(MatchDetails);
  response.send(dbMatchDetails.map((details) => dBObjResponse(details)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreDetails = `
    select 
    player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_match_score natural join player_details where player_id = ${playerId};`;
  const dbRun = await db.get(playerScoreDetails);
  response.send(dbRun);
});

module.exports = app;
