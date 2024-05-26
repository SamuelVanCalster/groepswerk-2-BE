import express from "express";
import morgan from "morgan";
import cors from "cors";
import connect from "./db.js";
// import { checkSchema, validationResult } from "express-validator";
const server = express();
server.use(morgan("dev"));
server.use(cors());
server.use(express.json());

function customMiddleWare(req, res, next) {
  console.log("Deze boodschap werd geplaatst door mijn custom middleware");
  next();
}

// functie voor de vraag van de dag te krijgen
async function getQuestionOfTheDay(conn) {
  const [vragenResults] = await conn.query(
    "SELECT * FROM vragen WHERE DATE(gepland_op) = CURDATE()"
  );
  if (vragenResults.length === 0) {
    throw new Error("No question planned for today");
  }
  return vragenResults[0];
}

// functie om de scores van de vraag van vandaag te krijgen
async function getScoresForQuestion(conn, vraagId) {
  const [antwoordenResults] = await conn.query(
    "SELECT score FROM antwoorden WHERE vraag_id = ?",
    [vraagId]
  );
  return antwoordenResults;
}

// get endpoint voor de vraag van vandaag
server.get("/vraagvanvandaag", customMiddleWare, async (req, res) => {
  try {
    const conn = await connect();
    const question = await getQuestionOfTheDay(conn);
    res.json(question);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// get endpoint voor de scores van de vraag van vandaag
server.get("/resultaten", customMiddleWare, async (req, res) => {
  try {
    const conn = await connect();
    const question = await getQuestionOfTheDay(conn);
    const scores = await getScoresForQuestion(conn, question.id);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get endpoint voor het gemiddelde van de scores voor de vraag van vandaag
server.get("/gemiddelde", customMiddleWare, async (req, res) => {
  try {
    const conn = await connect();
    const question = await getQuestionOfTheDay(conn);
    const scores = await getScoresForQuestion(conn, question.id);

    if (scores.length === 0) {
      return res
        .status(404)
        .json({ message: "No scores found for today's question" });
    }

    const totalScore = scores.reduce((acc, row) => acc + row.score, 0);
    const averageScore = totalScore / scores.length;

    res.json({ average: averageScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// post endpoint voor het toevoegen van een score
server.post("/antwoorden", customMiddleWare, async (req, res) => {
  try {
    const conn = await connect();
    const question = await getQuestionOfTheDay(conn);

    const { score } = req.body;

    if (score === null) {
      return res.status(400).json({
        message: "Score cannot be null",
      });
    }

    await conn.query("INSERT INTO antwoorden (vraag_id, score) VALUES (?, ?)", [
      question.id,
      score,
    ]);

    res.status(201).json({ message: "Score added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(1234, () => {
  console.log("🚀 your server is listening on http://localhost:1234 🤘");
});
