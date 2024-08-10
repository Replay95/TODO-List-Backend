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

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  pool.query(
    "SELECT email, password FROM users WHERE email = $1",
    [email],
    (errors, results) => {
      if (errors) throw errors;
      const user = results.rows[0];
      if (!user) {
        return res.status(401).send("ユーザー情報が登録されていません");
      }
      if (user.email !== email) {
        return res.status(401).send("メールアドレスが違います");
      }
      if (user.password !== password) {
        return res.status(401).send("パスワードが違います");
      }
      return res.status(200).send("ログインに成功しました");
    }
  );
});

app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkEmail = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(409).send("このメールアドレスは使用されています");
    }
    await pool.query("INSERT INTO users (email, password) VALUES ($1, $2)", [
      email,
      password,
    ]);

    res.status(201).send("ユーザーの作成に成功しました");
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).send("サーバー側でエラーが発生しました");
  }
});

app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/todos", async (req, res) => {
  const { text } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO todos (text, completed) VALUES ($1, $2) RETURNING *",
      [text, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    const result = await pool.query(
      "UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *",
      [completed, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const result = await pool.query(
      "UPDATE todos SET text = $1 WHERE id = $2 RETURNING *",
      [text, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating todo text:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
