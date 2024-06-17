import "dotenv/config";
import express, {Express, json, Request, Response, NextFunction } from "express";
import http from "http";


const app: Express = express();

app.use(json())


app.get('/hello', (req: Request, res: Response, next: NextFunction) => res.send('HELLO WORLD!!!'));

const server = http.createServer(app);

const onError = (error:any) =>  {
    
	if (error.syscall !== "listen") {
		throw error;
	}

	switch (error.code) {
		case "EACCES":
			process.exit(1);
			break;
		case "EADDRINUSE":
			process.exit(1);
			break;
		default:
			throw error;
	}
}


const onListening = () => {
	const addr = server.address();
	const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
	console.log(`Listening on ${bind}`);
    console.log(process.env.DB_CONNECTION)
}

const port = 3000


server.listen(port, () => {
	console.log(`listening at http://localhost:${port}`);
});

server.on("error", onError);
server.on("listening", onListening);

export default app;