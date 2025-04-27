import express, { Express, NextFunction, Request, Response } from "express";
import { handle_acquire, handle_release, handle_describe } from "./ctrl_ip";
import 'dotenv/config'

const app: Express = express();

function asyncHandler(
  hander: any
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await hander(req, res);
    } catch (err) {
      res.status(500).send(err);
    }
  };
}

app.set("port", process.env.PORT || 3005); //  서버 포트
app.set("host", process.env.HOST || "0.0.0.0"); // 서버 아이피

app.get("/", (req: Request, res: Response) => {
  res.redirect("/static/index.html");
});

app.use('/static', express.static('static'))
app.post("/app/acquire", asyncHandler(handle_acquire))
app.post("/app/release", asyncHandler(handle_release))
app.post("/app/describe", asyncHandler(handle_describe))

app.listen(app.get("port"), app.get("host"), () =>
  console.log(
    "Server is running on : " + app.get("host") + ":" + app.get("port")
  )
);
