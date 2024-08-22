const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const corsOption = {
  origin: ["http://localhost:5173"],
  optionSuccessStatus: 200,
};

app.use(cors(corsOption));

app.use(express.json());

app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkEmail = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "このメールアドレスは使用されています" });
    }

    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, password]
    );

    res.status(201).json({
      message: "ユーザーの作成に成功しました",
      data: { id: newUser.rows[0].id },
    });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ message: "サーバー側でエラーが発生しました" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, email, password FROM users WHERE email = $1",
      [email]
    );

    const loginUser = result.rows[0];

    if (!loginUser) {
      res.status(401).json({ message: "ユーザー情報が登録されていません" });
    } else if (loginUser.email !== email || loginUser.password !== password) {
      res.status(401).json({ message: "入力情報に誤りがあります" });
    } else {
      res.status(200).json({
        id: loginUser.id,
        message: "ログインに成功しました",
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

app.get("/api/todos/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const getTask = await pool.query("SELECT * FROM todos WHERE user_id = $1", [
      user_id,
    ]);
    res.json(getTask.rows);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/todos/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { text } = req.body;

  try {
    const addTask = await pool.query(
      "INSERT INTO todos (text, completed, user_id) VALUES ($1, $2, $3) RETURNING *",
      [text, false, user_id]
    );
    res.status(201).json(addTask.rows[0]);
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    const putTask = await pool.query(
      "UPDATE todos SET completed = $1 WHERE id = $2  RETURNING *",
      [completed, id]
    );
    if (putTask.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(putTask.rows[0]);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const patchTask = await pool.query(
      "UPDATE todos SET text = $1 WHERE id = $2 RETURNING *",
      [text, id]
    );
    if (patchTask.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(patchTask.rows[0]);
  } catch (error) {
    console.error("Error updating todo text:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteTask = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );
    if (deleteTask.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
