import app from "./app.js";

const port = 3030;

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
})