import express from "express";
import morgan from "morgan";
import cors from "cors";
import connect from "./db.js";
import swaggerUI from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
const server = express();
server.use(morgan("dev"));
server.use(cors());
server.use(express.json());

// swagger documentatie toevoegen
server.use("/api-doc", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

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

/**
 * @swagger
 * /vraagvanvandaag:
 *   get:
 *     summary: Get de vraag van de dag
 *     responses:
 *       200:
 *         description: Vraag van de dag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 question:
 *                   type: string
 *                   example: "wat is jou favorie kleur?"
 *       404:
 *         description: er is geen vraag gepland voor vandaag
 */
server.get("/vraagvanvandaag", customMiddleWare, async (req, res) => {
  try {
    const conn = await connect();
    const question = await getQuestionOfTheDay(conn);
    res.json(question);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/**
 * @swagger
 * /resultaten:
 *   get:
 *     summary: Get scores voor de vraag van de dag
 *     responses:
 *       200:
 *         description: Lijst van de scores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   score:
 *                     type: integer
 *                     example: 5
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /gemiddelde:
 *   get:
 *     summary: Get de gemiddelde score
 *     responses:
 *       200:
 *         description: De gemiddelde score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average:
 *                   type: integer
 *                   example: 4
 *       404:
 *         description: er zijn geen scores voor de vraag van de dag en er kan geen gemiddelde score verkregen worden
 *       500:
 *         description: Internal server error
 */
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
    const averageScore = Math.ceil(totalScore / scores.length);

    res.json({ average: averageScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /antwoorden:
 *   post:
 *     summary: Add een score voor de vraag van de dag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Score is succesvol toegevoegd
 *       400:
 *         description: Score kan niet "null" zijn
 *       500:
 *         description: Internal server error
 */
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
